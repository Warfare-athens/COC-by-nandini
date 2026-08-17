import { NextResponse } from "next/server";
import { z } from "zod";
import { commerceConfigured, getSupabaseAdmin } from "@/db";

const field = z.string().trim().max(300).optional();
const schema = z.object({
  anonymousToken: z.string().uuid(),
  fullName: field,
  email: z.string().trim().max(320).optional(),
  phone: z.string().trim().max(30).optional(),
  line1: field,
  line2: field,
  city: z.string().trim().max(100).optional(),
  state: z.string().trim().max(100).optional(),
  postalCode: z.string().trim().max(20).optional(),
  country: z.string().trim().max(100).optional(),
  paymentMethod: z.enum(["cod", "razorpay"]).optional(),
  lastField: z.enum(["fullName", "email", "phone", "line1", "line2", "city", "state", "postalCode", "country", "paymentMethod"]).optional(),
  attribution: z.object({
    source: z.string().trim().max(200).optional(),
    medium: z.string().trim().max(100).optional(),
    campaign: z.string().trim().max(200).optional(),
    landingPage: z.string().trim().max(500).optional(),
    referrer: z.string().trim().max(500).optional(),
    device: z.enum(["mobile", "tablet", "desktop"]).optional(),
  }).optional(),
});

const profileKeys = ["fullName", "email", "phone", "line1", "line2", "city", "state", "postalCode", "country", "paymentMethod"] as const;
const databaseKeys: Record<(typeof profileKeys)[number], string> = {
  fullName: "full_name",
  email: "email",
  phone: "phone",
  line1: "line1",
  line2: "line2",
  city: "city",
  state: "state",
  postalCode: "postal_code",
  country: "country",
  paymentMethod: "payment_method",
};

function cleaned(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function checkoutStep(values: Record<string, unknown>) {
  const hasAddress = ["line1", "line2", "city", "state", "postal_code"].some((key) => Boolean(values[key]));
  const addressComplete = ["line1", "city", "state", "postal_code"].every((key) => Boolean(values[key]));
  if (addressComplete) return "payment";
  if (hasAddress) return "delivery";
  return "personal";
}

export async function POST(request: Request) {
  if (!commerceConfigured()) return NextResponse.json({ error: "Cart tracking unavailable" }, { status: 503 });
  try {
    const input = schema.parse(await request.json());
    const supplied = profileKeys.filter((key) => input[key] !== undefined);
    if (!supplied.length) return NextResponse.json({ error: "No checkout fields supplied" }, { status: 400 });

    const supabase = getSupabaseAdmin();
    const selection = "id,status,full_name,email,phone,line1,line2,city,state,postal_code,country,payment_method,checkout_step,source,medium,campaign,landing_page,referrer,device";
    const { data: existing, error: readError } = await supabase.from("carts").select(selection).eq("anonymous_token", input.anonymousToken).maybeSingle();
    if (readError) throw readError;
    if (existing?.status === "converted") return NextResponse.json({ ok: true, converted: true, changedFields: [] });
    const existingRow = existing as Record<string, unknown> | null;

    const updates: Record<string, unknown> = {};
    const changedFields: string[] = [];
    for (const key of supplied) {
      const dbKey = databaseKeys[key];
      const value = cleaned(input[key]);
      if ((existingRow?.[dbKey] ?? null) !== value) changedFields.push(key);
      updates[dbKey] = value;
    }

    const merged = { ...(existingRow || {}), ...updates };
    const step = checkoutStep(merged);
    const now = new Date().toISOString();
    const attribution = input.attribution || {};
    const { data: cart, error } = await supabase.from("carts").upsert({
      anonymous_token: input.anonymousToken,
      ...updates,
      checkout_step: step,
      source: existing?.source || cleaned(attribution.source),
      medium: existing?.medium || cleaned(attribution.medium),
      campaign: existing?.campaign || cleaned(attribution.campaign),
      landing_page: existing?.landing_page || cleaned(attribution.landingPage),
      referrer: existing?.referrer || cleaned(attribution.referrer),
      device: existing?.device || cleaned(attribution.device),
      status: "checkout",
      last_activity_at: now,
      expires_at: new Date(Date.now() + 183 * 86_400_000).toISOString(),
      updated_at: now,
    }, { onConflict: "anonymous_token" }).select("id").single();
    if (error) throw error;

    const filledCount = profileKeys.filter((key) => Boolean(merged[databaseKeys[key]])).length;
    if (changedFields.length) {
      const completionPercent = Math.round(filledCount / profileKeys.length * 100);
      const events: Record<string, unknown>[] = [{
        anonymous_id: input.anonymousToken,
        event_name: "checkout_field_updated",
        path: "/checkout",
        metadata: { cartId: cart.id, changedFields, lastField: input.lastField || changedFields.at(-1), filledCount, completionPercent, checkoutStep: step },
      }];
      const contactChanged = changedFields.some((key) => key === "email" || key === "phone");
      if (contactChanged && (merged.email || merged.phone)) events.push({
        anonymous_id: input.anonymousToken,
        event_name: "checkout_contact_captured",
        path: "/checkout",
        metadata: { cartId: cart.id, changedFields: changedFields.filter((key) => key === "email" || key === "phone"), filledCount, completionPercent, checkoutStep: step, lastField: input.lastField },
      });
      const { error: eventError } = await supabase.from("commerce_events").insert(events);
      if (eventError) throw eventError;
    }
    return NextResponse.json({ ok: true, changedFields, checkoutStep: step });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to save checkout progress" }, { status: 400 });
  }
}
