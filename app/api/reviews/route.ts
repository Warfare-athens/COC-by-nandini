import { NextResponse } from "next/server";
import { z } from "zod";
import { commerceConfigured, getSupabaseAdmin } from "@/db";
import { isCloudinaryReviewImage } from "@/lib/cloudinary";

const schema = z.object({
  productId: z.string().uuid(),
  customerName: z.string().trim().min(2).max(100),
  email: z.union([z.string().trim().email(), z.literal("")]).optional(),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().max(150).optional(),
  body: z.string().trim().min(3).max(2000),
  imageUrl: z.string().refine((value) => value === "" || isCloudinaryReviewImage(value), "Upload a review photo before submitting.").optional(),
}).superRefine((value, context) => {
  const wordCount = value.body.split(/\s+/).filter(Boolean).length;
  if (wordCount > 50) {
    context.addIssue({ code: "custom", path: ["body"], message: "Review must be 50 words or fewer." });
  }
});

export async function POST(request: Request) {
  if (!commerceConfigured()) return NextResponse.json({ error: "Reviews unavailable" }, { status: 503 });
  try {
    const input = schema.parse(await request.json());
    const { error } = await getSupabaseAdmin().from("product_reviews").insert({
      product_id: input.productId,
      customer_name: input.customerName,
      email: input.email?.toLowerCase() || null,
      rating: input.rating,
      title: input.title || null,
      body: input.body,
      image_url: input.imageUrl || null,
      status: "approved",
    });
    if (error) throw error;
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues[0]?.message || "Check your review details." }, { status: 400 });
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to submit review" }, { status: 400 });
  }
}
