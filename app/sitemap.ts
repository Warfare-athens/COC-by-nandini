import type { MetadataRoute } from "next";
import { commerceConfigured, getSupabaseAdmin } from "@/db";
import { OCCASIONS, PRODUCT_TAXONOMY } from "@/lib/product-taxonomy";
import { BLOG_POSTS } from "@/lib/blogs";

const siteUrl = () =>
  (process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.CF_PAGES_URL ||
    "https://www.carnivalofclothes.com").replace(/\/$/, "");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteUrl();
  const generatedAt = new Date();
  const entries: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: generatedAt, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/shop`, lastModified: generatedAt, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/track-order`, lastModified: generatedAt, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/checkout`, lastModified: generatedAt, changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/blog`, lastModified: generatedAt, changeFrequency: "weekly", priority: 0.85 },
    { url: `${baseUrl}/ahmedabad`, lastModified: generatedAt, changeFrequency: "weekly", priority: 0.9 },
  ];

  for (const post of BLOG_POSTS) {
    entries.push({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: new Date(post.updatedAt),
      changeFrequency: "monthly",
      priority: 0.7,
      images: [`${baseUrl}${post.image}`],
    });
  }

  for (const [category, subcategories] of Object.entries(PRODUCT_TAXONOMY)) {
    entries.push({
      url: `${baseUrl}/shop?category=${encodeURIComponent(category)}`,
      lastModified: generatedAt,
      changeFrequency: "weekly",
      priority: 0.75,
    });
    for (const subcategory of subcategories) {
      entries.push({
        url: `${baseUrl}/shop?category=${encodeURIComponent(category)}&subcategory=${encodeURIComponent(subcategory)}`,
        lastModified: generatedAt,
        changeFrequency: "weekly",
        priority: 0.65,
      });
    }
  }

  for (const occasion of OCCASIONS) {
    entries.push({
      url: `${baseUrl}/shop?occasion=${encodeURIComponent(occasion)}`,
      lastModified: generatedAt,
      changeFrequency: "weekly",
      priority: 0.75,
    });
  }

  if (commerceConfigured()) {
    const { data: products } = await getSupabaseAdmin()
      .from("products")
      .select("slug,updated_at")
      .eq("status", "active")
      .order("updated_at", { ascending: false });

    for (const product of products || []) {
      entries.push({
        url: `${baseUrl}/product/${product.slug}`,
        lastModified: product.updated_at ? new Date(product.updated_at) : generatedAt,
        changeFrequency: "weekly",
        priority: 0.85,
      });
    }
  }

  return entries;
}
