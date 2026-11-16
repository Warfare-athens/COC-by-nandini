import HomeClient from "./components/HomeClient";
import { HomeProduct, mapDbProductToHomeProduct } from "@/lib/product-mapper";
import { commerceConfigured, getSupabaseAdmin } from "@/db";

export const dynamic = "force-dynamic";

export default async function Home() {
  let initialProducts: HomeProduct[] = [];
  let initialReviews: Array<Record<string, unknown>> = [];
  if (commerceConfigured()) {
    try {
      const supabase = getSupabaseAdmin();
      const { data } = await supabase
        .from("products")
        .select("id,name,slug,short_description,description,hero_image_url,price_inr,compare_at_price_inr,tags,is_featured,is_best_seller,is_new_arrival,created_at,product_variants(id,size,title,inventory_quantity,is_active)")
        .eq("status", "active")
        .order("published_at", { ascending: false });
      if (data && Array.isArray(data)) {
        initialProducts = data.map(mapDbProductToHomeProduct);
      }
      try {
        const { data: reviews } = await supabase
          .from("product_reviews")
          .select("id,customer_name,rating,title,body,image_url,is_verified,created_at,products!inner(name,slug)")
          .eq("status", "approved")
          .eq("products.status", "active")
          .order("created_at", { ascending: false })
          .limit(30);
        if (reviews && Array.isArray(reviews)) initialReviews = reviews as Array<Record<string, unknown>>;
      } catch {
        // Reviews are additive; a review query failure must not hide products.
        initialReviews = [];
      }
    } catch {
      initialProducts = [];
      initialReviews = [];
    }
  }

  return <HomeClient initialProducts={initialProducts} initialReviews={initialReviews} />;
}
