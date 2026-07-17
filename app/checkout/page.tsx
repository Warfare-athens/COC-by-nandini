"use client";

import { FormEvent, useEffect, useState } from "react";
import { CartItem, getCartItems } from "../cart-helper";
import { Signature } from "../components/Signature";

const inputClass = "w-full rounded-lg border border-[#e8cdbc] bg-[#fffaf7] px-4 py-3 text-sm text-[#3a2926] outline-none transition placeholder:text-[#aa9188] focus:border-[#bb7068] focus:ring-2 focus:ring-[#bb7068]/15";

export default function CheckoutPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [payment, setPayment] = useState("upi");
  const [placed, setPlaced] = useState(false);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => setItems(getCartItems()), 0);
    return () => window.clearTimeout(initialLoad);
  }, []);

  const parsePrice = (price: string) => Number.parseInt(price.replace(/[^\d]/g, ""), 10) || 0;
  const subtotal = items.reduce((sum, item) => sum + parsePrice(item.price) * item.quantity, 0);
  const shipping = subtotal >= 2999 || subtotal === 0 ? 0 : 149;
  const total = subtotal + shipping;

  const placeOrder = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (items.length) setPlaced(true);
  };

  if (placed) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#fbf4ee] px-5 selection:bg-[#e8b9b2] selection:text-[#3a2926]">
        <section className="w-full max-w-xl rounded-2xl border border-[#e8cdbc] bg-[#fffaf7] p-8 text-center shadow-[0_24px_70px_rgba(90,46,36,0.1)] sm:p-12">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#f3dfd6] text-3xl text-[#bb7068]">✓</div>
          <span className="mt-6 block text-[10px] font-semibold uppercase tracking-[0.2em] text-[#bb7068]">Order received</span>
          <h1 className="mt-3 font-['Instrument_Serif'] text-4xl text-[#3a2926] sm:text-5xl">Thank you for your order</h1>
          <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-[#806f69]">Your Carnival edit is being prepared with care. A confirmation will be sent to your email.</p>
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
            <div className="mb-5 flex items-center gap-3"><span className="grid h-7 w-7 place-items-center rounded-full bg-[#f3dfd6] text-xs text-[#bb7068]">1</span><h2 className="text-sm font-semibold">Contact information</h2></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <input className={inputClass} type="email" required placeholder="Email address" />
              <input className={inputClass} type="tel" required placeholder="Phone number" />
            </div>
          </section>

          <section className="rounded-xl border border-[#e8cdbc] bg-[#fffaf7] p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-3"><span className="grid h-7 w-7 place-items-center rounded-full bg-[#f3dfd6] text-xs text-[#bb7068]">2</span><h2 className="text-sm font-semibold">Delivery address</h2></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <input className={inputClass} required placeholder="First name" />
              <input className={inputClass} required placeholder="Last name" />
              <input className={`${inputClass} sm:col-span-2`} required placeholder="Address" />
              <input className={`${inputClass} sm:col-span-2`} placeholder="Apartment, suite, etc. (optional)" />
              <input className={inputClass} required placeholder="City" />
              <input className={inputClass} required placeholder="State" />
              <input className={inputClass} required inputMode="numeric" placeholder="PIN code" />
              <select className={inputClass} defaultValue="India"><option>India</option></select>
            </div>
          </section>

          <section className="rounded-xl border border-[#e8cdbc] bg-[#fffaf7] p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-3"><span className="grid h-7 w-7 place-items-center rounded-full bg-[#f3dfd6] text-xs text-[#bb7068]">3</span><h2 className="text-sm font-semibold">Payment method</h2></div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[['upi', 'UPI'], ['card', 'Card'], ['cod', 'Cash on delivery']].map(([value, label]) => (
                <label className={`cursor-pointer rounded-lg border px-4 py-3 text-center text-xs transition ${payment === value ? "border-[#bb7068] bg-[#f7e6df] text-[#a95f5a]" : "border-[#e8cdbc]"}`} key={value}>
                  <input className="sr-only" type="radio" name="payment" value={value} checked={payment === value} onChange={() => setPayment(value)} />{label}
                </label>
              ))}
            </div>
            {payment === "upi" && <input className={`${inputClass} mt-4`} required placeholder="UPI ID (name@bank)" />}
            {payment === "card" && <div className="mt-4 grid gap-4 sm:grid-cols-2"><input className={`${inputClass} sm:col-span-2`} required placeholder="Card number" /><input className={inputClass} required placeholder="MM / YY" /><input className={inputClass} required placeholder="CVV" /></div>}
            {payment === "cod" && <p className="mt-4 rounded-lg bg-[#f7e6df] p-3 text-xs leading-5 text-[#806f69]">Pay in cash when your order arrives. Please keep the exact amount ready.</p>}
          </section>
        </div>

        <aside className="h-max rounded-xl border border-[#e8cdbc] bg-[#fffaf7] p-5 lg:sticky lg:top-6 lg:p-6">
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
                <div className="flex justify-between"><span className="text-[#806f69]">Shipping</span><span>{shipping ? `₹${shipping}` : "Free"}</span></div>
                <div className="flex justify-between border-t border-[#e8cdbc] pt-4 text-base font-semibold"><span>Total</span><span>₹{total.toLocaleString()}</span></div>
              </div>
              <button type="submit" className="mt-6 w-full rounded-lg bg-[#bb7068] py-4 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(187,112,104,0.24)] transition hover:bg-[#a95f5a]">Place order · ₹{total.toLocaleString()}</button>
              <p className="mt-4 text-center text-[9px] leading-4 text-[#8c746b]">Secure checkout · Easy returns · Payment information is encrypted</p>
            </>
          ) : (
            <div className="py-10 text-center"><p className="text-sm text-[#806f69]">Your cart is empty.</p><a href="/shop" className="mt-5 inline-block text-xs font-semibold text-[#bb7068]">Explore the collection →</a></div>
          )}
        </aside>
      </form>
    </main>
  );
}
