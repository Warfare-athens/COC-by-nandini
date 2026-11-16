export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/db";
import { cartApiError } from "@/lib/commerce-cart";

const schema = z.object({
  status: z.enum(["pending", "pending_payment", "confirmed", "cancelled", "completed", "returned"]).optional(),
  fulfillmentStatus: z.enum(["unfulfilled", "processing", "packed", "shipped", "out_for_delivery", "delivered", "cancelled", "returned"]),
  carrier: z.string().trim().max(100).nullable().optional(),
  trackingNumber: z.string().trim().max(150).nullable().optional(),
  trackingUrl: z.union([z.url({ protocol: /^https?$/ }), z.literal("")]).nullable().optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await params;
    const input = schema.parse(await request.json());
    const tracking = {
      ...(input.carrier !== undefined && { carrier: input.carrier || null }),
      ...(input.trackingNumber !== undefined && { tracking_number: input.trackingNumber || null }),
      ...(input.trackingUrl !== undefined && { tracking_url: input.trackingUrl || null }),
    };
    const { data, error } = await getSupabaseAdmin().rpc("admin_update_shop_order", {
      p_id: id, p_status: input.status || null, p_fulfillment: input.fulfillmentStatus, p_tracking: tracking,
    });
    if (error) throw error;
    if (!data) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: cartApiError(error, "Unable to update order") }, { status: 400 });
  }
}
