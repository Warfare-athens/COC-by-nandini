import AdminProductCatalog from "@/app/components/AdminProductCatalog";
import { AdminPageHeader } from "@/app/components/AdminUI";
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
  product_variants: { inventory_quantity: number; low_stock_threshold?: number }[];
  is_best_seller: boolean;
  is_new_arrival: boolean;
  is_featured: boolean;
};

export default async function AdminProductsPage() {
  const data = await adminDashboardData();
  const products = (data.products as ProductRow[]).map((product) => {
    const databaseCategory = (product.product_categories || []).flatMap((item) => item.categories || [])[0]?.name;
    return {
      id: product.id,
      name: product.name,
      status: product.status,
      price: Number(product.price_inr),
      heroImageUrl: product.hero_image_url,
      category: tagValue(product.tags, "category") || databaseCategory || "Uncategorised",
      inventory: (product.product_variants || []).reduce((sum, variant) => sum + Number(variant.inventory_quantity || 0), 0),
      lowStock: (product.product_variants || []).some((variant) => Number(variant.inventory_quantity || 0) > 0 && Number(variant.inventory_quantity || 0) <= Number(variant.low_stock_threshold || 2)),
      bestSeller: Boolean(product.is_best_seller),
      newArrival: Boolean(product.is_new_arrival),
      featured: Boolean(product.is_featured),
    };
  });
  return <>
      <AdminPageHeader title="Products" actions={<a className="admin-button" href="/admin/products/new">Add product</a>}>Manage your catalog, availability, pricing, and merchandising.</AdminPageHeader>
      <AdminProductCatalog products={products} />
    </>;
}
