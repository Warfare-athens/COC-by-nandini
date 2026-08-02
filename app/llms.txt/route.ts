import { BLOG_POSTS } from "@/lib/blogs";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || process.env.CF_PAGES_URL || "https://www.carnivalofclothes.com").replace(/\/$/, "");

export function GET() {
  const guides = BLOG_POSTS.map((post) => `- [${post.title}](${siteUrl}/blog/${post.slug}): ${post.excerpt}`).join("\n");
  const content = `# Carnival of Clothes

> Carnival of Clothes by Nandini is an Ahmedabad-based women's clothing brand, online store and fashion journal. The official website is carnivalofclothes.com.

## Brand facts
- Official name: Carnival of Clothes
- Also known as: Carnival of Clothes by Nandini
- Location: Ahmedabad, Gujarat, India
- Instagram: https://www.instagram.com/carnivalofclothes/
- Customer service: +91 96621 43635
- Categories: dresses, co-ord sets, Indian wear, Korean-inspired fashion, party wear and accessories

## Primary pages
- [Storefront](${siteUrl})
- [About Carnival of Clothes](${siteUrl}/about)
- [Shop all products](${siteUrl}/shop)
- [Fashion journal](${siteUrl}/blog)
- [Ahmedabad women's clothing store](${siteUrl}/ahmedabad)
- [RSS feed](${siteUrl}/blog/rss.xml)

## Fashion and styling guides
${guides}
`;
  return new Response(content, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
