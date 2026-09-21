"use client";

import { useEffect, useRef, useState } from "react";
import {
  ShoppingBag,
  X,
  Plus,
  Minus,
  Trash2,
  Tag,
  ShieldCheck,
  Truck,
  Sparkles,
  ArrowRight,
  Gift,
  ChevronDown,
} from "lucide-react";
import { CartItem, getCartItems, removeFromCart, updateQuantity } from "../cart-helper";
import { showGlobalStatus } from "../global-status";
import { trackCommerceEvent } from "../analytics-helper";

interface CartSheetProps {
  open: boolean;
  onClose: () => void;
}

export default function CartSheet({ open, onClose }: CartSheetProps) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [coupon, setCoupon] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [isPriceBreakupOpen, setIsPriceBreakupOpen] = useState(false);
  const wasOpen = useRef(false);

  useEffect(() => {
    const loadItems = () => setItems(getCartItems());
    loadItems();
    const savedCoupon = localStorage.getItem("coc-applied-coupon");
    if (savedCoupon) {
      setAppliedCoupon(savedCoupon);
    }
    window.addEventListener("coc-cart-updated", loadItems);
    return () => window.removeEventListener("coc-cart-updated", loadItems);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  const parsePrice = (price: string) => Number.parseInt(price.replace(/[^\d]/g, ""), 10) || 0;
  const subtotal = items.reduce((sum, item) => sum + parsePrice(item.price) * item.quantity, 0);
  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const giftThreshold = 3500;
  const giftUnlocked = subtotal >= giftThreshold;
  const giftDiff = Math.max(giftThreshold - subtotal, 0);
  const giftProgress = Math.min((subtotal / giftThreshold) * 100, 100);

  const discount = appliedCoupon ? couponDiscount : 0;
  const estimatedTotal = Math.max(subtotal - discount, 0);

  useEffect(() => {
    if (open && !wasOpen.current) {
      const currentItems = getCartItems();
      trackCommerceEvent("cart_viewed", {
        itemCount: currentItems.reduce((sum, item) => sum + item.quantity, 0),
        subtotalInr: currentItems.reduce(
          (sum, item) => sum + (Number.parseInt(item.price.replace(/[^\d]/g, ""), 10) || 0) * item.quantity,
          0
        ),
      });
    }
    wasOpen.current = open;
  }, [open]);

  const applyCoupon = async () => {
    const normalized = coupon.trim().toUpperCase();
    if (!normalized) {
      return showGlobalStatus("Please enter a coupon code", "error");
    }
    setIsApplyingCoupon(true);
    try {
      const response = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: normalized, subtotal }),
      });
      const data = await response.json();
      if (!response.ok) {
        trackCommerceEvent("coupon_rejected", { code: normalized || "empty", subtotalInr: subtotal });
        return showGlobalStatus(data.error || "Coupon code is not valid", "error");
      }
      setAppliedCoupon(data.code);
      setCouponDiscount(Number(data.discount || 0));
      localStorage.setItem("coc-applied-coupon", data.code);
      trackCommerceEvent("coupon_applied", { code: data.code, discountInr: Number(data.discount || 0), subtotalInr: subtotal });
      showGlobalStatus("Coupon applied successfully", "success");
      setCoupon("");
    } catch {
      showGlobalStatus("Failed to apply coupon. Please try again.", "error");
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const removeCoupon = () => {
    trackCommerceEvent("coupon_removed", { code: appliedCoupon, discountInr: discount });
    setAppliedCoupon("");
    setCouponDiscount(0);
    localStorage.removeItem("coc-applied-coupon");
    showGlobalStatus("Coupon removed", "info");
  };

  const startCheckout = () => {
    trackCommerceEvent("checkout_started", {
      itemCount: totalCount,
      subtotalInr: subtotal,
      discountInr: discount,
    });
    window.location.assign("/checkout");
  };

  return (
    <div
      className={open ? "cart-layer visible" : "cart-layer"}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Shopping Bag"
    >
      <aside
        className="cart-sheet !w-[min(480px,100vw)] !overflow-hidden !bg-[#fdfbf9] !p-0 shadow-[-20px_0_50px_rgba(43,24,18,0.18)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="cart-content relative flex h-full min-h-0 flex-col overflow-hidden py-4 font-['Work_Sans'] sm:py-5">
          {/* Subtle watermark */}
          <div className="pointer-events-none absolute -bottom-16 -left-16 h-60 w-60 bg-[url('/floral-bg.png')] bg-contain bg-no-repeat opacity-10" />

          {/* Header */}
          <header className="flex shrink-0 items-center justify-between border-b border-[#ebdcd0] pb-3.5">
            <div className="flex items-center gap-2.5">
              <h2 className="font-['Instrument_Serif'] text-[26px] font-normal leading-none text-[#2c1810] sm:text-[30px]">
                Shopping Bag
              </h2>
              {totalCount > 0 && (
                <span className="inline-flex items-center justify-center rounded-full bg-[#f4eae3] px-2.5 py-0.5 text-[11px] font-medium text-[#8e524c]">
                  {totalCount} {totalCount === 1 ? "item" : "items"}
                </span>
              )}
            </div>
            <button
              className="group grid h-9 w-9 place-items-center rounded-full border border-[#ebdcd0] bg-white/80 text-[#7a645b] shadow-xs transition-all duration-200 hover:border-[#b56560] hover:bg-[#fff4f0] hover:text-[#b56560] hover:rotate-90 active:scale-95"
              aria-label="Close bag"
              onClick={onClose}
            >
              <X size={16} strokeWidth={2} />
            </button>
          </header>

          {/* Scrollable Center */}
          <div className="cart-middle min-h-0 flex-1 overflow-y-auto overscroll-contain pb-3 pt-1">
            {items.length > 0 ? (
              <>
                {/* Gift Rewards Milestone Section */}
                <section className="mt-3 overflow-hidden rounded-2xl border border-[#ebd8cc] bg-gradient-to-br from-[#fff9f6] via-[#fcf5f0] to-[#f8ede6] p-4 shadow-xs">
                  {/* Top Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-full transition-all duration-300 ${
                        giftUnlocked
                          ? "bg-gradient-to-tr from-[#ba6b65] to-[#c77972] text-white shadow-xs"
                          : "bg-[#f6ded6] text-[#b56560]"
                      }`}>
                        {giftUnlocked ? <Sparkles size={15} /> : <Gift size={15} />}
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-[#2c1810] leading-snug">
                          {giftUnlocked ? (
                            <span className="text-[#b56560]">🎉 Free Festive Gift Unlocked!</span>
                          ) : (
                            <>
                              Add <strong className="text-[#b56560]">₹{giftDiff.toLocaleString("en-IN")}</strong> for a Free Gift!
                            </>
                          )}
                        </h4>
                        <p className="text-[10px] text-[#8e7870] mt-0.5">
                          {giftUnlocked
                            ? "Your order qualifies for a complimentary surprise gift."
                            : "Unlock our exclusive complimentary gift on orders above ₹3,500."}
                        </p>
                      </div>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase transition-colors ${
                      giftUnlocked
                        ? "bg-[#faeee5] text-[#b56560] border border-[#ebd2c5]"
                        : "bg-[#f2e2da] text-[#8e7870]"
                    }`}>
                      {giftUnlocked ? "1/1 Gift" : "0/1 Gift"}
                    </span>
                  </div>

                  {/* Progress Bar with Node at ₹3,500 */}
                  <div className="relative mt-5 mb-2 mx-2">
                    {/* Track */}
                    <div className="relative h-2.5 w-full rounded-full bg-[#ebdcd0]/90 shadow-inner overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#e59b94] via-[#ce7770] to-[#b56560] shadow-[0_0_12px_rgba(181,101,96,0.35)] transition-all duration-700 ease-out"
                        style={{ width: `${giftProgress}%` }}
                      />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/30 to-transparent" />
                    </div>

                    {/* Milestone Node: ₹3,500 (100%) */}
                    <div
                      className="absolute -top-2 z-10 -translate-x-1/2"
                      style={{ left: "100%" }}
                      title="Free Gift at ₹3,500"
                    >
                      <div className={`grid h-6.5 w-6.5 place-items-center rounded-full border-2 transition-all duration-300 ${
                        giftUnlocked
                          ? "border-white bg-gradient-to-tr from-[#ba6b65] to-[#c77972] text-white shadow-[0_2px_10px_rgba(186,107,101,0.5)] scale-105"
                          : "border-[#ebdcd0] bg-[#fdfbf9] text-[#a8938b] shadow-2xs"
                      }`}>
                        {giftUnlocked ? <Sparkles size={12} strokeWidth={2.5} /> : <Gift size={12} strokeWidth={2} />}
                      </div>
                    </div>
                  </div>

                  {/* Milestone Labels below Track */}
                  <div className="relative mt-4 mx-2 flex justify-between items-start text-[10px]">
                    <div className="text-left">
                      <span className="font-medium text-[#a38e85]">₹0</span>
                    </div>

                    <div className="text-right">
                      <span className="block font-bold text-[#2d1b16] text-[11px]">₹3,500</span>
                      <span className={`inline-flex items-center gap-0.5 font-medium ${giftUnlocked ? "text-[#b56560] font-semibold" : "text-[#8e7870]"}`}>
                        {giftUnlocked ? "✓ Free Gift" : "Surprise Gift"}
                      </span>
                    </div>
                  </div>
                </section>

                {/* Items List */}
                <div className="mt-3 divide-y divide-[#ebdcd0]/70">
                  {items.map((item) => {
                    const unitPrice = parsePrice(item.price);
                    const itemTotal = unitPrice * item.quantity;
                    return (
                      <article
                        className="group grid grid-cols-[76px_1fr] gap-3.5 py-4 sm:grid-cols-[84px_1fr]"
                        key={`${item.name}-${item.size}`}
                      >
                        <div className="relative overflow-hidden rounded-lg border border-[#ebdcd0] bg-[#f8f2ec] shadow-2xs">
                          <img
                            className="h-[102px] w-full object-cover transition-transform duration-300 group-hover:scale-105 sm:h-[110px]"
                            src={item.img}
                            alt={item.name}
                            loading="lazy"
                          />
                        </div>
                        <div className="flex flex-col justify-between py-0.5">
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="text-[14px] font-medium leading-snug text-[#2b1812] transition-colors group-hover:text-[#b56560] sm:text-[15px]">
                                {item.name}
                              </h3>
                              <button
                                className="grid h-7 w-7 place-items-center rounded-md text-[#a38e85] transition hover:bg-[#faeae5] hover:text-[#b56560]"
                                aria-label={`Remove ${item.name} from bag`}
                                onClick={() => removeFromCart(item.name, item.size)}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                            <div className="mt-1.5 flex flex-wrap items-center gap-2">
                              <span className="rounded border border-[#ebdcd0] bg-[#faf2ec] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#8e524c]">
                                Size {item.size}
                              </span>
                              <span className="text-[11px] text-[#917d75]">Carnival Edit</span>
                            </div>
                          </div>

                          <div className="mt-3 flex items-center justify-between">
                            {/* Quantity Stepper */}
                            <div className="inline-flex items-center rounded-full border border-[#ebdcd0] bg-white p-0.5 shadow-2xs">
                              <button
                                className="grid h-7 w-7 place-items-center rounded-full text-[#7d675e] transition hover:bg-[#fff2ee] hover:text-[#b56560] active:scale-90"
                                aria-label="Decrease quantity"
                                onClick={() => updateQuantity(item.name, item.size, -1)}
                              >
                                <Minus size={11} strokeWidth={2.5} />
                              </button>
                              <span className="w-6 text-center text-xs font-semibold text-[#2b1812]">
                                {item.quantity}
                              </span>
                              <button
                                className="grid h-7 w-7 place-items-center rounded-full text-[#7d675e] transition hover:bg-[#fff2ee] hover:text-[#b56560] active:scale-90"
                                aria-label="Increase quantity"
                                onClick={() => updateQuantity(item.name, item.size, 1)}
                              >
                                <Plus size={11} strokeWidth={2.5} />
                              </button>
                            </div>

                            <div className="text-right">
                              <strong className="text-sm font-semibold text-[#2b1812]">
                                ₹{itemTotal.toLocaleString("en-IN")}
                              </strong>
                              {item.quantity > 1 && (
                                <span className="block text-[10px] text-[#8e7870]">
                                  {item.price} each
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>

                {/* Free Gift Card in Cart if Unlocked (₹3,500+) */}
                {giftUnlocked && (
                  <div className="mt-3 flex items-center gap-3 rounded-xl border border-[#ba6a64]/30 bg-gradient-to-r from-[#fff9f7] to-[#fffdfb] p-3 shadow-2xs">
                    <div className="relative shrink-0 overflow-hidden rounded-lg border border-[#ebdcd0] bg-[#fdf2ee] h-14 w-12">
                      <img
                        className="h-full w-full object-cover object-center"
                        src="/gift-1.jpg"
                        alt="Complimentary Gift"
                      />
                      <span className="absolute -top-1 -right-1 grid h-4.5 w-4.5 place-items-center rounded-full bg-[#ba6a64] text-[9px] font-bold text-white shadow-xs">
                        1
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-semibold text-[#241814] leading-snug line-clamp-1">
                          Complimentary Luxury Gift
                        </p>
                        <span className="shrink-0 inline-flex items-center gap-0.5 rounded bg-[#fcedea] px-1.5 py-0.5 text-[8.5px] font-bold uppercase tracking-wider text-[#ba6a64]">
                          <Gift size={9} /> Free Gift
                        </span>
                      </div>
                      <p className="mt-0.5 text-[10px] text-[#2e7d32] font-medium">
                        Unlocked (Order ₹3,500+)
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <del className="block text-[9px] text-[#9c877f]">₹999</del>
                      <strong className="text-xs font-bold text-[#2e7d32]">FREE</strong>
                    </div>
                  </div>
                )}

                {/* Promo Code Section */}
                <section className="mt-3 rounded-xl border border-[#ebdcd0] bg-[#faf5f0] p-3 shadow-2xs">
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between rounded-lg border border-[#dfccbe] bg-white px-3 py-2 shadow-2xs">
                      <div className="flex items-center gap-2">
                        <div className="grid h-6 w-6 place-items-center rounded-full bg-[#fbf0ec] text-[#b56560]">
                          <Tag size={12} />
                        </div>
                        <div>
                          <b className="text-xs font-semibold tracking-wider text-[#2b1812]">
                            {appliedCoupon}
                          </b>
                          <span className="ml-2 text-[11px] font-medium text-[#2e7d32]">
                            -₹{discount.toLocaleString("en-IN")} saved
                          </span>
                        </div>
                      </div>
                      <button
                        className="rounded px-2 py-1 text-[10px] font-semibold text-[#9c5953] transition hover:bg-[#faeae5] hover:text-[#b56560]"
                        onClick={removeCoupon}
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <form
                      className="flex gap-2"
                      onSubmit={(e) => {
                        e.preventDefault();
                        applyCoupon();
                      }}
                    >
                      <div className="relative flex-1">
                        <Tag
                          size={13}
                          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#a38e85]"
                        />
                        <input
                          type="text"
                          className="w-full rounded-lg border border-[#ebdcd0] bg-white py-2 pl-8.5 pr-2 text-xs uppercase tracking-wider text-[#2b1812] placeholder:normal-case placeholder:tracking-normal placeholder:text-[#9e8b83] focus:border-[#b56560] focus:outline-none"
                          placeholder="Promo code (e.g. WELCOME10)"
                          value={coupon}
                          onChange={(e) => setCoupon(e.target.value)}
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isApplyingCoupon || !coupon.trim()}
                        className="rounded-lg border border-[#b56560] bg-[#b56560] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[#9e524d] disabled:cursor-not-allowed disabled:opacity-50 active:scale-95"
                      >
                        {isApplyingCoupon ? "..." : "Apply"}
                      </button>
                    </form>
                  )}
                </section>
              </>
            ) : (
              /* Empty Bag State */
              <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
                <div className="relative mb-5 grid h-20 w-20 place-items-center rounded-full border border-[#ebdcd0] bg-gradient-to-b from-[#fbf4ee] to-[#f5e9e0] shadow-xs">
                  <ShoppingBag size={34} strokeWidth={1.3} className="text-[#b56560]" />
                  <span className="absolute -top-1 -right-1 grid h-6 w-6 place-items-center rounded-full bg-[#b56560] text-[11px] font-serif text-white shadow-xs">
                    ♧
                  </span>
                </div>
                <h3 className="font-['Instrument_Serif'] text-3xl font-normal text-[#2b1812]">
                  Your Bag is Empty
                </h3>
                <p className="mx-auto mt-2 max-w-xs text-xs leading-relaxed text-[#806f69]">
                  Explore handcrafted silks, signature co-ords, and festive silhouettes curated for your special moments.
                </p>
                <button
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#ba6b65] to-[#994d48] px-6 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-white shadow-[0_6px_16px_rgba(181,101,96,0.25)] transition hover:shadow-[0_10px_22px_rgba(181,101,96,0.32)] active:scale-95"
                  onClick={onClose}
                >
                  Discover The Edit
                  <ArrowRight size={13} />
                </button>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  <a
                    href="/collections/dresses"
                    onClick={onClose}
                    className="rounded-full border border-[#ebdcd0] bg-white px-3 py-1 text-[11px] font-medium text-[#7d675e] transition hover:border-[#b56560] hover:text-[#b56560]"
                  >
                    Dresses
                  </a>
                  <a
                    href="/collections/co-ord-sets"
                    onClick={onClose}
                    className="rounded-full border border-[#ebdcd0] bg-white px-3 py-1 text-[11px] font-medium text-[#7d675e] transition hover:border-[#b56560] hover:text-[#b56560]"
                  >
                    Co-Ord Sets
                  </a>
                  <a
                    href="/shop"
                    onClick={onClose}
                    className="rounded-full border border-[#ebdcd0] bg-white px-3 py-1 text-[11px] font-medium text-[#7d675e] transition hover:border-[#b56560] hover:text-[#b56560]"
                  >
                    All Collections
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Sticky Bottom Summary & Checkout */}
          {items.length > 0 && (
            <div className="cart-bottom shrink-0 border-t border-[#ebdcd0] bg-[#fdfbf9] pt-3 pb-1">
              <div className="text-xs text-[#6e5951]">
                {/* Collapsible Price Breakup */}
                {isPriceBreakupOpen && (
                  <div className="mb-2.5 space-y-1.5 border-b border-[#ebdcd0] pb-2.5">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className="font-medium text-[#2b1812]">
                        ₹{subtotal.toLocaleString("en-IN")}
                      </span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-[#2e7d32]">
                        <span>Promo Discount ({appliedCoupon})</span>
                        <span className="font-semibold">-₹{discount.toLocaleString("en-IN")}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Express Shipping</span>
                      <span className="font-semibold text-[#2e7d32]">FREE</span>
                    </div>
                  </div>
                )}

                {/* Estimated Total Clickable Toggle Bar */}
                <button
                  type="button"
                  className="flex w-full items-center justify-between text-left transition-opacity hover:opacity-85 focus:outline-none"
                  onClick={() => setIsPriceBreakupOpen((prev) => !prev)}
                  aria-expanded={isPriceBreakupOpen}
                  aria-label="Toggle price breakup"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-[#2b1812]">Estimated Total</span>
                      <ChevronDown
                        size={14}
                        className={`text-[#8e7870] transition-transform duration-200 ${
                          isPriceBreakupOpen ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                    <span className="block text-[10px] text-[#8e7870]">Includes all taxes</span>
                  </div>
                  <div className="text-right">
                    {discount > 0 && (
                      <del className="mr-2 text-xs text-[#9e8b83]">
                        ₹{subtotal.toLocaleString("en-IN")}
                      </del>
                    )}
                    <span className="text-lg font-bold text-[#2b1812]">
                      ₹{estimatedTotal.toLocaleString("en-IN")}
                    </span>
                  </div>
                </button>
              </div>

              <button
                type="button"
                className="cart-checkout-btn"
                style={{
                  background: "linear-gradient(135deg, #ba6a64 0%, #a6544e 50%, #8e3e38 100%)",
                  color: "#ffffff",
                  border: "1px solid rgba(255, 255, 255, 0.25)",
                  boxShadow: "0 10px 26px rgba(166, 84, 78, 0.38), inset 0 1px 1px rgba(255, 255, 255, 0.35)",
                  borderRadius: "12px",
                }}
                onClick={startCheckout}
              >
                <span className="cart-checkout-sheen" />
                <span className="cart-checkout-label" style={{ color: "#ffffff" }}>
                  Proceed to Checkout
                </span>
                <span
                  className="cart-checkout-icon-wrap"
                  style={{
                    color: "#ffffff",
                    backgroundColor: "rgba(255, 255, 255, 0.18)",
                  }}
                >
                  <ArrowRight size={14} strokeWidth={2.4} color="#ffffff" />
                </span>
              </button>

              <div className="mt-2.5 flex items-center justify-center gap-3 text-[10px] text-[#8c746b]">
                <span className="flex items-center gap-1">
                  <ShieldCheck size={12} className="text-[#b56560]" />
                  100% Secure Checkout
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Sparkles size={12} className="text-[#b56560]" />
                  Authentic Silks & Fabrics
                </span>
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

