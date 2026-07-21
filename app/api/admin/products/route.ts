import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { commerceConfigured, getSupabaseAdmin } from "@/db";
import { z } from "zod";

const productSchema = z.object({
  name: z.string().min(2), slug: z.string().min(2).regex(/^[a-z0-9-]+$/), sku: z.string().min(2),
  shortDescription: z.string().max(100).optional(), description: z.string().optional(), heroImageUrl: z.string().url().or(z.string().startsWith("/")),
  priceInr: z.number().int().positive(), compareAtPriceInr: z.number().int().positive().optional(), status: z.enum(["draft", "active", "archived"]),
  isBestSeller: z.boolean(), isNewArrival: z.boolean(), isFeatured: z.boolean(), sizes: z.array(z.string()).default([]), inventoryQuantity: z.number().int().min(0).default(0),
  sizeInventory: z.array(z.object({ size: z.string().min(1), quantity: z.number().int().min(0) })).default([]),
  images: z.array(z.object({ url: z.string().url(), altText: z.string().optional() })).max(12).default([]),
  material: z.string().optional(), careInstructions: z.string().optional(), styleNotes: z.string().optional(), tags: z.array(z.string()).default([]),
  seoTitle: z.string().optional(), seoDescription: z.string().optional(), searchKeywords: z.array(z.string()).default([]), aiGenerated: z.boolean().default(false),
});

export async function POST(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!commerceConfigured()) return NextResponse.json({ error: "Add Supabase credentials before saving products." }, { status: 503 });
  try {
    const input = productSchema.parse(await request.json());
    const supabase = getSupabaseAdmin();
    const inventoryRows = input.sizeInventory.length ? input.sizeInventory : input.sizes.map((size) => ({ size, quantity: input.inventoryQuantity }));
    const essentialsComplete = Boolean(
      input.heroImageUrl && input.shortDescription && input.description &&
      input.tags.some((tag) => tag.startsWith("category:") && tag.length > 9) &&
      input.tags.some((tag) => tag.startsWith("occasion:") && tag.length > 9) &&
      inventoryRows.length && inventoryRows.some((row) => row.quantity > 0)
    );
    const productStatus = essentialsComplete ? "active" : "draft";
    const { data: product, error } = await supabase.from("products").insert({
      name: input.name, slug: input.slug, sku: input.sku, short_description: input.shortDescription || null, description: input.description || null,
      hero_image_url: input.heroImageUrl, price_inr: input.priceInr, compare_at_price_inr: input.compareAtPriceInr || null,
      status: productStatus, is_best_seller: input.isBestSeller, is_new_arrival: input.isNewArrival, is_featured: input.isFeatured,
      material: input.material || null, care_instructions: input.careInstructions || null, style_notes: input.styleNotes || null, tags: input.tags,
      seo_title: input.seoTitle || null, seo_description: input.seoDescription || null, search_keywords: input.searchKeywords.join(", ") || null,
      ai_generated_at: input.aiGenerated ? new Date().toISOString() : null,
      published_at: productStatus === "active" ? new Date().toISOString() : null,
    }).select("id,name,slug").single();
    if (error) throw error;
    if (inventoryRows.length) {
      const { error: variantError } = await supabase.from("product_variants").insert(inventoryRows.map(({ size, quantity }) => ({
        product_id: product.id, sku: `${input.sku}-${size.toUpperCase()}`, title: `Size ${size}`, size, inventory_quantity: quantity,
      })));
      if (variantError) throw variantError;
    }
    if (input.images.length) {
      const { error: imagesError } = await supabase.from("product_images").insert(input.images.map((image, index) => ({
        product_id: product.id, url: image.url, alt_text: image.altText || input.name, sort_order: index, is_hero: index === 0,
      })));
      if (imagesError) throw imagesError;
    }
    await supabase.from("audit_logs").insert({ actor: "admin", action: "product.created", entity_type: "product", entity_id: product.id, metadata: { name: input.name } });
    return NextResponse.json({ product, status: productStatus }, { status: 201 });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to save product." }, { status: 400 }); }
}
