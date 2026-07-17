import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/db";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params; const input = await request.json();
  const allowed = ["name", "status", "price_inr", "compare_at_price_inr", "hero_image_url", "is_best_seller", "is_new_arrival", "is_featured"];
  const update = Object.fromEntries(Object.entries(input).filter(([key]) => allowed.includes(key)));
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("products").update({ ...update, updated_at: new Date().toISOString() }).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await supabase.from("audit_logs").insert({ actor: "admin", action: "product.updated", entity_type: "product", entity_id: id, metadata: update });
  return NextResponse.json({ product: data });
}
