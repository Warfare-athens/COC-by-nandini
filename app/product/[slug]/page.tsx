import { notFound } from "next/navigation";
import { commerceConfigured, getSupabaseAdmin } from "@/db";
import DynamicProductClient from "./DynamicProductClient";

export const dynamic = "force-dynamic";

export default async function DynamicProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  if (!commerceConfigured()) notFound();
  const { slug } = await params;
  const { data: product } = await getSupabaseAdmin()
    .from("products")
    .select(
      "id,name,slug,short_description,description,hero_image_url,price_inr,compare_at_price_inr,material,care_instructions,style_notes,is_new_arrival,is_best_seller,product_variants(id,size,title,inventory_quantity,is_active),product_images(id,url,alt_text,is_hero,sort_order)",
    )
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();
  if (!product) notFound();
  const { data: reviews } = await getSupabaseAdmin()
    .from("product_reviews")
    .select(
      "id,customer_name,rating,title,body,image_url,is_verified,created_at",
    )
    .eq("product_id", product.id)
    .eq("status", "approved")
    .order("created_at", { ascending: false });
  return <DynamicProductClient product={product} reviews={reviews || []} />;
}
