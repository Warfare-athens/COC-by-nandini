import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/db";
import { z } from "zod";

const schema = z.object({ announcementEnabled: z.boolean(), announcementMessage: z.string().max(160), announcementLink: z.string().max(300).optional(), freeShippingThreshold: z.number().int().min(0), shippingCharge: z.number().int().min(0), codEnabled: z.boolean(), maintenanceMode: z.boolean() });
export async function POST(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const input = schema.parse(await request.json()); const supabase = getSupabaseAdmin();
    await supabase.from("announcements").update({ is_enabled: false }).neq("id", "00000000-0000-0000-0000-000000000000");
    if (input.announcementMessage) await supabase.from("announcements").insert({ message: input.announcementMessage, link_url: input.announcementLink || null, is_enabled: input.announcementEnabled });
    const values = { free_shipping_threshold: input.freeShippingThreshold, shipping_charge: input.shippingCharge, cod_enabled: input.codEnabled, maintenance_mode: input.maintenanceMode, razorpay_enabled: false };
    await supabase.from("store_settings").upsert(Object.entries(values).map(([key, value]) => ({ key, value })), { onConflict: "key" });
    await supabase.from("audit_logs").insert({ actor: "admin", action: "settings.updated", entity_type: "store_settings", metadata: input });
    return NextResponse.json({ ok: true });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to save settings." }, { status: 400 }); }
}
