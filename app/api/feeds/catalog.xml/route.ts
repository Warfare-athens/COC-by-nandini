import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/db";

export const dynamic = "force-dynamic";

function escapeXml(str: string | null | undefined): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.carnivalofclothes.com").replace(/\/$/, "");

    const { data: products, error } = await supabase
      .from("products")
      .select(`
        id,
        name,
        slug,
        short_description,
        description,
        hero_image_url,
        price_inr,
        compare_at_price_inr,
        sku,
        status,
        brand,
        material,
        product_variants (
          id,
          sku,
          size,
          inventory_quantity,
          is_active
        )
      `)
      .eq("status", "active");

    if (error) {
      console.error("[Catalog Feed Error]", error);
      return new NextResponse("Error generating feed", { status: 500 });
    }

    const itemsXml = (products || []).map((p: any) => {
      const hasStock = (p.product_variants || []).some(
        (v: any) => v.is_active && v.inventory_quantity > 0
      );
      const availability = hasStock ? "in_stock" : "out_of_stock";
      const productUrl = `${siteUrl}/product/${p.slug}`;
      const imageUrl = p.hero_image_url || "";
      const price = `${p.compare_at_price_inr && p.compare_at_price_inr > p.price_inr ? p.compare_at_price_inr : p.price_inr} INR`;
      const salePrice = p.compare_at_price_inr && p.compare_at_price_inr > p.price_inr ? `${p.price_inr} INR` : null;
      const desc = p.description || p.short_description || p.name;

      return `    <item>
      <g:id>${escapeXml(p.sku || p.id)}</g:id>
      <g:title><![CDATA[${p.name}]]></g:title>
      <g:description><![CDATA[${desc}]]></g:description>
      <g:link>${escapeXml(productUrl)}</g:link>
      <g:image_link>${escapeXml(imageUrl)}</g:image_link>
      <g:brand>${escapeXml(p.brand || "Carnival of Clothes")}</g:brand>
      <g:condition>new</g:condition>
      <g:availability>${availability}</g:availability>
      <g:price>${price}</g:price>${salePrice ? `\n      <g:sale_price>${salePrice}</g:sale_price>` : ""}
      <g:google_product_category>Apparel &amp; Accessories &gt; Clothing</g:google_product_category>
    </item>`;
    }).join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Carnival of Clothes Product Catalog</title>
    <link>${siteUrl}</link>
    <description>Luxury dresses, Korean fashion, Co-ords, and Everyday edits</description>
${itemsXml}
  </channel>
</rss>`;

    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (err: any) {
    console.error("[Catalog Feed Exception]", err);
    return new NextResponse("Server error", { status: 500 });
  }
}
