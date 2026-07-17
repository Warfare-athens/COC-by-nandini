import AdminShell from "@/app/components/AdminShell";
import { requireAdmin } from "@/lib/admin-auth";
import { adminDashboardData } from "@/lib/commerce";

type ProductRow = { id: string; name: string; status: string; price_inr: number; is_best_seller: boolean; is_new_arrival: boolean; is_featured: boolean };

export default async function AdminProductsPage() {
  await requireAdmin(); const data = await adminDashboardData();
  return <AdminShell><div className="admin-head"><div><h1>Products</h1><p>Create, publish and feature the catalog shown across the storefront.</p></div><a className="admin-button" href="/admin/products/new">Add product</a></div><section className="admin-panel"><table className="admin-table"><thead><tr><th>Product</th><th>Status</th><th>Price</th><th>Placement</th><th /></tr></thead><tbody>{data.products.map((product: ProductRow) => <tr key={product.id}><td>{product.name}</td><td><span className="admin-status">{product.status}</span></td><td>₹{Number(product.price_inr).toLocaleString("en-IN")}</td><td>{[product.is_best_seller && "Best seller", product.is_new_arrival && "New arrival", product.is_featured && "Featured"].filter(Boolean).join(" · ") || "—"}</td><td><a className="admin-link" href={`/admin/products/${product.id}`}>Edit</a></td></tr>)}{!data.products.length && <tr><td colSpan={5}>No database products yet. Add the first product after Supabase is connected.</td></tr>}</tbody></table></section></AdminShell>;
}
