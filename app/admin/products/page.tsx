import AdminShell from "@/app/components/AdminShell";
import { requireAdmin } from "@/lib/admin-auth";
import { adminDashboardData } from "@/lib/commerce";
import { tagValue } from "@/lib/product-taxonomy";

type ProductRow = {
  id: string;
  name: string;
  status: string;
  price_inr: number;
  hero_image_url: string;
  tags: string[] | null;
  product_categories: { categories: { name: string }[] }[];
};

export default async function AdminProductsPage() {
  await requireAdmin();
  const data = await adminDashboardData();
  return (
    <AdminShell>
      <div className="admin-head">
        <h1>Products</h1>
        <a className="admin-button" href="/admin/products/new">Add product</a>
      </div>
      <section className="admin-product-catalog">
        {data.products.map((product: ProductRow) => {
          const databaseCategory = (product.product_categories || [])
            .flatMap((item) => item.categories || [])[0]?.name;
          const category = tagValue(product.tags, "category") || databaseCategory || "Uncategorised";
          return (
            <a className="admin-product-card" href={`/admin/products/${product.id}`} key={product.id}>
              <span className="admin-product-card-image">
                <img src={product.hero_image_url} alt={product.name} />
                <span className="admin-product-edit-mark" aria-hidden="true">✎</span>
                {product.status !== "active" && <span className="admin-product-draft">{product.status}</span>}
              </span>
              <span className="admin-product-card-copy">
                <strong className="admin-product-name">{product.name}</strong>
                <small>{category}</small>
                <b>₹{Number(product.price_inr).toLocaleString("en-IN")}</b>
              </span>
            </a>
          );
        })}
        {!data.products.length && <div className="admin-product-empty">No products yet. Add your first product.</div>}
      </section>
    </AdminShell>
  );
}
