import ShopClient from "./ShopClient";
import { commerceConfigured, getSupabaseAdmin } from "@/db";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Shop All Collections",
  description:
    "Explore our complete collection of women's dresses, party wear, co-ord sets, Indian wear, Korean fashion, and accessories at Carnival of Clothes Ahmedabad.",
};

export default async function ShopPage() {
  let initialRawProducts: Record<string, unknown>[] = [];
  if (commerceConfigured()) {
    try {
      const { data } = await getSupabaseAdmin()
        .from("products")
        .select(
          "id,name,slug,short_description,description,hero_image_url,price_inr,compare_at_price_inr,tags,is_featured,is_best_seller,is_new_arrival,created_at,product_variants(id,size,title,inventory_quantity,is_active)",
        )
        .eq("status", "active")
        .order("published_at", { ascending: false });
      if (data && Array.isArray(data)) {
        initialRawProducts = data as Record<string, unknown>[];
      }
    } catch {
      initialRawProducts = [];
    }
  }

  return <ShopClient initialRawProducts={initialRawProducts} />;
}

