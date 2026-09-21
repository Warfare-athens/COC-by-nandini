"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { CartItem, clearCartAfterCheckout, getCartItems, getCartToken } from "../cart-helper";
import { Signature } from "../components/Signature";
import { trackCommerceEvent } from "../analytics-helper";
import {
  ShieldCheck,
  Truck,
  Sparkles,
  Lock,
  ArrowRight,
  Gift,
  CheckCircle2,
  ChevronLeft,
  CreditCard,
  Banknote,
  Tag,
  MapPin,
} from "lucide-react";

const inputClass = "w-full rounded-xl border border-[#e8dbd1] bg-white px-4 py-3 text-sm text-[#2b1812] shadow-[0_1px_3px_rgba(43,24,18,0.03)] outline-none transition-all duration-200 placeholder:text-[#b09b93] hover:border-[#cfbeaf] focus:border-[#ba6a64] focus:bg-white focus:ring-3 focus:ring-[#ba6a64]/12";
const checkoutProfileKey = "coc-checkout-profile-v1";
const checkoutProfileLifetime = 183 * 86_400_000;
const emptyProfile = { fullName: "", email: "", phone: "", line1: "", line2: "", city: "", state: "", postalCode: "", country: "India" };
type CheckoutProfile = typeof emptyProfile;
type CheckoutField = keyof CheckoutProfile | "paymentMethod";

function saveProfileToDevice(fields: CheckoutProfile, payment: string) {
  localStorage.setItem(checkoutProfileKey, JSON.stringify({ fields, payment, updatedAt: Date.now(), expiresAt: Date.now() + checkoutProfileLifetime }));
}

function checkoutAttribution() {
  let referrer = sessionStorage.getItem("coc-referrer") || document.referrer || "";
  let source = sessionStorage.getItem("coc-source") || "";
  if (!source) {
    try { source = referrer ? new URL(referrer).hostname : "direct"; } catch { source = "direct"; referrer = ""; }
  }
  return {
    source,
    medium: sessionStorage.getItem("coc-medium") || (source === "direct" ? "none" : "referral"),
    campaign: sessionStorage.getItem("coc-campaign") || "none",
    landingPage: sessionStorage.getItem("coc-landing") || `${window.location.pathname}${window.location.search}`,
    referrer,
    device: window.innerWidth < 768 ? "mobile" as const : window.innerWidth < 1100 ? "tablet" as const : "desktop" as const,
  };
}

