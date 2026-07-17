import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/db";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params; const { status, fulfillmentStatus, carrier, trackingNumber, trackingUrl } = await request.json(); const supabase = getSupabaseAdmin();
  await supabase.from("orders").update({ status, fulfillment_status: fulfillmentStatus, updated_at: new Date().toISOString() }).eq("id", id);
  const { data: fulfillment } = await supabase.from("fulfillments").update({ status: fulfillmentStatus, carrier: carrier || null, tracking_number: trackingNumber || null, tracking_url: trackingUrl || null }).eq("order_id", id).select("id").single();
  if (fulfillment) await supabase.from("tracking_events").insert({ fulfillment_id: fulfillment.id, status: fulfillmentStatus, message: `Order updated to ${fulfillmentStatus.replaceAll("_", " ")}.` });
  await supabase.from("audit_logs").insert({ actor: "admin", action: "order.updated", entity_type: "order", entity_id: id, metadata: { status, fulfillmentStatus, carrier, trackingNumber } });
  return NextResponse.json({ ok: true });
}
