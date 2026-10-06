export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { commerceConfigured, getSupabaseAdmin } from "@/db";
import { isAdmin } from "@/lib/admin-auth";

const requestSchema = z.object({
  action: z.enum(["archive", "restore", "duplicate"]),
  ids: z.array(z.string().uuid()).min(1).max(100),
});

export async function POST(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!commerceConfigured()) return NextResponse.json({ error: "Connect Supabase to manage products." }, { status: 503 });
  try {
    const input = requestSchema.parse(await request.json());
    const supabase = getSupabaseAdmin();
    const { data: products, error: productError } = await supabase.from("products").select("*,product_variants(*),product_images(*)").in("id", input.ids);
    if (productError) throw productError;
    if (!products?.length) return NextResponse.json({ error: "No matching products found." }, { status: 404 });

    if (input.action === "archive" || input.action === "restore") {
      const status = input.action === "archive" ? "archived" : "active";
      const { error } = await supabase.from("products").update({ status, published_at: status === "active" ? new Date().toISOString() : null, updated_at: new Date().toISOString() }).in("id", input.ids);
      if (error) throw error;
      await supabase.from("audit_logs").insert({ actor: "admin", action: `product.bulk_${input.action}`, entity_type: "product", metadata: { ids: input.ids } });
      return NextResponse.json({ updated: products.length, status });
    }

    const source = products[0] as Record<string, unknown>;
    const suffix = `copy-${Date.now().toString(36)}`;
    const { data: duplicate, error: duplicateError } = await supabase.from("products").insert({
      name: `${String(source.name || "Product")} (Copy)`, slug: `${String(source.slug || "product")}-${suffix}`.toLowerCase().replace(/[^a-z0-9-]/g, "-"), sku: `${String(source.sku || "SKU")}-${suffix}`.toUpperCase(), short_description: source.short_description, description: source.description, hero_image_url: source.hero_image_url, price_inr: source.price_inr, compare_at_price_inr: source.compare_at_price_inr, cost_inr: source.cost_inr, tax_rate: source.tax_rate, hsn_code: source.hsn_code, weight_grams: source.weight_grams, material: source.material, care_instructions: source.care_instructions, style_notes: source.style_notes, tags: source.tags, seo_title: source.seo_title, seo_description: source.seo_description, search_keywords: source.search_keywords, status: "draft", is_best_seller: false, is_new_arrival: false, is_featured: false,
    }).select("id,name,slug").single();
    if (duplicateError) throw duplicateError;
    const variants = (source.product_variants || []) as Record<string, unknown>[];
    if (variants.length) {
      const { error } = await supabase.from("product_variants").insert(variants.map((variant) => ({ product_id: duplicate.id, sku: `${String(variant.sku || "SKU")}-${suffix}`.toUpperCase(), title: variant.title, size: variant.size, color: variant.color, price_inr: variant.price_inr, compare_at_price_inr: variant.compare_at_price_inr, inventory_quantity: 0, low_stock_threshold: variant.low_stock_threshold ?? 2, is_active: false })));
      if (error) throw error;
    }
    const images = (source.product_images || []) as Record<string, unknown>[];
    if (images.length) {
      const { error } = await supabase.from("product_images").insert(images.map((image, index) => ({ product_id: duplicate.id, url: image.url, alt_text: image.alt_text, sort_order: index, is_hero: index === 0 })));
      if (error) throw error;
    }
    await supabase.from("audit_logs").insert({ actor: "admin", action: "product.duplicated", entity_type: "product", entity_id: duplicate.id, metadata: { sourceId: source.id, name: duplicate.name } });
    return NextResponse.json({ product: duplicate, status: "draft" }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update products." }, { status: 400 });
  }
}
