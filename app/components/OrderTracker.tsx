"use client";
import { FormEvent, useState } from "react";

type TrackingEvent = { occurred_at: string; message: string; location?: string | null };
type Fulfillment = { tracking_events?: TrackingEvent[]; tracking_url?: string | null; carrier?: string | null };
type Order = { order_number: string; fulfillment_status: string; total_inr: number; fulfillments?: Fulfillment[] };

export default function OrderTracker() {
  const [order, setOrder] = useState<Order | null>(null); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setBusy(true); setError(""); const form = new FormData(event.currentTarget); const response = await fetch("/api/orders/lookup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderNumber: form.get("orderNumber"), email: form.get("email") }) }); const data = await response.json(); setBusy(false); if (!response.ok) { setOrder(null); setError(data.error); } else setOrder(data.order as Order); };
  const fulfillment = order?.fulfillments?.[0]; const events = [...(fulfillment?.tracking_events || [])].sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime());
  return <><form className="tracking-form" onSubmit={submit}><input name="orderNumber" required placeholder="Order number (COC-...)" /><input name="email" type="email" required placeholder="Email used at checkout" /><button disabled={busy}>{busy ? "Finding order…" : "Track order"}</button></form>{error && <div className="tracking-error">{error}</div>}{order && <section className="tracking-result"><div className="tracking-summary"><div><span>ORDER</span><strong>{order.order_number}</strong></div><div><span>STATUS</span><strong>{String(order.fulfillment_status).replaceAll("_", " ")}</strong></div><div><span>TOTAL</span><strong>₹{Number(order.total_inr).toLocaleString("en-IN")}</strong></div></div><div className="tracking-timeline">{events.map((event, index) => <div className="tracking-event" key={`${event.occurred_at}-${index}`}><i /><div><strong>{event.message}</strong><p>{new Date(event.occurred_at).toLocaleString("en-IN")}{event.location ? ` · ${event.location}` : ""}</p></div></div>)}{!events.length && <p>Your order has been received. Tracking events will appear here.</p>}</div>{fulfillment?.tracking_url && <a className="tracking-carrier" href={fulfillment.tracking_url} target="_blank" rel="noreferrer">Track with {fulfillment.carrier || "carrier"} →</a>}</section>}</>;
}
