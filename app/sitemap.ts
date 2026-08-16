import type { MetadataRoute } from "next";
import { commerceConfigured, getSupabaseAdmin } from "@/db";
import { BLOG_POSTS } from "@/lib/blogs";
import { COLLECTIONS } from "@/lib/collections";

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
    { url: `${baseUrl}/blog`, lastModified: generatedAt, changeFrequency: "weekly", priority: 0.85 },
    { url: `${baseUrl}/ahmedabad`, lastModified: generatedAt, changeFrequency: "weekly", priority: 0.9 },
    ...[
      ["about", 0.7],
      ["contact", 0.65],
      ["shipping-delivery", 0.6],
      ["returns-exchanges", 0.6],
      ["size-guide", 0.7],
      ["privacy-policy", 0.3],
      ["terms-conditions", 0.3],
    ].map(([path, priority]) => ({
      url: `${baseUrl}/${path}`,
      lastModified: generatedAt,
      changeFrequency: "yearly" as const,
      priority: Number(priority),
    })),
    ...COLLECTIONS.map((collection) => ({
      url: `${baseUrl}/collections/${collection.slug}`,
      lastModified: generatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.85,
    })),
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

  if (commerceConfigured()) {
    const supabase = getSupabaseAdmin();
    const [{ data: products }, { data: content }] = await Promise.all([supabase
      .from("products")
      .select("slug,updated_at")
      .eq("status", "active")
      .order("updated_at", { ascending: false }), supabase.from("content_entries").select("slug,updated_at").eq("status", "published")]);

    for (const product of products || []) {
      entries.push({
        url: `${baseUrl}/product/${product.slug}`,
        lastModified: product.updated_at ? new Date(product.updated_at) : generatedAt,
        changeFrequency: "weekly",
        priority: 0.85,
      });
    }
    for (const item of content || []) entries.push({ url: `${baseUrl}/content/${item.slug}`, lastModified: item.updated_at ? new Date(item.updated_at) : generatedAt, changeFrequency: "monthly", priority: 0.6 });
  }

  return entries;
}
