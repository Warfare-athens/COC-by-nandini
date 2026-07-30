import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { commerceConfigured, getSupabaseAdmin } from "@/db";
import DynamicProductClient from "./DynamicProductClient";

export const dynamic = "force-dynamic";
const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.carnivalofclothes.com").replace(/\/$/, "");
const productFields = "id,name,slug,short_description,description,brand,hero_image_url,price_inr,compare_at_price_inr,material,care_instructions,style_notes,seo_title,seo_description,sku,tags,is_new_arrival,is_best_seller,product_variants(id,size,title,sku,price_inr,inventory_quantity,is_active),product_images(id,url,alt_text,is_hero,sort_order)";

async function getProduct(slug: string) {
  if (!commerceConfigured()) return null;
  const { data } = await getSupabaseAdmin().from("products").select(productFields).eq("slug", slug).eq("status", "active").maybeSingle();
  return data;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const product = await getProduct((await params).slug);
  if (!product) return {};
  const title = product.seo_title || `${product.name} in Ahmedabad`;
  const description = product.seo_description || product.short_description || `Shop ${product.name} from Carnival of Clothes by Nandini in Ahmedabad. View price, sizes, availability and product details.`;
  const image = product.hero_image_url || "/product.jpg";
  return {
    title,
    description,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: { type: "website", title, description, url: `/product/${product.slug}`, images: [{ url: image, alt: product.name }] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function DynamicProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();
  const { data: reviews } = await getSupabaseAdmin()
    .from("product_reviews")
    .select(
      "id,customer_name,rating,title,body,image_url,is_verified,created_at",
    )
    .eq("product_id", product.id)
    .eq("status", "approved")
    .order("created_at", { ascending: false });
  const variants = product.product_variants || [];
  const inStock = variants.some((variant) => variant.is_active && Number(variant.inventory_quantity) > 0);
  const productUrl = `${siteUrl}/product/${product.slug}`;
  const imageUrls = [product.hero_image_url, ...(product.product_images || []).map((image) => image.url)].filter(Boolean).map((image) => String(image).startsWith("http") ? image : `${siteUrl}${image}`);
  const ratingValue = reviews?.length ? reviews.reduce((sum, review) => sum + Number(review.rating), 0) / reviews.length : null;
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        "@id": `${productUrl}#product`,
        name: product.name,
        description: product.description || product.short_description,
        image: imageUrls,
        sku: product.sku || variants[0]?.sku,
        brand: { "@type": "Brand", name: product.brand || "Carnival of Clothes" },
        material: product.material || undefined,
        ...(ratingValue ? { aggregateRating: { "@type": "AggregateRating", ratingValue: ratingValue.toFixed(1), reviewCount: reviews?.length || 0 } } : {}),
        offers: {
          "@type": "Offer",
          url: productUrl,
          priceCurrency: "INR",
          price: Number(product.price_inr),
          availability: `https://schema.org/${inStock ? "InStock" : "OutOfStock"}`,
          itemCondition: "https://schema.org/NewCondition",
          seller: { "@type": "Organization", name: "Carnival of Clothes" },
          shippingDetails: {
            "@type": "OfferShippingDetails",
            shippingDestination: { "@type": "DefinedRegion", addressCountry: "IN" },
            shippingRate: { "@type": "MonetaryAmount", value: Number(product.price_inr) >= 2999 ? 0 : 149, currency: "INR" },
            deliveryTime: {
              "@type": "ShippingDeliveryTime",
              handlingTime: { "@type": "QuantitativeValue", minValue: 1, maxValue: 3, unitCode: "DAY" },
              transitTime: { "@type": "QuantitativeValue", minValue: 3, maxValue: 7, unitCode: "DAY" },
            },
          },
          hasMerchantReturnPolicy: {
            "@type": "MerchantReturnPolicy",
            applicableCountry: "IN",
            returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
            merchantReturnDays: 7,
            returnMethod: "https://schema.org/ReturnByMail",
            returnFees: "https://schema.org/FreeReturn",
          },
        },
      },
      { "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
        { "@type": "ListItem", position: 2, name: "Shop", item: `${siteUrl}/shop` },
        { "@type": "ListItem", position: 3, name: product.name, item: productUrl },
      ] },
    ],
  };
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
    <DynamicProductClient product={product} reviews={reviews || []} />
  </>;
}
