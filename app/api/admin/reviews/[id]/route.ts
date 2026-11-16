export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/db";
import { isAdmin } from "@/lib/admin-auth";

const updateSchema = z.object({
  productId: z.string().uuid().optional(),
  customerName: z.string().trim().min(2).max(100),
  email: z.union([z.string().trim().email(), z.literal("")]).optional(),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().max(150).optional(),
  body: z.string().trim().min(3),
  imageUrl: z.string().url().optional().or(z.literal("")),
  status: z.enum(["pending", "approved", "rejected"]),
  isVerified: z.boolean(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await params;
    const input = updateSchema.parse(await request.json());
    const supabase = getSupabaseAdmin();
    const { productId, ...rest } = input;
    if (rest.body.split(/\s+/).length > 50) {
      const { data: current, error } = await supabase.from("product_reviews").select("body").eq("id", id).maybeSingle();
      if (error) throw error;
      if (!current) return NextResponse.json({ error: "Review not found." }, { status: 404 });
      if (current.body.trim() !== rest.body) return NextResponse.json({ error: "Review must be 50 words or fewer." }, { status: 400 });
    }
    const { data, error } = await supabase.from("product_reviews").update({
      ...(productId ? { product_id: productId } : {}),
      customer_name: rest.customerName,
      email: rest.email || null,
      rating: rest.rating,
      title: rest.title || null,
      body: rest.body,
      image_url: rest.imageUrl || null,
      status: rest.status,
      is_verified: rest.isVerified,
      updated_at: new Date().toISOString(),
    }).eq("id", id).select("id").maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: "Review not found." }, { status: 404 });
    await supabase.from("audit_logs").insert({ actor: "admin", action: "reviews.updated", entity_type: "review", entity_id: id, metadata: { status: rest.status } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update review" }, { status: 400 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await params;
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from("product_reviews").delete().eq("id", id).select("id").maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: "Review not found." }, { status: 404 });
    await supabase.from("audit_logs").insert({ actor: "admin", action: "reviews.deleted", entity_type: "review", entity_id: id, metadata: {} });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to delete review" }, { status: 400 });
  }
}
