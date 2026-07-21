import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Header from "../../components/Header";
import { BLOG_POSTS, getBlogPost } from "@/lib/blogs";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || process.env.CF_PAGES_URL || "https://www.carnivalofclothes.com").replace(/\/$/, "");

export const dynamicParams = false;

export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return {};
  const canonical = `/blog/${post.slug}`;
  return {
    title: post.title,
    description: post.excerpt,
    keywords: post.keywords,
    alternates: { canonical },
    authors: [{ name: "Carnival of Clothes by Nandini" }],
    openGraph: {
      type: "article",
      url: canonical,
      title: post.title,
      description: post.excerpt,
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      section: post.category,
      tags: post.keywords,
      images: [{ url: post.image, alt: post.imageAlt }],
    },
    twitter: { card: "summary_large_image", title: post.title, description: post.excerpt, images: [post.image] },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();
  const related = BLOG_POSTS.filter((item) => item.category === post.category && item.slug !== post.slug).slice(0, 3);
  const articleUrl = `${siteUrl}/blog/${post.slug}`;
  const schemas = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        "@id": `${articleUrl}#article`,
        headline: post.title,
        description: post.excerpt,
        image: `${siteUrl}${post.image}`,
        datePublished: post.publishedAt,
        dateModified: post.updatedAt,
        mainEntityOfPage: articleUrl,
        author: { "@type": "Organization", name: "Carnival of Clothes by Nandini", url: siteUrl },
        publisher: { "@type": "Organization", name: "Carnival of Clothes", url: siteUrl, logo: { "@type": "ImageObject", url: `${siteUrl}/favicon.svg` } },
        articleSection: post.category,
        keywords: post.keywords.join(", "),
        speakable: { "@type": "SpeakableSpecification", cssSelector: [".article-answer", ".article-content h2"] },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
          { "@type": "ListItem", position: 2, name: "Blog", item: `${siteUrl}/blog` },
          { "@type": "ListItem", position: 3, name: post.title, item: articleUrl },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: post.faq.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      },
    ],
  };

  return (
    <main className="article-page">
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }} />
      <nav className="article-breadcrumb" aria-label="Breadcrumb">
        <a href="/">Home</a><span>›</span><a href="/blog">Journal</a><span>›</span><span>{post.category}</span>
      </nav>
      <article>
        <header className="article-header">
          <div className="article-heading">
            <span>{post.category}</span>
            <h1>{post.title}</h1>
            <p>{post.excerpt}</p>
            <div><time dateTime={post.updatedAt}>Updated July 21, 2026</time><span>·</span><span>{post.readTime}</span></div>
          </div>
          <div className="article-hero-image"><img src={post.image} alt={post.imageAlt} /></div>
        </header>

        <div className="article-layout">
          <aside className="article-toc">
            <b>IN THIS GUIDE</b>
            {post.sections.map((section, index) => <a href={`#section-${index}`} key={section.heading}>{section.heading}</a>)}
            <a href="#frequently-asked-questions">Frequently asked questions</a>
          </aside>
          <div className="article-content">
            <div className="article-answer">
              <span>QUICK ANSWER</span>
              <p>{post.answer}</p>
            </div>
            {post.sections.map((section, index) => (
              <section id={`section-${index}`} key={section.heading}>
                <h2>{section.heading}</h2>
                {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                {section.tips && <ul>{section.tips.map((tip) => <li key={tip}>{tip}</li>)}</ul>}
              </section>
            ))}
            <section className="article-faq" id="frequently-asked-questions">
              <span>YOUR QUESTIONS, ANSWERED</span>
              <h2>Frequently asked questions</h2>
              {post.faq.map((item) => (
                <details key={item.question}>
                  <summary>{item.question}</summary>
                  <p>{item.answer}</p>
                </details>
              ))}
            </section>
          </div>
        </div>
      </article>

      <section className="related-posts">
        <span>KEEP READING</span><h2>More {post.category.toLowerCase()} guides</h2>
        <div>{related.map((item) => <a href={`/blog/${item.slug}`} key={item.slug}><img src={item.image} alt="" /><span>{item.category}</span><h3>{item.title}</h3></a>)}</div>
      </section>
      <footer className="blog-footer"><a href="/ahmedabad">Carnival of Clothes by Nandini · Ahmedabad</a><a href="/blog">Explore all 100 guides →</a></footer>
    </main>
  );
}
