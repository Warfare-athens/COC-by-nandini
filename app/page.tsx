import HomeClient from "./components/HomeClient";
import { HomeProduct, mapDbProductToHomeProduct } from "@/lib/product-mapper";
import { commerceConfigured, getSupabaseAdmin } from "@/db";

export const dynamic = "force-dynamic";

export default async function Home() {
  let initialProducts: HomeProduct[] = [];
  if (commerceConfigured()) {
    try {
      const { data } = await getSupabaseAdmin()
        .from("products")
        .select("id,name,slug,short_description,description,hero_image_url,price_inr,compare_at_price_inr,tags,is_featured,is_best_seller,is_new_arrival,created_at,product_variants(id,size,title,inventory_quantity,is_active)")
        .eq("status", "active")
        .order("published_at", { ascending: false });
      if (data && Array.isArray(data)) {
        initialProducts = data.map(mapDbProductToHomeProduct);
      }
    } catch {
      initialProducts = [];
    }
  }

  return <HomeClient initialProducts={initialProducts} />;
}
