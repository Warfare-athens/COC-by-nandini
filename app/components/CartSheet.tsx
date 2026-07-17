"use client";

import { useEffect, useState } from "react";
import { CartItem, getCartItems, removeFromCart, updateQuantity } from "../cart-helper";

interface CartSheetProps {
  open: boolean;
  onClose: () => void;
}

export default function CartSheet({ open, onClose }: CartSheetProps) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [coupon, setCoupon] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(24 * 60 * 60 - 1);

  useEffect(() => {
    const loadItems = () => setItems(getCartItems());
    loadItems();
    window.addEventListener("coc-cart-updated", loadItems);
    return () => window.removeEventListener("coc-cart-updated", loadItems);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSecondsLeft((current) => current > 0 ? current - 1 : 24 * 60 * 60 - 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const parsePrice = (price: string) => Number.parseInt(price.replace(/[^\d]/g, ""), 10) || 0;
  const subtotal = items.reduce((sum, item) => sum + parsePrice(item.price) * item.quantity, 0);
  const shippingDifference = Math.max(2999 - subtotal, 0);
  const giftDifference = Math.max(2199 - subtotal, 0);
  const giftProgress = Math.min((subtotal / 2199) * 100, 100);
  const discount = appliedCoupon === "COC100" && subtotal >= 999 ? 100 : 0;
  const estimatedTotal = Math.max(subtotal - discount, 0);
  const hours = String(Math.floor(secondsLeft / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((secondsLeft % 3600) / 60)).padStart(2, "0");
  const seconds = String(secondsLeft % 60).padStart(2, "0");

  const applyCoupon = () => {
    const normalized = coupon.trim().toUpperCase();
    if (normalized === "COC100" && subtotal >= 999) setAppliedCoupon(normalized);
  };

  return (
    <div className={open ? "cart-layer visible" : "cart-layer"} onClick={onClose}>
      <aside className="cart-sheet !w-[min(620px,100vw)] !overflow-hidden !bg-[#fffaf7] !p-0" onClick={(event) => event.stopPropagation()}>
        <div className="cart-content relative flex h-full min-h-0 flex-col overflow-hidden py-4 font-['Work_Sans'] sm:py-6">
          <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 bg-[url('/floral-bg.png')] bg-contain bg-no-repeat opacity-15" />

          <header className="flex shrink-0 items-start justify-between pb-2">
            <div>
              <h2 className="font-['Instrument_Serif'] text-[32px] font-normal leading-none sm:text-[38px]">My Cart</h2>
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-[#e8cdbc] bg-[#fff5f0] px-2.5 py-1 text-[8px] font-semibold uppercase tracking-[0.11em] text-[#b56560]">
                <span className="text-[11px]">♧</span> Free surprise gift
              </div>
            </div>
            <button className="grid h-10 w-10 place-items-center rounded-md border border-[#e8cdbc] text-[25px] font-light leading-none text-[#b56560] transition hover:bg-[#f7e6df]" aria-label="Close cart" onClick={onClose}>×</button>
          </header>

          <div className="cart-middle min-h-0 flex-1 overflow-y-auto overscroll-contain pb-2">

          <section className="relative mt-3 overflow-hidden rounded-lg border border-[#e8cdbc] bg-[#fff7f3] px-4 py-3">
            <div className="pointer-events-none absolute -bottom-10 -left-8 h-36 w-36 bg-[url('/floral-bg.png')] bg-contain bg-no-repeat opacity-15" />
            <div className="relative grid grid-cols-[1fr_auto] items-center gap-3">
              <div>
                <h3 className="text-[16px] font-medium leading-tight text-[#4a302d] sm:text-lg">Extra 5% off + free delivery</h3>
                <p className="mt-1 text-[9px] text-[#9b625d]">♧ &nbsp;A reward for returning to your edit.</p>
              </div>
              <div className="border-l border-[#e8cdbc] pl-3 text-center">
                <span className="text-[8px] uppercase tracking-[0.15em] text-[#b56560]">Ends in</span>
                <strong className="mt-1 block text-[18px] font-medium tracking-[0.04em] text-[#b56560]">{hours}:{minutes}:{seconds}</strong>
                <small className="flex justify-between text-[7px] uppercase tracking-[0.08em] text-[#9b625d]"><span>H</span><span>M</span><span>S</span></small>
              </div>
            </div>
          </section>

          <section className="mt-3 rounded-lg border border-[#e8cdbc] px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-[15px] font-medium">{giftDifference ? `Add ₹${giftDifference.toLocaleString()} more for your gift` : "Your gift is unlocked"}</h3>
              <span className="text-lg text-[#b56560]">♧</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#f2dfd7]"><div className="h-full rounded-full bg-[#bd716b] transition-all duration-500" style={{ width: `${giftProgress}%` }} /></div>
            <div className="mt-1.5 flex justify-between text-[8px] text-[#8c746b]"><span>₹0</span><span>₹999</span><span>₹2,199 goal</span></div>
          </section>

          {items.length ? (
            <>
              <div className="mt-2 divide-y divide-[#ead8ce]">
                {items.map((item) => (
                  <article className="grid grid-cols-[68px_1fr_auto] gap-3 py-3 sm:grid-cols-[82px_1fr_auto]" key={`${item.name}-${item.size}`}>
                    <img className="h-[88px] w-[68px] rounded-md border border-[#e8cdbc] object-cover sm:h-[102px] sm:w-[82px]" src={item.img} alt={item.name} />
                    <div className="min-w-0 py-1">
                      <h3 className="text-[15px] font-medium leading-tight sm:text-lg">{item.name}</h3>
                      <p className="mt-1 text-[9px] text-[#8c746b]">Size {item.size} · Carnival Edit</p>
                      <div className="mt-2 inline-grid grid-cols-3 overflow-hidden rounded border border-[#e8cdbc] text-xs">
                        <button className="h-8 w-8 hover:bg-[#f7e6df]" onClick={() => updateQuantity(item.name, item.size, -1)}>−</button>
                        <span className="grid h-8 w-8 place-items-center border-x border-[#e8cdbc]">{item.quantity}</span>
                        <button className="h-8 w-8 hover:bg-[#f7e6df]" onClick={() => updateQuantity(item.name, item.size, 1)}>+</button>
                      </div>
                    </div>
                    <div className="flex flex-col items-end justify-between py-1">
                      <button className="text-2xl font-light text-[#9f8178] hover:text-[#b56560]" aria-label={`Remove ${item.name}`} onClick={() => removeFromCart(item.name, item.size)}>×</button>
                      <strong className="whitespace-nowrap text-sm font-semibold">{item.price}</strong>
                    </div>
                  </article>
                ))}
              </div>

              <section className="mt-2 rounded-lg border border-[#e8cdbc] p-3">
                <div className="flex gap-3">
                  <label className="flex min-w-0 flex-1 items-center gap-3 border-b border-[#e8cdbc] px-1 text-[#b56560]">
                    <span className="text-xl">◇</span>
                    <input className="min-w-0 flex-1 bg-transparent py-2 text-xs text-[#3a2926] outline-none placeholder:text-[#a48c84]" value={coupon} onChange={(event) => setCoupon(event.target.value)} placeholder="Enter code" />
                  </label>
                  <button className="rounded-md border border-[#bd716b] px-4 text-xs text-[#a95f5a] transition hover:bg-[#bd716b] hover:text-white" onClick={applyCoupon}>Apply</button>
                </div>
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between gap-3 border-b border-dashed border-[#ead8ce] pb-2">
                    <div><b className="text-sm font-medium">COC100</b><p className="text-[9px] text-[#8c746b]">₹100 off above ₹999.</p></div>
                    <button className="rounded border border-[#bd716b] px-3 py-1.5 text-[10px] text-[#a95f5a]" onClick={() => { setCoupon("COC100"); if (subtotal >= 999) setAppliedCoupon("COC100"); }}>{appliedCoupon ? "Applied" : "Use"}</button>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <div><b className="text-sm font-medium">STYLE3</b><p className="text-[9px] text-[#8c746b]">Buy three and unlock a surprise.</p></div>
                    <button className="rounded border border-[#bd716b] px-3 py-1.5 text-[10px] text-[#a95f5a]">View</button>
                  </div>
                </div>
              </section>

            </>
          ) : (
            <div className="py-16 text-center">
              <span className="text-5xl text-[#c79553]">♧</span>
              <h3 className="mt-5 text-2xl font-medium">Your cart is waiting</h3>
              <p className="mx-auto mt-3 max-w-xs text-xs leading-6 text-[#806f69]">Beautiful pieces, carefully curated for your next occasion.</p>
              <button className="mt-7 rounded-md bg-[#bd716b] px-8 py-4 text-xs uppercase tracking-[0.14em] text-white" onClick={onClose}>Explore collection</button>
            </div>
          )}
          </div>

          {items.length > 0 && (
            <div className="cart-bottom shrink-0 bg-[#fffaf7] pt-2">
              <div className="border-y border-[#e8cdbc] py-3">
                <div className="flex items-center justify-between">
                  <span className="text-base font-medium">Estimated Total</span>
                  <div>{discount > 0 && <del className="mr-2 text-xs text-[#8c746b]">₹{subtotal.toLocaleString()}</del>}<strong className="text-lg font-semibold">₹{estimatedTotal.toLocaleString()}</strong></div>
                </div>
                <p className="mt-1 text-right text-[9px] text-[#8c746b]">{shippingDifference ? `Add ₹${shippingDifference.toLocaleString()} for free shipping` : "Free shipping unlocked"}</p>
              </div>
              <button
                className="mt-3 flex w-full items-center justify-center gap-4 rounded-lg border border-[#a95f5a] py-3.5 text-base font-medium text-white shadow-[0_10px_24px_rgba(169,95,90,0.24)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(169,95,90,0.3)]"
                style={{ background: "linear-gradient(135deg, #c77972 0%, #ad625d 100%)", color: "#fff" }}
                onClick={() => window.location.assign("/checkout")}
              >
                Checkout <span className="text-xl">→</span>
              </button>
            </div>
          )}

        </div>
      </aside>
    </div>
  );
}
