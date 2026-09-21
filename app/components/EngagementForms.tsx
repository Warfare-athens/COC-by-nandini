"use client";

import { FormEvent, useState } from "react";
import { showGlobalStatus } from "@/app/global-status";
import UniversalSelect from "./UniversalSelect";

export function NewsletterForm() {
  const [busy, setBusy] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setBusy(true); const form = event.currentTarget;
    const response = await fetch("/api/newsletter", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: String(new FormData(form).get("email") || ""), source: "footer" }) });
    const data = await response.json(); setBusy(false); showGlobalStatus(response.ok ? "You are on the Carnival list" : data.error || "Unable to subscribe", response.ok ? "success" : "error"); if (response.ok) form.reset();
  };
  return <form className="email" onSubmit={submit}><input name="email" type="email" placeholder="Enter your email" aria-label="Email for newsletter" required/><button aria-label="Subscribe" disabled={busy}>{busy ? "…" : "→"}</button></form>;
}

const field = "w-full rounded-lg border border-[#e8cdbc] bg-white px-4 py-3 text-sm outline-none focus:border-[#bb7068]";
export function FeedbackForm() {
  const [busy, setBusy] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setBusy(true); const form = event.currentTarget; const data = Object.fromEntries(new FormData(form));
    const response = await fetch("/api/feedback", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    const payload = await response.json(); setBusy(false); showGlobalStatus(response.ok ? "Thank you for your feedback" : payload.error || "Unable to send feedback", response.ok ? "success" : "error"); if (response.ok) form.reset();
  };
  return <form className="grid max-w-2xl gap-4" onSubmit={submit}><div className="grid gap-4 sm:grid-cols-2"><input className={field} name="name" placeholder="Name"/><input className={field} name="email" type="email" placeholder="Email"/><UniversalSelect name="type" aria-label="Feedback type"><option>general</option><option>product</option><option>delivery</option><option>website</option></UniversalSelect><UniversalSelect name="rating" aria-label="Rating"><option value="">No rating</option>{[5,4,3,2,1].map(v=><option key={v} value={v}>{v}/5</option>)}</UniversalSelect></div><textarea className={`${field} min-h-32`} name="message" placeholder="Your feedback" required minLength={5}/><button className="w-max rounded-full bg-[#bb7068] px-6 py-3 text-xs font-semibold uppercase tracking-[.1em] text-white" disabled={busy}>{busy ? "Sending…" : "Send feedback"}</button></form>;
}

export function StockRequestForm({ productId, sizes }: { productId: string; sizes: string[] }) {
  const [open,setOpen]=useState(false); const [busy,setBusy]=useState(false);
  if(!sizes.length)return null;
  const submit=async(event:FormEvent<HTMLFormElement>)=>{event.preventDefault();setBusy(true);const form=event.currentTarget;const data=Object.fromEntries(new FormData(form));const response=await fetch("/api/stock-requests",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...data,productId})});const payload=await response.json();setBusy(false);if(!response.ok)return showGlobalStatus(payload.error||"Unable to save request","error");form.reset();setOpen(false);showGlobalStatus("We will notify you when it is back","success")};
  return <div className="mt-3">{!open?<button className="text-xs text-[#bb7068] underline" type="button" onClick={()=>setOpen(true)}>Notify me for unavailable sizes</button>:<form className="grid gap-2 rounded-lg border border-[#e8cdbc] bg-[#fffaf7] p-3 sm:grid-cols-2" onSubmit={submit}><UniversalSelect name="requestedSize" aria-label="Requested size" required>{sizes.map(size=><option key={size}>{size}</option>)}</UniversalSelect><input className={field} name="email" type="email" placeholder="Email" required/><input className={field} name="customerName" placeholder="Name"/><input className={field} name="phone" placeholder="Phone"/><button className="rounded-full bg-[#bb7068] px-4 py-3 text-[10px] font-semibold uppercase text-white sm:col-span-2" disabled={busy}>{busy?"Saving…":"Notify me"}</button></form>}</div>;
}
