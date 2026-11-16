"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { showGlobalStatus } from "@/app/global-status";
import UniversalSelect from "./UniversalSelect";

export default function AdminOrderDetailForm({ order }: { order: {
  id: string; status: string; fulfillment_status: string; payment_method: string; paid: boolean;
  carrier?: string | null; tracking_number?: string | null; tracking_url?: string | null;
} }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const awaitingPayment = order.payment_method === "razorpay" && !order.paid;
  const update = async (data: Record<string, unknown>) => {
    setBusy(true);
    try {
      const response = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Unable to update order");
      showGlobalStatus("Order updated", "success");
      router.refresh();
    } catch (error) {
      showGlobalStatus(error instanceof Error ? error.message : "Unable to update order", "error");
    } finally {
      setBusy(false);
    }
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void update(Object.fromEntries(new FormData(event.currentTarget)));
  };
  if (order.status === "cancelled") return <div className="admin-empty">Order cancelled.</div>;
  if (awaitingPayment) return <div className="admin-empty">
    <p>Shipping controls become available after payment is captured.</p>
    <button className="admin-small-button" type="button" disabled={busy} onClick={() => {
      if (window.confirm("Cancel this payment draft?")) void update({ status: "cancelled", fulfillmentStatus: "cancelled" });
    }}>{busy ? "Updating…" : "Cancel payment draft"}</button>
  </div>;

  return <form className="admin-inline-form" onSubmit={submit}>
    <UniversalSelect controlSize="compact" name="status" defaultValue={order.status} aria-label="Order status">
      {Array.from(new Set([order.status,"pending","confirmed","cancelled","completed","returned"])).map((value) => <option key={value} value={value}>{value.replaceAll("_", " ")}</option>)}
    </UniversalSelect>
    <UniversalSelect controlSize="compact" name="fulfillmentStatus" defaultValue={order.fulfillment_status} aria-label="Fulfillment status">
      {["unfulfilled","processing","packed","shipped","out_for_delivery","delivered","cancelled","returned"].map((value) => <option key={value} value={value}>{value.replaceAll("_", " ")}</option>)}
    </UniversalSelect>
    <input className="admin-input" name="carrier" defaultValue={order.carrier || ""} placeholder="Carrier" aria-label="Carrier" />
    <input className="admin-input" name="trackingNumber" defaultValue={order.tracking_number || ""} placeholder="Tracking number" aria-label="Tracking number" />
    <input className="admin-input wide" name="trackingUrl" type="url" defaultValue={order.tracking_url || ""} placeholder="Tracking URL" aria-label="Tracking URL" />
    <button className="admin-small-button primary" disabled={busy}>{busy ? "Saving…" : "Save order"}</button>
  </form>;
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
  const trackingUrl = `${siteUrl}/track-order?order=${encodeURIComponent(orderNumber)}`;
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
