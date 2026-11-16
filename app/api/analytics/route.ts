import { NextResponse } from "next/server";
import { z } from "zod";
import { commerceConfigured, getSupabaseAdmin } from "@/db";
import { commerceActionLabels } from "@/lib/commerce-actions";

const eventSchema = z.object({
  eventName: z.enum(["page_view", "product_view", "button_clicked", "add_to_cart", "remove_from_cart", "cart_quantity_changed", "cart_viewed", "coupon_applied", "coupon_rejected", "coupon_removed", "checkout_started", "checkout_submitted", "checkout_failed", "checkout_contact_captured", "whatsapp_started"]),
  anonymousId: z.string().uuid(),
  visitorId: z.string().uuid().optional(),
  path: z.string().max(500).optional(),
  productId: z.string().uuid().optional(),
  metadata: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
});

const traffic = new Map<string, { count: number; resetAt: number }>();
function rateLimited(request: Request) {
  const address = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const now = Date.now();
  const current = traffic.get(address);
  if (!current || current.resetAt <= now) {
    traffic.set(address, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  current.count += 1;
  return current.count > 120;
}

export async function POST(request: Request) {
  if (!commerceConfigured()) return new Response(null, { status: 204 });
  if (rateLimited(request)) return NextResponse.json({ error: "Too many events" }, { status: 429 });
  try {
    const input = eventSchema.parse(await request.json());
    if (input.eventName === "button_clicked" && !Object.hasOwn(commerceActionLabels, String(input.metadata?.action))) {
      return NextResponse.json({ error: "Unknown storefront action" }, { status: 400 });
    }
    const { error } = await getSupabaseAdmin().from("commerce_events").insert({
      anonymous_id: input.anonymousId,
      event_name: input.eventName,
      path: input.path?.split("?")[0] || null,
      product_id: input.productId || null,
      metadata: { ...input.metadata, visitorId: input.visitorId || input.anonymousId },
    });
    if (error) throw error;
    return new Response(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "Invalid analytics event" }, { status: 400 });
  }
}
