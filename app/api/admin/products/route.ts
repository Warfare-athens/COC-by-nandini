import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { commerceConfigured, getSupabaseAdmin } from "@/db";
import { z } from "zod";

const productSchema = z.object({
  name: z.string().min(2), slug: z.string().min(2).regex(/^[a-z0-9-]+$/), sku: z.string().min(2),
  shortDescription: z.string().optional(), description: z.string().optional(), heroImageUrl: z.string().url().or(z.string().startsWith("/")),
  priceInr: z.number().int().positive(), compareAtPriceInr: z.number().int().positive().optional(), status: z.enum(["draft", "active", "archived"]),
  isBestSeller: z.boolean(), isNewArrival: z.boolean(), isFeatured: z.boolean(), sizes: z.array(z.string()).default([]), inventoryQuantity: z.number().int().min(0).default(0),
});

export async function POST(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!commerceConfigured()) return NextResponse.json({ error: "Add Supabase credentials before saving products." }, { status: 503 });
  try {
    const input = productSchema.parse(await request.json());
    const supabase = getSupabaseAdmin();
    const { data: product, error } = await supabase.from("products").insert({
      name: input.name, slug: input.slug, sku: input.sku, short_description: input.shortDescription || null, description: input.description || null,
      hero_image_url: input.heroImageUrl, price_inr: input.priceInr, compare_at_price_inr: input.compareAtPriceInr || null,
      status: input.status, is_best_seller: input.isBestSeller, is_new_arrival: input.isNewArrival, is_featured: input.isFeatured,
      published_at: input.status === "active" ? new Date().toISOString() : null,
    }).select("id,name,slug").single();
    if (error) throw error;
    if (input.sizes.length) {
      const { error: variantError } = await supabase.from("product_variants").insert(input.sizes.map((size) => ({
        product_id: product.id, sku: `${input.sku}-${size.toUpperCase()}`, title: `Size ${size}`, size, inventory_quantity: input.inventoryQuantity,
      })));
      if (variantError) throw variantError;
    }
    await supabase.from("audit_logs").insert({ actor: "admin", action: "product.created", entity_type: "product", entity_id: product.id, metadata: { name: input.name } });
    return NextResponse.json({ product }, { status: 201 });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to save product." }, { status: 400 }); }
}
