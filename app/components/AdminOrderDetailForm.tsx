"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { showGlobalStatus } from "@/app/global-status";
import UniversalSelect from "./UniversalSelect";

export default function AdminOrderDetailForm({ order }: { order: { id: string; status: string; fulfillment_status: string; carrier?: string | null; tracking_number?: string | null; tracking_url?: string | null } }) {
  const [busy,setBusy]=useState(false); const router=useRouter();
  const submit=async(event:FormEvent<HTMLFormElement>)=>{event.preventDefault();setBusy(true);const form=new FormData(event.currentTarget);const response=await fetch(`/api/admin/orders/${order.id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status:form.get("status"),fulfillmentStatus:form.get("fulfillmentStatus"),carrier:form.get("carrier"),trackingNumber:form.get("trackingNumber"),trackingUrl:form.get("trackingUrl")})});const payload=await response.json();setBusy(false);if(!response.ok)return showGlobalStatus(payload.error||"Unable to update order","error");showGlobalStatus("Order updated","success");router.refresh()};
  return <form className="admin-inline-form" onSubmit={submit}><UniversalSelect controlSize="compact" name="status" defaultValue={order.status} aria-label="Order status">{["pending","confirmed","cancelled","completed","returned"].map(v=><option key={v}>{v}</option>)}</UniversalSelect><UniversalSelect controlSize="compact" name="fulfillmentStatus" defaultValue={order.fulfillment_status} aria-label="Fulfilment status">{["unfulfilled","processing","packed","shipped","out_for_delivery","delivered","cancelled","returned"].map(v=><option key={v}>{v}</option>)}</UniversalSelect><input className="admin-input" name="carrier" defaultValue={order.carrier||""} placeholder="Carrier"/><input className="admin-input" name="trackingNumber" defaultValue={order.tracking_number||""} placeholder="Tracking number"/><input className="admin-input wide" name="trackingUrl" type="url" defaultValue={order.tracking_url||""} placeholder="Tracking URL"/><button className="admin-small-button primary" disabled={busy}>{busy?"Saving…":"Save order"}</button></form>;
}

export function PrintInvoiceButton(){return <button className="admin-button print-hide" type="button" onClick={()=>window.print()}>Print invoice</button>}

export function WhatsAppOrderButton({
  phone,
  orderNumber,
  customerName,
  totalInr,
}: {
  phone?: string | null;
  orderNumber: string;
  customerName?: string | null;
  totalInr?: number | string;
}) {
  if (!phone || phone === "—") return null;
  const digits = String(phone).replace(/\D/g, "");
  if (!digits) return null;
  const normalizedPhone = digits.length === 10 ? `91${digits}` : digits;
  const firstName = customerName && customerName !== "—" ? customerName.trim().split(/\s+/)[0] : "there";
  const formattedTotal = totalInr && totalInr !== "—" ? `₹${Number(totalInr).toLocaleString("en-IN")}` : "";
  const siteUrl = "https://www.carnivalofclothes.com";
  const trackingUrl = `${siteUrl}/track-order?orderNumber=${encodeURIComponent(orderNumber)}`;
  const message = `Hi ${firstName}! ✨ This is Nandini from Carnival of Clothes, Ahmedabad.\n\nYour order *#${orderNumber}*${formattedTotal ? ` (${formattedTotal})` : ""} is confirmed and being prepared with care in our boutique studio! 🛍️\n\n🚚 Live tracking:\n${trackingUrl}\n\nFeel free to reply if you need any styling help or delivery updates! 💕\n\n— Carnival of Clothes, Ahmedabad`;
  const url = `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="admin-small-button"
      style={{
        backgroundColor: "#25D366",
        color: "#fff",
        borderColor: "#25D366",
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        fontWeight: 600,
        textDecoration: "none",
      }}
      title="Send WhatsApp update to customer"
    >
      <span>💬 WhatsApp</span>
    </a>
  );
}
