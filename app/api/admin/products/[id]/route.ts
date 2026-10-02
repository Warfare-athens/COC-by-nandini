export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin, commerceConfigured } from "@/db";

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

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdmin()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!commerceConfigured())
    return NextResponse.json(
      { error: "Connect Supabase to manage products." },
      { status: 503 },
    );

  try {
    const { id } = await params;
    const supabase = getSupabaseAdmin();

    // 1. Fetch product to verify it exists and retain name for audit log
    const { data: product, error: fetchError } = await supabase
      .from("products")
      .select("id, name, slug")
      .eq("id", id)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!product) {
      return NextResponse.json(
        { error: "Product not found or already deleted." },
        { status: 404 },
      );
    }

    // 2. Query all variant IDs belonging to this product to clean up dependent child tables
    const { data: variants } = await supabase
      .from("product_variants")
      .select("id")
      .eq("product_id", id);

    const variantIds = (variants || []).map((v) => v.id);

    // 3. Remove inventory movements tracking for these variants (blocks variant deletion)
    if (variantIds.length > 0) {
      await supabase
        .from("inventory_movements")
        .delete()
        .in("variant_id", variantIds);
    }

    // 4. Safely detach historic order items: keep item details, nullify FKs
    await supabase
      .from("order_items")
      .update({ product_id: null, variant_id: null })
      .eq("product_id", id);

    if (variantIds.length > 0) {
      await supabase
        .from("order_items")
        .update({ variant_id: null })
        .in("variant_id", variantIds);
    }

    // 5. Clear cart items
    await supabase.from("cart_items").delete().eq("product_id", id);
    if (variantIds.length > 0) {
      await supabase.from("cart_items").delete().in("variant_id", variantIds);
    }

    // 6. Clear customer stock back-in-stock alerts
    await supabase.from("stock_requests").delete().eq("product_id", id);
    if (variantIds.length > 0) {
      await supabase.from("stock_requests").delete().in("variant_id", variantIds);
    }

    // 7. Clear reviews, categories, images, and variants
    await supabase.from("product_reviews").delete().eq("product_id", id);
    await supabase.from("product_categories").delete().eq("product_id", id);
    await supabase.from("product_images").delete().eq("product_id", id);
    await supabase.from("product_variants").delete().eq("product_id", id);

    // 8. Delete product row
    const { error: deleteError } = await supabase
      .from("products")
      .delete()
      .eq("id", id);

    if (deleteError) throw deleteError;

    // 4. Log audit trail
    await supabase.from("audit_logs").insert({
      actor: "admin",
      action: "product.deleted",
      entity_type: "product",
      entity_id: id,
      metadata: {
        name: product.name,
        slug: product.slug,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Product "${product.name}" has been permanently deleted.`,
      id,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to delete product.",
      },
      { status: 400 },
    );
  }
}

