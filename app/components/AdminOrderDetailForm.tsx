"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { showGlobalStatus } from "@/app/global-status";

export default function AdminOrderDetailForm({ order }: { order: { id: string; status: string; fulfillment_status: string; carrier?: string | null; tracking_number?: string | null; tracking_url?: string | null } }) {
  const [busy,setBusy]=useState(false); const router=useRouter();
  const submit=async(event:FormEvent<HTMLFormElement>)=>{event.preventDefault();setBusy(true);const form=new FormData(event.currentTarget);const response=await fetch(`/api/admin/orders/${order.id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status:form.get("status"),fulfillmentStatus:form.get("fulfillmentStatus"),carrier:form.get("carrier"),trackingNumber:form.get("trackingNumber"),trackingUrl:form.get("trackingUrl")})});const payload=await response.json();setBusy(false);if(!response.ok)return showGlobalStatus(payload.error||"Unable to update order","error");showGlobalStatus("Order updated","success");router.refresh()};
  return <form className="admin-inline-form" onSubmit={submit}><select className="admin-select" name="status" defaultValue={order.status}>{["pending","confirmed","cancelled","completed","returned"].map(v=><option key={v}>{v}</option>)}</select><select className="admin-select" name="fulfillmentStatus" defaultValue={order.fulfillment_status}>{["unfulfilled","processing","packed","shipped","out_for_delivery","delivered","cancelled","returned"].map(v=><option key={v}>{v}</option>)}</select><input className="admin-input" name="carrier" defaultValue={order.carrier||""} placeholder="Carrier"/><input className="admin-input" name="trackingNumber" defaultValue={order.tracking_number||""} placeholder="Tracking number"/><input className="admin-input wide" name="trackingUrl" type="url" defaultValue={order.tracking_url||""} placeholder="Tracking URL"/><button className="admin-small-button primary" disabled={busy}>{busy?"Saving…":"Save order"}</button></form>;
}

export function PrintInvoiceButton(){return <button className="admin-button print-hide" type="button" onClick={()=>window.print()}>Print invoice</button>}
