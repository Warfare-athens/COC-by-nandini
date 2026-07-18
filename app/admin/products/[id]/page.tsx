import AdminShell from "@/app/components/AdminShell";
import AdminProductEditForm from "@/app/components/AdminProductEditForm";
import { requireAdmin } from "@/lib/admin-auth";
import { commerceConfigured, getSupabaseAdmin } from "@/db";
import { notFound } from "next/navigation";

export default async function AdminProductEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  if (!commerceConfigured())
    return (
      <AdminShell>
        <div className="admin-empty">Connect Supabase to edit products.</div>
      </AdminShell>
    );
  const { id } = await params;
  const { data: product } = await getSupabaseAdmin()
    .from("products")
    .select(
      "id,name,slug,sku,status,short_description,description,brand,hero_image_url,price_inr,compare_at_price_inr,cost_inr,tax_rate,hsn_code,weight_grams,material,care_instructions,style_notes,tags,seo_title,seo_description,search_keywords,is_best_seller,is_new_arrival,is_featured,product_variants(id,sku,title,size,color,price_inr,compare_at_price_inr,inventory_quantity,low_stock_threshold,is_active),product_images(id,url,alt_text,is_hero,sort_order)",
    )
    .eq("id", id)
    .maybeSingle();
  if (!product) notFound();
  return (
    <AdminShell>
      <div className="admin-head">
        <h1>Edit product</h1>
        <a className="admin-link" href="/admin/products">
          Back to products
        </a>
      </div>
      <section className="admin-panel">
        <AdminProductEditForm product={product} />
      </section>
    </AdminShell>
  );
}
