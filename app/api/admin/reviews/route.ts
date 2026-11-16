export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/db";
import { isAdmin } from "@/lib/admin-auth";

const reviewSchema = z.object({
  productId: z.string().uuid(),
  customerName: z.string().trim().min(2).max(100),
  email: z.union([z.string().trim().email(), z.literal("")]).optional(),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().max(150).optional(),
  body: z.string().trim().min(3),
  imageUrl: z.string().url().optional().or(z.literal("")),
  status: z.enum(["pending", "approved", "rejected"]).default("pending"),
  isVerified: z.boolean().default(false),
}).superRefine((value, context) => {
  if (value.body.split(/\s+/).filter(Boolean).length > 50) context.addIssue({ code: "custom", path: ["body"], message: "Review must be 50 words or fewer." });
});

export async function POST(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const input = reviewSchema.parse(await request.json());
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from("product_reviews").insert({
      product_id: input.productId,
      customer_name: input.customerName,
      email: input.email || null,
      rating: input.rating,
      title: input.title || null,
      body: input.body,
      image_url: input.imageUrl || null,
      status: input.status,
      is_verified: input.isVerified,
    }).select("id").single();
    if (error) throw error;
    await supabase.from("audit_logs").insert({ actor: "admin", action: "reviews.created", entity_type: "review", entity_id: data.id, metadata: { productId: input.productId } });
    return NextResponse.json({ ok: true, id: data.id }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create review" }, { status: 400 });
  }
}
