import { BLOG_POSTS } from "@/lib/blogs";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || process.env.CF_PAGES_URL || "https://www.carnivalofclothes.com").replace(/\/$/, "");

export function GET() {
  const guides = BLOG_POSTS.map((post) => `- [${post.title}](${siteUrl}/blog/${post.slug}): ${post.excerpt}`).join("\n");
  const content = `# Carnival of Clothes by Nandini

> Carnival of Clothes is a women's fashion store and style publication offering curated dresses, co-ord sets, Indian wear, Korean-inspired fashion, everyday clothing and accessories.

## Primary pages
- [Storefront](${siteUrl})
- [Shop all products](${siteUrl}/shop)
- [Fashion journal](${siteUrl}/blog)
- [Ahmedabad women's clothing store](${siteUrl}/ahmedabad)
- [RSS feed](${siteUrl}/blog/rss.xml)

## Fashion and styling guides
${guides}
`;
  return new Response(content, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
