"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { CartItem, clearCartAfterCheckout, getCartItems, getCartToken } from "../cart-helper";
import { Signature } from "../components/Signature";
import { trackCommerceEvent } from "../analytics-helper";

const inputClass = "w-full rounded-lg border border-[#e8cdbc] bg-[#fffaf7] px-4 py-3 text-sm text-[#3a2926] outline-none transition placeholder:text-[#aa9188] focus:border-[#bb7068] focus:ring-2 focus:ring-[#bb7068]/15";
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

export default function CheckoutPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [profile, setProfile] = useState<CheckoutProfile>(emptyProfile);
  const [payment, setPayment] = useState("cod");
  const [placed, setPlaced] = useState(false);
  const [placedOrderNumber, setPlacedOrderNumber] = useState("");
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
          const restoredPayment = saved.payment === "razorpay" ? "razorpay" : "cod";
          setProfile(restored);
          setPayment(restoredPayment);
          if (Object.values(restored).some((value) => value && value !== "India")) saveCheckoutProgress(restored, "country", restoredPayment).catch(() => undefined);
        } else if (saved) localStorage.removeItem(checkoutProfileKey);
      } catch {
        localStorage.removeItem(checkoutProfileKey);
      }
    }, 0);
    fetch("/api/storefront/settings").then(response=>response.json()).then(data=>{setFreeShippingThreshold(Number(data.freeShippingThreshold||2999));setShippingCharge(Number(data.shippingCharge||149))}).catch(()=>undefined);
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

  const queueCheckoutSave = (fields: CheckoutProfile, lastField: CheckoutField, nextPayment = payment) => {
    saveProfileToDevice(fields, nextPayment);
    if (leadTimerRef.current) window.clearTimeout(leadTimerRef.current);
    leadTimerRef.current = window.setTimeout(() => {
      saveCheckoutProgress(fields, lastField, lastField === "paymentMethod" ? nextPayment : undefined).catch(() => undefined);
    }, 500);
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
    setSubmitting(true); setCheckoutError("");
    const form = new FormData(event.currentTarget);
    trackCommerceEvent("checkout_submitted", { itemCount: items.reduce((sum, item) => sum + item.quantity, 0), subtotalInr: subtotal, totalInr: total, paymentMethod: payment, hasCoupon: Boolean(couponCode) });
    try {
      await saveCheckoutProgress(profile, "paymentMethod", payment);
      const response = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        customer: { fullName: form.get("fullName"), email: form.get("email"), phone: form.get("phone") },
        address: { line1: form.get("line1"), line2: form.get("line2"), city: form.get("city"), state: form.get("state"), postalCode: form.get("postalCode"), country: "India" },
        items: items.map((item) => ({ name: item.name, size: item.size, quantity: item.quantity })), paymentMethod: payment, cartToken: getCartToken(), couponCode: couponCode || undefined,
      }) });
      const data = await response.json();
      if (!response.ok) {
        trackCommerceEvent("checkout_failed", { stage: "order", status: response.status });
        return setCheckoutError(data.error || "Unable to place your order.");
      }
      clearCartAfterCheckout();
      setPlacedOrderNumber(data.orderNumber); setPlaced(true);
    } catch {
      trackCommerceEvent("checkout_failed", { stage: "network", status: 0 });
      setCheckoutError("The connection was interrupted. Your cart is safe—please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (placed) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#fbf4ee] px-5 selection:bg-[#e8b9b2] selection:text-[#3a2926]">
        <section className="w-full max-w-xl rounded-2xl border border-[#e8cdbc] bg-[#fffaf7] p-8 text-center shadow-[0_24px_70px_rgba(90,46,36,0.1)] sm:p-12">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#f3dfd6] text-3xl text-[#bb7068]">✓</div>
          <span className="mt-6 block text-[10px] font-semibold uppercase tracking-[0.2em] text-[#bb7068]">Order received</span>
          <h1 className="mt-3 font-['Instrument_Serif'] text-4xl text-[#3a2926] sm:text-5xl">Thank you for your order</h1>
          <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-[#806f69]">Your Carnival edit is being prepared with care. A confirmation will be sent to your email.</p>
          <strong className="mt-5 block text-sm tracking-[0.12em] text-[#7e3d38]">{placedOrderNumber}</strong>
          <a href={`/track-order?order=${placedOrderNumber}`} className="mt-5 block text-xs font-semibold text-[#bb7068]">Track this order →</a>
          <a href="/" className="mt-8 inline-flex rounded-lg bg-[#bb7068] px-8 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-white">Continue shopping</a>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fbf4ee] font-['Work_Sans'] text-[#3a2926] selection:bg-[#e8b9b2] selection:text-[#3a2926]">
      <header className="border-b border-[#e8cdbc] bg-[#fffaf7] px-4 py-4 sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <a href="/" className="flex flex-col items-start font-['Instrument_Serif'] text-xl text-[#7e3d38] sm:text-2xl">Carnival of Clothes <Signature /></a>
          <a href="/" className="text-xs font-medium text-[#806f69] transition hover:text-[#bb7068]">← Continue shopping</a>
        </div>
      </header>

      <form onSubmit={placeOrder} className="mx-auto grid max-w-6xl gap-8 px-4 py-7 lg:grid-cols-[1fr_420px] lg:gap-12 lg:px-8 lg:py-10">
        <div className="space-y-6">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#bb7068]">Secure checkout</span>
            <h1 className="mt-2 font-['Instrument_Serif'] text-4xl sm:text-5xl">Complete your order</h1>
          </div>

          <section className="rounded-xl border border-[#e8cdbc] bg-[#fffaf7] p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-3"><span className="grid h-7 w-7 place-items-center rounded-full bg-[#f3dfd6] text-xs text-[#bb7068]">1</span><h2 className="text-sm font-semibold">Personal details</h2></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <input name="fullName" value={profile.fullName} onChange={(event)=>updateProfile("fullName",event.target.value)} className={`${inputClass} sm:col-span-2`} required autoComplete="name" placeholder="Full name" />
              <input name="email" value={profile.email} onChange={(event)=>updateProfile("email",event.target.value)} className={inputClass} type="email" required autoComplete="email" placeholder="Email address" />
              <input name="phone" value={profile.phone} onChange={(event)=>updateProfile("phone",event.target.value)} className={inputClass} type="tel" required autoComplete="tel" placeholder="Phone number" />
            </div>
          </section>

          <section className="rounded-xl border border-[#e8cdbc] bg-[#fffaf7] p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-3"><span className="grid h-7 w-7 place-items-center rounded-full bg-[#f3dfd6] text-xs text-[#bb7068]">2</span><h2 className="text-sm font-semibold">Delivery address</h2></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <input name="line1" value={profile.line1} onChange={(event)=>updateProfile("line1",event.target.value)} className={`${inputClass} sm:col-span-2`} required autoComplete="address-line1" placeholder="Address" />
              <input name="line2" value={profile.line2} onChange={(event)=>updateProfile("line2",event.target.value)} className={`${inputClass} sm:col-span-2`} autoComplete="address-line2" placeholder="Apartment, suite, etc. (optional)" />
              <input name="city" value={profile.city} onChange={(event)=>updateProfile("city",event.target.value)} className={inputClass} required autoComplete="address-level2" placeholder="City" />
              <input name="state" value={profile.state} onChange={(event)=>updateProfile("state",event.target.value)} className={inputClass} required autoComplete="address-level1" placeholder="State" />
              <input name="postalCode" value={profile.postalCode} onChange={(event)=>updateProfile("postalCode",event.target.value)} className={inputClass} required autoComplete="postal-code" inputMode="numeric" placeholder="PIN code" />
              <select name="country" value={profile.country} onChange={(event)=>updateProfile("country",event.target.value)} autoComplete="country-name" className={inputClass}><option>India</option></select>
            </div>
          </section>

          <section className="rounded-xl border border-[#e8cdbc] bg-[#fffaf7] p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-3"><span className="grid h-7 w-7 place-items-center rounded-full bg-[#f3dfd6] text-xs text-[#bb7068]">3</span><h2 className="text-sm font-semibold">Payment method</h2></div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[["cod", "Cash on delivery"]].map(([value, label]) => (
                <label className={`cursor-pointer rounded-lg border px-4 py-3 text-center text-xs transition ${payment === value ? "border-[#bb7068] bg-[#f7e6df] text-[#a95f5a]" : "border-[#e8cdbc]"}`} key={value}>
                  <input className="sr-only" type="radio" name="payment" value={value} checked={payment === value} onChange={() => updatePayment(value)} />{label}
                </label>
              ))}
            </div>
            {payment === "cod" && <p className="mt-4 rounded-lg bg-[#f7e6df] p-3 text-xs leading-5 text-[#806f69]">Pay in cash when your order arrives. Please keep the exact amount ready.</p>}
            <p className="mt-3 text-[10px] text-[#8c746b]">Online payments will be enabled after Razorpay is connected.</p>
          </section>
        </div>

        <aside aria-busy={submitting} className="h-max rounded-xl border border-[#e8cdbc] bg-[#fffaf7] p-5 lg:sticky lg:top-6 lg:p-6">
          <h2 className="font-['Instrument_Serif'] text-2xl">Order summary</h2>
          {items.length ? (
            <>
              <div className="mt-5 max-h-[330px] space-y-4 overflow-y-auto pr-1">
                {items.map((item) => (
                  <div className="grid grid-cols-[64px_1fr_auto] gap-3" key={`${item.name}-${item.size}`}>
                    <div className="relative"><img className="h-20 w-16 rounded-md border border-[#e8cdbc] object-cover" src={item.img} alt={item.name} /><span className="absolute -right-2 -top-2 grid h-5 w-5 place-items-center rounded-full bg-[#bb7068] text-[9px] text-white">{item.quantity}</span></div>
                    <div><h3 className="text-xs font-medium leading-5">{item.name}</h3><p className="mt-1 text-[10px] text-[#8c746b]">Size {item.size}</p></div>
                    <strong className="text-xs">₹{(parsePrice(item.price) * item.quantity).toLocaleString()}</strong>
                  </div>
                ))}
              </div>
              <div className="mt-6 space-y-3 border-t border-[#e8cdbc] pt-5 text-xs">
                <div className="flex justify-between"><span className="text-[#806f69]">Subtotal</span><span>₹{subtotal.toLocaleString()}</span></div>
                {discount > 0 && <div className="flex justify-between text-[#55785d]"><span>{couponCode}</span><span>−₹{discount.toLocaleString()}</span></div>}
                <div className="flex justify-between"><span className="text-[#806f69]">Shipping</span><span>{shipping ? `₹${shipping}` : "Free"}</span></div>
                <div className="flex justify-between border-t border-[#e8cdbc] pt-4 text-base font-semibold"><span>Total</span><span>₹{total.toLocaleString()}</span></div>
              </div>
              <button type="submit" className="mt-6 w-full rounded-lg bg-[#bb7068] py-4 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(187,112,104,0.24)] transition hover:bg-[#a95f5a]">Place order · ₹{total.toLocaleString()}</button>
              <p className="mt-4 text-center text-[9px] leading-4 text-[#8c746b]">Secure checkout · Easy returns · Order support on WhatsApp</p>
              {checkoutError && <p className="mt-4 rounded-md border border-[#d99a8f] bg-[#fff0eb] px-3 py-2 text-xs text-[#a5534d]" role="alert">{checkoutError}</p>}
            </>
          ) : (
            <div className="py-10 text-center"><p className="text-sm text-[#806f69]">Your cart is empty.</p><a href="/shop" className="mt-5 inline-block text-xs font-semibold text-[#bb7068]">Explore the collection →</a></div>
          )}
        </aside>
      </form>
    </main>
  );
}
