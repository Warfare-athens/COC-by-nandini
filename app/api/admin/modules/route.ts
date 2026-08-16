import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/db";

const requestSchema = z.object({ module: z.string().min(1), data: z.record(z.string(), z.unknown()).optional(), id: z.string().uuid().optional(), status: z.string().max(40).optional() });
const clean = (value: unknown) => String(value || "").trim() || null;
const integer = (value: unknown) => value === "" || value == null ? null : Number(value);

export async function POST(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { module, data = {} } = requestSchema.parse(await request.json());
    const supabase = getSupabaseAdmin();
    let table = ""; let payload: Record<string, unknown> = {};
    if (module === "content") { table = "content_entries"; payload = { type: clean(data.type) || "page", title: clean(data.title), slug: clean(data.slug)?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""), status: clean(data.status) || "draft", summary: clean(data.summary), body: clean(data.body), published_at: data.status === "published" ? new Date().toISOString() : null }; }
    else if (module === "media") { table = "media_assets"; payload = { url: clean(data.url), public_id: clean(data.publicId), filename: clean(data.filename), alt_text: clean(data.altText), folder: clean(data.folder) || "general", width: integer(data.width), height: integer(data.height), bytes: integer(data.bytes), mime_type: clean(data.format) }; }
    else if (module === "templates") { table = "admin_templates"; payload = { name: clean(data.name), type: clean(data.type) || "content", subject: clean(data.subject), body: clean(data.body), is_active: true }; }
    else if (module === "partnerships") { table = "partnerships"; payload = { name: clean(data.name), company: clean(data.company), email: clean(data.email), phone: clean(data.phone), type: clean(data.type) || "creator", status: clean(data.status) || "lead", value_inr: integer(data.valueInr) || 0, notes: clean(data.notes) }; }
    else if (module === "stock-requests") { table = "stock_requests"; payload = { customer_name: clean(data.customerName), email: clean(data.email), phone: clean(data.phone), requested_size: clean(data.requestedSize), status: "requested" }; }
    else if (module === "coupons") { table = "promotions"; payload = { name: clean(data.name), code: clean(data.code)?.toUpperCase(), type: clean(data.type) || "fixed", value: integer(data.value), minimum_subtotal_inr: integer(data.minimumSubtotalInr) || 0, usage_limit: integer(data.usageLimit), usage_count: 0, is_active: true }; }
    else return NextResponse.json({ error: "Unknown module" }, { status: 400 });
    const { data: saved, error } = await supabase.from(table).insert(payload).select("id").single();
    if (error) throw error;
    await supabase.from("audit_logs").insert({ actor: "admin", action: `${module}.created`, entity_type: module, entity_id: saved.id, metadata: { table } });
    return NextResponse.json({ ok: true, id: saved.id });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to save" }, { status: 400 }); }
}

export async function PATCH(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { module, id, status } = requestSchema.parse(await request.json());
    if (!id || !status) return NextResponse.json({ error: "Missing record or status" }, { status: 400 });
    const map: Record<string, { table: string; column: string; extra?: Record<string, unknown> }> = {
      reviews: { table: "product_reviews", column: "status" }, feedback: { table: "customer_feedback", column: "status" },
      partnerships: { table: "partnerships", column: "status" }, "stock-requests": { table: "stock_requests", column: "status", extra: status === "notified" ? { notified_at: new Date().toISOString() } : {} },
      content: { table: "content_entries", column: "status", extra: status === "published" ? { published_at: new Date().toISOString() } : {} },
      templates: { table: "admin_templates", column: "is_active" }, coupons: { table: "promotions", column: "is_active" },
      carts: { table: "carts", column: "status" },
    };
    const target = map[module]; if (!target) return NextResponse.json({ error: "Unknown module" }, { status: 400 });
    const value: string | boolean = target.column === "is_active" ? status === "active" : status;
    const supabase = getSupabaseAdmin(); const { error } = await supabase.from(target.table).update({ [target.column]: value, ...(target.extra || {}), updated_at: new Date().toISOString() }).eq("id", id);
    if (error) throw error;
    await supabase.from("audit_logs").insert({ actor: "admin", action: `${module}.updated`, entity_type: module, entity_id: id, metadata: { status } });
    return NextResponse.json({ ok: true });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update" }, { status: 400 }); }
}
