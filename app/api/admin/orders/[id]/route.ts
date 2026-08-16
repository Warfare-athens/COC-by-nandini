import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/db";

const schema = z.object({
  status: z.enum(["pending", "confirmed", "cancelled", "completed", "returned"]),
  fulfillmentStatus: z.enum(["unfulfilled", "processing", "packed", "shipped", "out_for_delivery", "delivered", "cancelled", "returned"]),
  carrier: z.string().max(100).optional().nullable(), trackingNumber: z.string().max(150).optional().nullable(),
  trackingUrl: z.union([z.string().url(), z.literal("")]).optional().nullable(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await params; const input = schema.parse(await request.json()); const supabase = getSupabaseAdmin();
    const { error: orderError } = await supabase.from("orders").update({ status: input.status, fulfillment_status: input.fulfillmentStatus, updated_at: new Date().toISOString() }).eq("id", id);
    if (orderError) throw orderError;
    const fulfillmentUpdate: Record<string, unknown> = { status: input.fulfillmentStatus, carrier: input.carrier || null, tracking_number: input.trackingNumber || null, tracking_url: input.trackingUrl || null, updated_at: new Date().toISOString() };
    if (input.fulfillmentStatus === "shipped") fulfillmentUpdate.shipped_at = new Date().toISOString();
    if (input.fulfillmentStatus === "delivered") fulfillmentUpdate.delivered_at = new Date().toISOString();
    const { data: fulfillment, error: fulfillmentError } = await supabase.from("fulfillments").update(fulfillmentUpdate).eq("order_id", id).select("id").maybeSingle();
    if (fulfillmentError) throw fulfillmentError;
    if (fulfillment) await supabase.from("tracking_events").insert({ fulfillment_id: fulfillment.id, status: input.fulfillmentStatus, message: `Order updated to ${input.fulfillmentStatus.replaceAll("_", " ")}.` });
    await supabase.from("audit_logs").insert({ actor: "admin", action: "order.updated", entity_type: "order", entity_id: id, metadata: input });
    return NextResponse.json({ ok: true });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update order" }, { status: 400 }); }
}