async function saveCheckoutProgress(fields: CheckoutProfile, lastField: CheckoutField, paymentMethod?: string) {
  const response = await fetch("/api/cart/lead", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ anonymousToken: getCartToken(), ...fields, paymentMethod, lastField, attribution: checkoutAttribution() }),
  });
  if (!response.ok) throw new Error("Unable to save checkout progress");
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && (window as unknown as { Razorpay?: unknown }).Razorpay) {
      return resolve(true);
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function CheckoutPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [profile, setProfile] = useState<CheckoutProfile>(emptyProfile);
  const [payment, setPayment] = useState("razorpay");
  const [placed, setPlaced] = useState(false);
  const [placedOrderNumber, setPlacedOrderNumber] = useState("");
  const [placedInvoiceUrl, setPlacedInvoiceUrl] = useState("");
  const [placedPaymentMethod, setPlacedPaymentMethod] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(2999);
  const [shippingCharge, setShippingCharge] = useState(149);
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const leadTimerRef = useRef<number | null>(null);
  const checkoutTrackedRef = useRef(false);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => {
      setItems(getCartItems());
      try {
        const saved = JSON.parse(localStorage.getItem(checkoutProfileKey) || "null") as { fields?: Partial<CheckoutProfile>; payment?: string; expiresAt?: number } | null;
        if (saved?.expiresAt && saved.expiresAt > Date.now() && saved.fields) {
          const restored = { ...emptyProfile, ...saved.fields };
          const restoredPayment = "razorpay";
          setProfile(restored);
          setPayment("razorpay");
          if (Object.values(restored).some((value) => value && value !== "India")) saveCheckoutProgress(restored, "country", restoredPayment).catch(() => undefined);
        } else if (saved) localStorage.removeItem(checkoutProfileKey);
      } catch {
        localStorage.removeItem(checkoutProfileKey);
      }
    }, 0);
    fetch("/api/storefront/settings")
      .then((response) => response.json())
      .then((data) => {
        setFreeShippingThreshold(Number(data.freeShippingThreshold || 2999));
        setShippingCharge(Number(data.shippingCharge || 149));
      })
      .catch(() => undefined);
    return () => window.clearTimeout(initialLoad);
  }, []);

  const parsePrice = (price: string) => Number.parseInt(price.replace(/[^\d]/g, ""), 10) || 0;
  const subtotal = items.reduce((sum, item) => sum + parsePrice(item.price) * item.quantity, 0);
  const shipping = subtotal >= freeShippingThreshold || subtotal === 0 ? 0 : shippingCharge;
  const total = Math.max(subtotal - discount + shipping, 0);

  useEffect(() => {
    if (!subtotal || checkoutTrackedRef.current) return;
    checkoutTrackedRef.current = true;
    trackCommerceEvent("checkout_started", { itemCount: items.reduce((sum, item) => sum + item.quantity, 0), subtotalInr: subtotal });
  }, [items, subtotal]);

  useEffect(() => () => {
    if (leadTimerRef.current) window.clearTimeout(leadTimerRef.current);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const refresh = window.setTimeout(async () => {
      const code = localStorage.getItem("coc-applied-coupon") || "";
      setCouponCode(code);
      if (!code || !subtotal) {
        setDiscount(0);
        return;
      }
      try {
        const response = await fetch("/api/coupons/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, subtotal }),
          signal: controller.signal,
        });
        const data = await response.json();
        if (response.ok) setDiscount(Number(data.discount || 0));
        else {
          setDiscount(0);
          setCouponCode("");
          localStorage.removeItem("coc-applied-coupon");
        }
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) setDiscount(0);
      }
    }, 0);
    return () => {
      window.clearTimeout(refresh);
      controller.abort();
    };
  }, [subtotal]);

  const giftThreshold = 3500;
  const giftUnlocked = subtotal >= giftThreshold;

  const [couponInput, setCouponInput] = useState("");
  const [couponMessage, setCouponMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  const applyCouponCode = async (codeToApply: string) => {
    const code = codeToApply.trim().toUpperCase();
    if (!code) return;
    setValidatingCoupon(true);
    setCouponMessage(null);
    try {
      const response = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, subtotal }),
      });
      const data = await response.json();
      if (response.ok) {
        const disc = Number(data.discount || 0);
        setDiscount(disc);
        setCouponCode(code);
        localStorage.setItem("coc-applied-coupon", code);
        setCouponMessage({ type: "success", text: `Coupon "${code}" applied! Saved ₹${disc.toLocaleString("en-IN")}` });
      } else {
        setCouponMessage({ type: "error", text: data.error || "Invalid coupon code" });
      }
    } catch {
      setCouponMessage({ type: "error", text: "Unable to validate coupon." });
    } finally {
      setValidatingCoupon(false);
    }
  };

  const removeCouponCode = () => {
    setCouponCode("");
    setDiscount(0);
    setCouponInput("");
    setCouponMessage(null);
    localStorage.removeItem("coc-applied-coupon");
  };

  const queueCheckoutSave = (fields: CheckoutProfile, lastField: CheckoutField, nextPayment = payment) => {
    saveProfileToDevice(fields, nextPayment);
    if (leadTimerRef.current) window.clearTimeout(leadTimerRef.current);
    leadTimerRef.current = window.setTimeout(() => {
      saveCheckoutProgress(fields, lastField, lastField === "paymentMethod" ? nextPayment : undefined).catch(() => undefined);
    }, 500);
  };

  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [pincodeStatus, setPincodeStatus] = useState<string | null>(null);

  const handlePostalCodeChange = async (val: string) => {
    const cleaned = val.replace(/\D/g, "").slice(0, 6);
    const next = { ...profile, postalCode: cleaned };
    setProfile(next);
    queueCheckoutSave(next, "postalCode");

    if (cleaned.length === 6) {
      setPincodeLoading(true);
      try {
        const res = await fetch(`/api/pincode/${cleaned}`);
        const data = await res.json();
        if (data.success && data.city && data.state) {
          const updated = {
            ...next,
            city: data.city,
            state: data.state,
          };
          setProfile(updated);
          queueCheckoutSave(updated, "city");
          setPincodeStatus(`${data.city}, ${data.state}`);
        } else {
          setPincodeStatus(null);
        }
      } catch {
        setPincodeStatus(null);
      } finally {
        setPincodeLoading(false);
      }
    } else {
      setPincodeStatus(null);
    }
  };

  const updateProfile = (field: keyof CheckoutProfile, value: string) => {
    const next = { ...profile, [field]: value };
    setProfile(next);
    queueCheckoutSave(next, field);
  };

  const updatePayment = (value: string) => {
    setPayment(value);
    queueCheckoutSave(profile, "paymentMethod", value);
  };

  const placeOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!items.length) return;
    if (leadTimerRef.current) window.clearTimeout(leadTimerRef.current);
    setSubmitting(true);
    setCheckoutError("");

    const form = new FormData(event.currentTarget);
    const fullName = String(form.get("fullName") || "").trim();
    const email = String(form.get("email") || "").trim();
    const rawPhone = String(form.get("phone") || "").trim();
    const phone = rawPhone.startsWith("+") ? rawPhone : (rawPhone ? `+91${rawPhone.replace(/\D/g, "")}` : "");
    const line1 = String(form.get("line1") || "").trim();
    const line2 = String(form.get("line2") || "").trim();
    const city = String(form.get("city") || "").trim();
    const state = String(form.get("state") || "").trim();
    const postalCode = String(form.get("postalCode") || "").trim();

    trackCommerceEvent("checkout_submitted", {
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotalInr: subtotal,
      totalInr: total,
      paymentMethod: payment,
      hasCoupon: Boolean(couponCode),
    });

    try {
      await saveCheckoutProgress(profile, "paymentMethod", payment);

      // 1. Create order in backend
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: { fullName, email, phone },
          address: { line1, line2, city, state, postalCode, country: "India" },
          items: items.map((item) => ({ name: item.name, size: item.size, quantity: item.quantity })),
          paymentMethod: payment,
          cartToken: getCartToken(),
          couponCode: couponCode || undefined,
          customerNote: giftUnlocked
            ? "Order includes 1 Free Luxury Festive Gift (Unlocked at ₹3,500+)"
            : undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        trackCommerceEvent("checkout_failed", { stage: "order", status: response.status });
        setCheckoutError(data.error || "Unable to place your order.");
        setSubmitting(false);
        return;
      }

      const orderNumber = data.orderNumber;

      // 2. Razorpay Flow
      if (payment === "razorpay") {
        const rzpOrderRes = await fetch("/api/payments/razorpay/order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderNumber,
            amountInr: total,
            customerName: fullName,
            customerEmail: email,
            customerPhone: phone,
          }),
        });

        const rzpData = await rzpOrderRes.json();
        if (!rzpOrderRes.ok) {
          trackCommerceEvent("checkout_failed", { stage: "razorpay_order", status: rzpOrderRes.status });
          setCheckoutError(rzpData.error || "Unable to initiate Razorpay payment.");
          setSubmitting(false);
          return;
        }

        if (rzpData.isDemo) {
          // Sandbox Demo Mode
          const verifyRes = await fetch("/api/payments/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderNumber,
              razorpay_order_id: rzpData.razorpayOrderId,
              razorpay_payment_id: "pay_demo_" + Date.now(),
              isDemo: true,
            }),
          });
          const verifyData = await verifyRes.json();
          clearCartAfterCheckout();
          setPlacedOrderNumber(orderNumber);
          setPlacedInvoiceUrl(verifyData.invoiceUrl || data.invoiceUrl || "");
          setPlacedPaymentMethod("Razorpay (Sandbox Verified)");
          setPlaced(true);
          setSubmitting(false);
          return;
        }

        // Live / Test Razorpay Modal
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          setCheckoutError("Payment gateway script could not be loaded. Please check your internet connection.");
          setSubmitting(false);
          return;
        }

        type RazorpayResponse = {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        };

        const options = {
          key: rzpData.keyId,
          amount: Math.round(total * 100),
          currency: rzpData.currency || "INR",
          name: "Carnival of Clothes",
          description: `Order ${orderNumber}`,
          image: "/logo.png",
          order_id: rzpData.razorpayOrderId,
          handler: async function (resp: RazorpayResponse) {
            try {
              const verifyRes = await fetch("/api/payments/razorpay/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  orderNumber,
                  razorpay_order_id: resp.razorpay_order_id,
                  razorpay_payment_id: resp.razorpay_payment_id,
                  razorpay_signature: resp.razorpay_signature,
                  isDemo: false,
                }),
              });
              const verifyData = await verifyRes.json();
              if (!verifyRes.ok) {
                setCheckoutError(verifyData.error || "Payment verification failed. Please contact support.");
                setSubmitting(false);
                return;
              }
              clearCartAfterCheckout();
              setPlacedOrderNumber(orderNumber);
              setPlacedInvoiceUrl(verifyData.invoiceUrl || data.invoiceUrl || "");
              setPlacedPaymentMethod("Razorpay (Online Payment)");
              setPlaced(true);
            } catch {
              setCheckoutError("Payment was captured, but confirmation is syncing. Reference: " + orderNumber);
            } finally {
              setSubmitting(false);
            }
          },
          prefill: {
            name: fullName,
            email: email,
            contact: phone,
          },
          theme: {
            color: "#bb7068",
          },
          modal: {
            ondismiss: function () {
              setSubmitting(false);
              setCheckoutError("Payment was not completed. You can retry paying online.");
            },
          },
        };

        const rzp = new (window as unknown as { Razorpay: new (opts: typeof options) => { open: () => void; on: (event: string, cb: (e: { error?: { description?: string } }) => void) => void } }).Razorpay(options);
        rzp.on("payment.failed", function (resp: { error?: { description?: string } }) {
          setSubmitting(false);
          setCheckoutError(resp.error?.description || "Payment failed. Please try again with another card or UPI.");
        });
        rzp.open();
      } else {
        // Cash on Delivery
        clearCartAfterCheckout();
        setPlacedOrderNumber(orderNumber);
        setPlacedInvoiceUrl(data.invoiceUrl || "");
        setPlacedPaymentMethod("Cash on Delivery");
        setPlaced(true);
        setSubmitting(false);
      }
    } catch {
      trackCommerceEvent("checkout_failed", { stage: "network", status: 0 });
      setCheckoutError("The connection was interrupted. Your cart is safe—please try again.");
      setSubmitting(false);
    }
  };

  if (placed) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#fbf4ee] px-5 selection:bg-[#e8b9b2] selection:text-[#3a2926]">
        <section className="w-full max-w-xl rounded-2xl border border-[#ebdcd0] bg-white p-8 text-center shadow-[0_24px_70px_rgba(90,46,36,0.08)] sm:p-12">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-gradient-to-tr from-[#ba6a64] to-[#a6544e] text-3xl text-white shadow-md">✓</div>
          <span className="mt-6 block text-[10px] font-bold uppercase tracking-[0.22em] text-[#ba6a64]">Order Confirmed</span>
          <h1 className="mt-3 font-['Instrument_Serif'] text-4xl text-[#2b1812] sm:text-5xl">Thank you for your order!</h1>
          <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-[#806f69]">
            Your Carnival edit is officially confirmed and being prepared with utmost care. A confirmation email has been dispatched.
          </p>

          <div className="mx-auto mt-6 max-w-xs rounded-xl border border-[#ebdcd0] bg-[#fffaf8] p-4 text-center shadow-2xs">
            <span className="block text-[10px] uppercase tracking-wider text-[#806f69]">Order Reference</span>
            <strong className="mt-1 block text-base font-semibold tracking-[0.1em] text-[#7e3d38]">{placedOrderNumber}</strong>
            {placedPaymentMethod && (
              <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#fcedea] px-3 py-1 text-[10px] font-medium text-[#ba6a64]">
                ✓ {placedPaymentMethod}
              </span>
            )}
          </div>

          {/* Instant WhatsApp Confirmation Card */}
          {profile.phone && placedOrderNumber && (
            <div className="mx-auto mt-5 max-w-sm rounded-2xl border border-[#c3e6cb] bg-[#f4fbf6] p-4 text-center shadow-2xs">
              <div className="flex items-center justify-center gap-1.5 text-[#155724]">
                <span className="text-base">💬</span>
                <strong className="text-xs font-semibold uppercase tracking-wider">WhatsApp Confirmation</strong>
              </div>
              <p className="mt-1 text-xs text-[#285b37]">
                Get live delivery updates and your tax invoice directly on WhatsApp.
              </p>
              <a
                href={`https://wa.me/91${profile.phone.replace(/\D/g, "").slice(-10)}?text=${encodeURIComponent(
                  `Hi! I just placed order #${placedOrderNumber} at Carnival of Clothes. Please send my confirmation and tracking updates here! ✨`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#20ba5a]"
              >
                <span>Receive on WhatsApp</span>
                <span>→</span>
              </a>
            </div>
          )}

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <a href={`/track-order?order=${placedOrderNumber}`} className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#ebdcd0] bg-[#fffaf8] px-6 text-xs font-semibold text-[#7e3d38] transition hover:border-[#ba6a64] hover:bg-[#fdf6f2]">
              Track order status →
            </a>
            {placedInvoiceUrl && (
              <a href={placedInvoiceUrl} className="inline-flex min-h-12 items-center justify-center rounded-full bg-gradient-to-r from-[#ba6a64] to-[#964742] px-6 text-xs font-semibold text-white shadow-md transition hover:opacity-90">
                View & print invoice
              </a>
            )}
          </div>
          <a href="/shop" className="mt-7 inline-flex text-xs font-semibold text-[#806f69] underline underline-offset-4 hover:text-[#ba6a64]">
            Continue exploring collections
          </a>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fbf4ee] font-['Work_Sans'] text-[#3a2926] selection:bg-[#e8b9b2] selection:text-[#3a2926]">
      <header className="sticky top-0 z-20 border-b border-[#ebdcd0] bg-white/90 px-4 py-3.5 backdrop-blur-md sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <a href="/" className="flex flex-col items-start font-['Instrument_Serif'] text-xl text-[#7e3d38] sm:text-2xl">
            Carnival of Clothes <Signature />
          </a>
          <a
            href="/shop"
            className="inline-flex items-center gap-1.5 rounded-full border border-[#ebdcd0] bg-[#fffaf7] px-3.5 py-1.5 text-xs font-medium text-[#7d675e] transition hover:border-[#ba6a64] hover:text-[#ba6a64]"
          >
            <ChevronLeft size={14} />
            <span>Continue Shopping</span>
          </a>
        </div>
      </header>

      <form onSubmit={placeOrder} className="mx-auto grid max-w-6xl gap-8 px-4 py-7 lg:grid-cols-[1fr_420px] lg:gap-10 lg:px-8 lg:py-10">
        <div className="space-y-6">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#ba6a64]">
              Carnival Boutique · Fast Checkout
            </span>
            <h1 className="mt-1.5 font-['Instrument_Serif'] text-4xl text-[#2b1812] sm:text-5xl">
              Complete Your Order
            </h1>
            <p className="mt-1 text-xs text-[#806f69]">
              Fill in your shipping details below to confirm your festive ensemble.
            </p>
          </div>

          {/* Section 1: Personal details */}
          <section className="rounded-2xl border border-[#ebdcd0] bg-[#fffdfb] p-5 sm:p-7 shadow-[0_4px_24px_rgba(58,41,38,0.04)]">
            <div className="mb-5 flex items-center justify-between border-b border-[#f2e6de] pb-3.5">
              <div className="flex items-center gap-2.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-tr from-[#ba6a64] to-[#a6544e] text-xs font-bold text-white shadow-xs">
                  01
                </span>
                <h2 className="text-sm font-semibold tracking-wider uppercase text-[#2b1812]" style={{ fontFamily: "'Work Sans', sans-serif" }}>
                  Personal Details
                </h2>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#faf1ec] px-2.5 py-0.5 text-[10px] font-semibold text-[#ba6a64]">
                Step 1 of 2
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-medium tracking-[0.06em] uppercase text-[#735d54] mb-1.5" style={{ fontFamily: "'Work Sans', sans-serif" }}>
                  Full Name <span className="text-[#ba6a64] font-bold">*</span>
                </label>
                <input
                  name="fullName"
                  value={profile.fullName}
                  onChange={(event) => updateProfile("fullName", event.target.value)}
                  className={inputClass}
                  required
                  autoComplete="name"
                  placeholder="e.g. Subodh Pawar"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-[11px] font-medium tracking-[0.06em] uppercase text-[#735d54] mb-1.5" style={{ fontFamily: "'Work Sans', sans-serif" }}>
                    Email Address <span className="text-[#ba6a64] font-bold">*</span>
                  </label>
                  <input
                    name="email"
                    value={profile.email}
                    onChange={(event) => updateProfile("email", event.target.value)}
                    className={inputClass}
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="name@example.com"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium tracking-[0.06em] uppercase text-[#735d54] mb-1.5" style={{ fontFamily: "'Work Sans', sans-serif" }}>
                    Phone Number <span className="text-[#ba6a64] font-bold">*</span>
                  </label>
                  <div className="relative flex items-center rounded-xl border border-[#e8dbd1] bg-white shadow-[0_1px_3px_rgba(43,24,18,0.03)] transition-all duration-200 hover:border-[#cfbeaf] focus-within:border-[#ba6a64] focus-within:ring-3 focus-within:ring-[#ba6a64]/12">
                    <div className="flex shrink-0 items-center border-r border-[#ebdcd0] bg-[#faf3ed] px-3.5 py-3 rounded-l-xl select-none">
                      <span className="text-xs font-bold text-[#6e5850]">+91</span>
                    </div>
                    <input
                      name="phone"
                      type="tel"
                      required
                      autoComplete="tel"
                      value={profile.phone.replace(/^\+91\s?/, "")}
                      onChange={(event) => {
                        const digits = event.target.value.replace(/\D/g, "").slice(0, 10);
                        updateProfile("phone", digits ? `+91${digits}` : "");
                      }}
                      className="w-full bg-transparent px-3.5 py-3 text-sm text-[#2b1812] outline-none placeholder:text-[#b09b93]"
                      placeholder="10-digit mobile number"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Delivery details */}
          <section className="rounded-2xl border border-[#ebdcd0] bg-[#fffdfb] p-5 sm:p-7 shadow-[0_4px_24px_rgba(58,41,38,0.04)]">
            <div className="mb-5 flex items-center justify-between border-b border-[#f2e6de] pb-3.5">
              <div className="flex items-center gap-2.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-tr from-[#ba6a64] to-[#a6544e] text-xs font-bold text-white shadow-xs">
                  02
                </span>
                <h2 className="text-sm font-semibold tracking-wider uppercase text-[#2b1812]" style={{ fontFamily: "'Work Sans', sans-serif" }}>
                  Delivery Details
                </h2>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f0f8f2] px-2.5 py-1 text-[10.5px] font-semibold text-[#276e2c]">
                <Truck size={12} /> Free Express Delivery
              </span>
            </div>

            <div className="space-y-4">
              {/* 1. First: City & State */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-[11px] font-medium tracking-[0.06em] uppercase text-[#735d54] mb-1.5" style={{ fontFamily: "'Work Sans', sans-serif" }}>
                    City <span className="text-[#ba6a64] font-bold">*</span>
                  </label>
                  <input
                    name="city"
                    value={profile.city}
                    onChange={(event) => updateProfile("city", event.target.value)}
                    className={inputClass}
                    required
                    autoComplete="address-level2"
                    placeholder="Enter city / town"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium tracking-[0.06em] uppercase text-[#735d54] mb-1.5" style={{ fontFamily: "'Work Sans', sans-serif" }}>
                    State <span className="text-[#ba6a64] font-bold">*</span>
                  </label>
                  <input
                    name="state"
                    value={profile.state}
                    onChange={(event) => updateProfile("state", event.target.value)}
                    className={inputClass}
                    required
                    autoComplete="address-level1"
                    placeholder="Enter state"
                  />
                </div>
              </div>

              {/* 2. Then: PIN Code & Country */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-[11px] font-medium tracking-[0.06em] uppercase text-[#735d54] mb-1.5" style={{ fontFamily: "'Work Sans', sans-serif" }}>
                    PIN Code <span className="text-[#ba6a64] font-bold">*</span>
                  </label>
                  <div className="relative">
                    <input
                      name="postalCode"
                      value={profile.postalCode}
                      onChange={(event) => handlePostalCodeChange(event.target.value)}
                      className={inputClass}
                      required
                      autoComplete="postal-code"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="6-digit PIN code"
                    />
                    {pincodeLoading && (
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2">
                        <svg className="h-4 w-4 animate-spin text-[#ba6a64]" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                      </span>
                    )}
                  </div>
                  {pincodeStatus && (
                    <p className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-[#276e2c]">
                      <CheckCircle2 size={12} className="text-[#2e7d32]" /> Auto-detected: {pincodeStatus}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-medium tracking-[0.06em] uppercase text-[#735d54] mb-1.5" style={{ fontFamily: "'Work Sans', sans-serif" }}>
                    Country
                  </label>
                  <div className="flex items-center justify-between rounded-xl border border-[#e8dbd1] bg-[#faf5f0] px-4 py-3 text-sm text-[#5a453b]">
                    <span className="flex items-center gap-2 font-medium">
                      <span className="h-2 w-2 rounded-full bg-[#2e7d32]" />
                      India (Domestic)
                    </span>
                    <span className="rounded bg-[#fcedea] px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-[#ba6a64]">
                      Prepaid
                    </span>
                    <input type="hidden" name="country" value="India" />
                  </div>
                </div>
              </div>

              {/* 3. Then: Address (Textarea) */}
              <div>
                <label className="block text-[11px] font-medium tracking-[0.06em] uppercase text-[#735d54] mb-1.5" style={{ fontFamily: "'Work Sans', sans-serif" }}>
                  Complete Address (House/Flat No., Building, Street, Landmark) <span className="text-[#ba6a64] font-bold">*</span>
                </label>
                <textarea
                  name="line1"
                  rows={3}
                  value={profile.line1}
                  onChange={(event) => updateProfile("line1", event.target.value)}
                  className={`${inputClass} resize-none leading-relaxed`}
                  required
                  autoComplete="street-address"
                  placeholder="Enter complete delivery address (House/Flat no., building, street, area, nearby landmark)"
                />
              </div>
            </div>
          </section>

          {/* Compact Trust Note */}
          <div className="flex items-center justify-center gap-2 rounded-xl border border-[#ebdcd0] bg-white/80 py-2.5 px-4 text-[11px] text-[#7d675e] shadow-2xs">
            <Lock size={12} className="text-[#ba6a64]" />
            <span>Prepaid online checkout powered by Razorpay · 256-bit SSL encrypted</span>
          </div>
        </div>

        {/* Aside: Sticky Order summary */}
        <aside aria-busy={submitting} className="h-max rounded-2xl border border-[#ebdcd0] bg-white p-6 shadow-[0_12px_32px_rgba(58,41,38,0.06)] lg:sticky lg:top-20">
          <div className="flex items-center justify-between pb-4 border-b border-[#ebdcd0]">
            <div className="flex items-center gap-2">
              <h2 className="font-['Instrument_Serif'] text-2xl text-[#2b1812]">Order Summary</h2>
              <span className="rounded-full bg-[#fcedea] px-2.5 py-0.5 text-[11px] font-semibold text-[#ba6a64]">
                {items.reduce((sum, item) => sum + item.quantity, 0)} {items.reduce((sum, item) => sum + item.quantity, 0) === 1 ? "item" : "items"}
                {giftUnlocked ? " + 1 Free Gift" : ""}
              </span>
            </div>
          </div>

          {items.length ? (
            <>
              {/* Items List (Includes Free Festive Gifts) */}
              <div className="mt-4 max-h-[340px] space-y-3 overflow-y-auto pr-1">
                {items.map((item) => (
                  <div
                    key={`${item.name}-${item.size}`}
                    className="flex items-center gap-3.5 rounded-xl border border-[#ebdcd0]/70 bg-[#fffdfb] p-2.5 transition hover:border-[#ba6a64]/30"
                  >
                    <div className="relative shrink-0 overflow-hidden rounded-lg border border-[#ebdcd0] bg-[#f8f2ec]">
                      <img
                        className="h-16 w-14 object-cover object-center"
                        src={item.img}
                        alt={item.name}
                      />
                      <span className="absolute -top-1.5 -right-1.5 grid h-5 w-5 place-items-center rounded-full bg-[#ba6a64] text-[10px] font-bold text-white shadow-xs">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className="text-[13px] font-semibold text-[#241814] leading-snug line-clamp-1"
                        style={{ fontFamily: "'Work Sans', sans-serif" }}
                        title={item.name}
                      >
                        {item.name}
                      </p>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className="rounded bg-[#f6ece5] px-1.5 py-0.5 text-[9.5px] font-medium text-[#7d675e]">
                          Size {item.size}
                        </span>
                        <span className="text-[10px] text-[#9c877f]">Qty: {item.quantity}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <strong className="text-xs font-bold text-[#2b1812]">
                        ₹{(parsePrice(item.price) * item.quantity).toLocaleString("en-IN")}
                      </strong>
                    </div>
                  </div>
                ))}

                {/* Single Complimentary Gift Unlocked at ₹3,500+ */}
                {giftUnlocked && (
                  <div className="flex items-center gap-3.5 rounded-xl border border-[#ba6a64]/30 bg-gradient-to-r from-[#fff9f7] to-[#fffdfb] p-2.5 shadow-2xs">
                    <div className="relative shrink-0 overflow-hidden rounded-lg border border-[#ebdcd0] bg-[#fdf2ee] h-16 w-14">
                      <img
                        className="h-full w-full object-cover object-center"
                        src="/gift-1.jpg"
                        alt="Complimentary Gift"
                      />
                      <span className="absolute -top-1.5 -right-1.5 grid h-5 w-5 place-items-center rounded-full bg-[#ba6a64] text-[10px] font-bold text-white shadow-xs">
                        1
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p
                          className="text-[13px] font-semibold text-[#241814] leading-snug line-clamp-1"
                          style={{ fontFamily: "'Work Sans', sans-serif" }}
                        >
                          Complimentary Luxury Gift
                        </p>
                        <span className="shrink-0 inline-flex items-center gap-0.5 rounded bg-[#fcedea] px-1.5 py-0.5 text-[8.5px] font-bold uppercase tracking-wider text-[#ba6a64]">
                          <Gift size={9} /> Free Gift
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className="rounded bg-[#f6ece5] px-1.5 py-0.5 text-[9.5px] font-medium text-[#7d675e]">
                          Surprise Festive Gift
                        </span>
                        <span className="text-[10px] text-[#2e7d32] font-semibold">Unlocked at ₹3,500</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <del className="block text-[10px] text-[#9c877f]">₹999</del>
                      <strong className="text-xs font-bold text-[#2e7d32]">FREE</strong>
                    </div>
                  </div>
                )}
              </div>

              {/* Coupon Code Section */}
              <div className="mt-4 border-t border-[#ebdcd0] pt-4">
                {couponCode ? (
                  <div className="flex items-center justify-between rounded-xl border border-[#a5d6a7] bg-[#f1f8f3] px-3.5 py-2.5 text-xs text-[#2e7d32]">
                    <div className="flex items-center gap-2 font-medium">
                      <Tag size={13} />
                      <span>Applied: <strong>{couponCode}</strong></span>
                    </div>
                    <button
                      type="button"
                      onClick={removeCouponCode}
                      className="text-[11px] font-semibold text-[#d32f2f] hover:underline cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      placeholder="Promo code (e.g. FESTIVE10)"
                      className="min-w-0 flex-1 rounded-xl border border-[#e5d2c5] bg-[#fffaf8] px-3.5 py-2 text-xs uppercase tracking-wider text-[#2b1812] placeholder:normal-case placeholder:tracking-normal placeholder:text-[#ab948c] focus:border-[#ba6a64] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => applyCouponCode(couponInput)}
                      disabled={validatingCoupon || !couponInput.trim()}
                      className="rounded-xl border border-[#ba6a64] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#ba6a64] transition hover:bg-[#ba6a64] hover:text-white disabled:opacity-50 cursor-pointer"
                    >
                      {validatingCoupon ? "..." : "Apply"}
                    </button>
                  </div>
                )}
                {couponMessage && (
                  <p className={`mt-1.5 text-[10px] ${couponMessage.type === "success" ? "text-[#2e7d32]" : "text-[#d32f2f]"}`}>
                    {couponMessage.text}
                  </p>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="mt-4 space-y-2.5 border-t border-[#ebdcd0] pt-4 text-xs text-[#6e5951]">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-medium text-[#2b1812]">₹{subtotal.toLocaleString("en-IN")}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-[#2e7d32]">
                    <span className="flex items-center gap-1 font-medium">
                      <Tag size={11} /> Discount ({couponCode})
                    </span>
                    <span className="font-semibold">-₹{discount.toLocaleString("en-IN")}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Express Shipping</span>
                  <span className="font-semibold text-[#2e7d32]">
                    {shipping === 0 ? "FREE" : `₹${shipping}`}
                  </span>
                </div>
                <div className="flex items-baseline justify-between border-t border-[#ebdcd0] pt-3 text-[#2b1812]">
                  <div>
                    <span className="text-sm font-semibold">Estimated Total</span>
                    <span className="block text-[10px] text-[#8e7870]">Includes all taxes</span>
                  </div>
                  <span className="font-['Instrument_Serif'] text-2xl font-normal sm:text-3xl text-[#2b1812]">
                    ₹{total.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* Submit CTA Button */}
              <button
                type="submit"
                disabled={submitting}
                className="checkout-submit-btn"
                style={{
                  background: "linear-gradient(135deg, #ba6a64 0%, #a6544e 50%, #8e3e38 100%)",
                  color: "#ffffff",
                  border: "1px solid rgba(255, 255, 255, 0.25)",
                  boxShadow: "0 10px 26px rgba(166, 84, 78, 0.38), inset 0 1px 1px rgba(255, 255, 255, 0.35)",
                  borderRadius: "12px",
                }}
              >
                <span className="checkout-submit-sheen" />

                {submitting ? (
                  <>
                    <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                    <span className="checkout-submit-label" style={{ color: "#ffffff" }}>
                      Processing Order...
                    </span>
                  </>
                ) : (
                  <>
                    <span className="checkout-submit-label" style={{ color: "#ffffff" }}>
                      Pay with Razorpay · ₹{total.toLocaleString("en-IN")}
                    </span>
                    <span
                      className="checkout-submit-icon-wrap"
                      style={{
                        color: "#ffffff",
                        backgroundColor: "rgba(255, 255, 255, 0.18)",
                      }}
                    >
                      <Lock size={13} strokeWidth={2.4} color="#ffffff" />
                    </span>
                  </>
                )}
              </button>

              {/* Reassurance Footer */}
              <div className="mt-4 flex flex-col items-center gap-2 text-[10px] text-[#8c746b]">
                <div className="flex items-center justify-center gap-3">
                  <span className="flex items-center gap-1">
                    <ShieldCheck size={12} className="text-[#ba6a64]" />
                    100% Secure Checkout
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Truck size={12} className="text-[#ba6a64]" />
                    Express Dispatch
                  </span>
                </div>
                <span className="flex items-center gap-1 text-[9.5px]">
                  <Sparkles size={11} className="text-[#ba6a64]" />
                  Authentic Silks & Handcrafted Silhouettes
                </span>
              </div>

              {checkoutError && (
                <p className="mt-4 rounded-xl border border-[#d99a8f] bg-[#fff0eb] p-3 text-xs text-[#a5534d]" role="alert">
                  {checkoutError}
                </p>
              )}
            </>
          ) : (
            <div className="py-10 text-center">
              <p className="text-sm text-[#806f69]">Your bag is currently empty.</p>
              <a href="/shop" className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#ba6a64] px-5 py-2.5 text-xs font-semibold text-white shadow-sm">
                Explore The Edit →
              </a>
            </div>
          )}
        </aside>
      </form>
    </main>
  );
}
