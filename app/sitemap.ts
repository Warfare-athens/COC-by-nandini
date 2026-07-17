import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.CF_PAGES_URL;
  if (!siteUrl) return [];
  const lastModified = new Date();
  return [
    { url: siteUrl, lastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/shop`, lastModified, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/product/rose-pink-co-ord-set`, lastModified, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteUrl}/product/ivory-double-breasted-co-ord-set`, lastModified, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteUrl}/product/black-one-shoulder-maxi-dress`, lastModified, changeFrequency: "weekly", priority: 0.8 },
  ];
}
