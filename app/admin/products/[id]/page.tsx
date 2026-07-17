import AdminShell from "@/app/components/AdminShell";
import AdminProductEditForm from "@/app/components/AdminProductEditForm";
import { requireAdmin } from "@/lib/admin-auth";
import { commerceConfigured, getSupabaseAdmin } from "@/db";
import { notFound } from "next/navigation";

export default async function AdminProductEditPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  if (!commerceConfigured()) return <AdminShell><div className="admin-empty">Connect Supabase to edit products.</div></AdminShell>;
  const { id } = await params;
  const { data: product } = await getSupabaseAdmin().from("products").select("id,name,status,price_inr,compare_at_price_inr,hero_image_url,is_best_seller,is_new_arrival,is_featured").eq("id", id).maybeSingle();
  if (!product) notFound();
  return <AdminShell><div className="admin-head"><div><h1>Edit product</h1><p>Update storefront placement, pricing and the primary hero image.</p></div><a className="admin-link" href="/admin/products">Back to products</a></div><section className="admin-panel"><AdminProductEditForm product={product} /></section></AdminShell>;
}
