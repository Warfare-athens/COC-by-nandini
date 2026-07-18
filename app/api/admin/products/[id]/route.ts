import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/db";

const variantSchema = z.object({
  id: z.string().uuid().optional(),
  sku: z.string().min(1),
  title: z.string().min(1),
  size: z.string().nullable(),
  color: z.string().nullable(),
  price_inr: z.number().int().positive().nullable(),
  compare_at_price_inr: z.number().int().positive().nullable(),
  inventory_quantity: z.number().int().min(0),
  low_stock_threshold: z.number().int().min(0),
  is_active: z.boolean(),
});
const imageSchema = z.object({
  id: z.string().uuid().optional(),
  url: z.string().url(),
  alt_text: z.string().nullable(),
  is_hero: z.boolean(),
  sort_order: z.number().int().min(0),
});
const editSchema = z.object({
  name: z.string().min(2),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  sku: z.string().min(1),
  status: z.enum(["draft", "active", "archived"]),
  short_description: z.string().nullable(),
  description: z.string().nullable(),
  brand: z.string().min(1),
  hero_image_url: z.string().url(),
  price_inr: z.number().int().positive(),
  compare_at_price_inr: z.number().int().positive().nullable(),
  cost_inr: z.number().int().min(0).nullable(),
  tax_rate: z.string(),
  hsn_code: z.string().nullable(),
  weight_grams: z.number().int().min(0).nullable(),
  material: z.string().nullable(),
  care_instructions: z.string().nullable(),
  style_notes: z.string().nullable(),
  tags: z.array(z.string()),
  seo_title: z.string().nullable(),
  seo_description: z.string().nullable(),
  search_keywords: z.string().nullable(),
  is_best_seller: z.boolean(),
  is_new_arrival: z.boolean(),
  is_featured: z.boolean(),
  variants: z.array(variantSchema),
  images: z.array(imageSchema),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdmin()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await params;
    const input = editSchema.parse(await request.json());
    const supabase = getSupabaseAdmin();
    const { variants, images, ...product } = input;
    const { data, error } = await supabase
      .from("products")
      .update({
        ...product,
        published_at:
          product.status === "active" ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;

    const { data: oldVariants } = await supabase
      .from("product_variants")
      .select("id")
      .eq("product_id", id);
    const keptVariantIds = variants.flatMap((variant) =>
      variant.id ? [variant.id] : [],
    );
    for (const variant of variants) {
      const payload = {
        product_id: id,
        sku: variant.sku,
        title: variant.title,
        size: variant.size,
        color: variant.color,
        price_inr: variant.price_inr,
        compare_at_price_inr: variant.compare_at_price_inr,
        inventory_quantity: variant.inventory_quantity,
        low_stock_threshold: variant.low_stock_threshold,
        is_active: variant.is_active,
        updated_at: new Date().toISOString(),
      };
      if (variant.id) {
        const { error: variantError } = await supabase
          .from("product_variants")
          .update(payload)
          .eq("id", variant.id)
          .eq("product_id", id);
        if (variantError) throw variantError;
      } else {
        const { error: variantError } = await supabase
          .from("product_variants")
          .insert(payload);
        if (variantError) throw variantError;
      }
    }
    const removedVariantIds = (oldVariants || [])
      .map((item) => item.id)
      .filter((variantId) => !keptVariantIds.includes(variantId));
    if (removedVariantIds.length)
      await supabase
        .from("product_variants")
        .update({ is_active: false, inventory_quantity: 0 })
        .in("id", removedVariantIds);

    const { data: oldImages } = await supabase
      .from("product_images")
      .select("id")
      .eq("product_id", id);
    const keptImageIds = images.flatMap((image) =>
      image.id ? [image.id] : [],
    );
    for (const image of images) {
      const payload = {
        product_id: id,
        url: image.url,
        alt_text: image.alt_text,
        is_hero: image.is_hero,
        sort_order: image.sort_order,
        updated_at: new Date().toISOString(),
      };
      if (image.id) {
        const { error: imageError } = await supabase
          .from("product_images")
          .update(payload)
          .eq("id", image.id)
          .eq("product_id", id);
        if (imageError) throw imageError;
      } else {
        const { error: imageError } = await supabase
          .from("product_images")
          .insert(payload);
        if (imageError) throw imageError;
      }
    }
    const removedImageIds = (oldImages || [])
      .map((item) => item.id)
      .filter((imageId) => !keptImageIds.includes(imageId));
    if (removedImageIds.length)
      await supabase.from("product_images").delete().in("id", removedImageIds);
    await supabase
      .from("audit_logs")
      .insert({
        actor: "admin",
        action: "product.updated",
        entity_type: "product",
        entity_id: id,
        metadata: {
          name: product.name,
          variants: variants.length,
          images: images.length,
        },
      });
    return NextResponse.json({ product: data });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to update product.",
      },
      { status: 400 },
    );
  }
}
