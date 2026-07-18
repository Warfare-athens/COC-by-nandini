import { NextResponse } from "next/server";
import { commerceConfigured, getSupabaseAdmin } from "@/db";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!commerceConfigured()) return NextResponse.json({ products: [] });
  const { data, error } = await getSupabaseAdmin()
    .from("products")
    .select(
      "id,name,slug,short_description,description,hero_image_url,price_inr,compare_at_price_inr,tags,is_featured,is_best_seller,is_new_arrival,created_at",
    )
    .eq("status", "active")
    .order("published_at", { ascending: false });
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(
    { products: data || [] },
    { headers: { "Cache-Control": "no-store" } },
  );
}
