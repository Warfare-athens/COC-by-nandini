import { NextResponse } from "next/server";
import { z } from "zod";
import { commerceConfigured, getSupabaseAdmin } from "@/db";

const schema = z.object({
  anonymousToken: z.string().uuid(),
  email: z.union([z.string().email(), z.literal("")]).optional(),
  phone: z.string().max(30).optional(),
});

export async function POST(request: Request) {
  if (!commerceConfigured()) return NextResponse.json({ error: "Cart tracking unavailable" }, { status: 503 });
  try {
    const input = schema.parse(await request.json());
    const email = input.email?.trim().toLowerCase() || null;
    const phone = input.phone?.trim() || null;
    if (!email && !phone) return NextResponse.json({ error: "Add an email or phone number" }, { status: 400 });
    const supabase = getSupabaseAdmin();
    const { data: existing } = await supabase.from("carts").select("id,status,email,phone").eq("anonymous_token", input.anonymousToken).maybeSingle();
    if (existing?.status === "converted") return NextResponse.json({ ok: true, converted: true });
    const now = new Date().toISOString();
    const { data: cart, error } = await supabase.from("carts").upsert({
      anonymous_token: input.anonymousToken,
      email: email || existing?.email || null,
      phone: phone || existing?.phone || null,
      status: "checkout",
      last_activity_at: now,
      expires_at: new Date(Date.now() + 30 * 86_400_000).toISOString(),
      updated_at: now,
    }, { onConflict: "anonymous_token" }).select("id").single();
    if (error) throw error;
    await supabase.from("commerce_events").insert({ anonymous_id: input.anonymousToken, event_name: "checkout_contact_captured", path: "/checkout", metadata: { emailCaptured: Boolean(email), phoneCaptured: Boolean(phone), cartId: cart.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to save checkout progress" }, { status: 400 });
  }
}
