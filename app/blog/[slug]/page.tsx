import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import Header from "../../components/Header";
import { BLOG_POSTS, BLOG_REDIRECTS, getBlogPost } from "@/lib/blogs";
import { collectionForBlogCategory } from "@/lib/collections";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || process.env.CF_PAGES_URL || "https://www.carnivalofclothes.com").replace(/\/$/, "");

export const dynamicParams = true;

const formatBlogDate = (value: string) =>
  new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric" }).format(new Date(`${value}T00:00:00Z`));

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
  if (!post) {
    const replacement = BLOG_REDIRECTS.get(slug);
    if (replacement && replacement !== `/blog/${slug}`) permanentRedirect(replacement);
    notFound();
  }
  const related = BLOG_POSTS.filter((item) => item.category === post.category && item.slug !== post.slug).slice(0, 3);
  const relatedCollection = collectionForBlogCategory(post.category);
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
        publisher: { "@type": "Organization", name: "Carnival of Clothes", url: siteUrl, logo: { "@type": "ImageObject", url: `${siteUrl}/favicon-logo.png`, width: 512, height: 512 } },
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
            <div><time dateTime={post.updatedAt}>Updated {formatBlogDate(post.updatedAt)}</time><span>·</span><span>{post.readTime}</span></div>
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
            {relatedCollection && <section className="article-answer">
              <span>SHOP THE EDIT</span>
              <h2>{relatedCollection.title}</h2>
              <p>{relatedCollection.intro}</p>
              <a href={`/collections/${relatedCollection.slug}`}>Explore {relatedCollection.name.toLowerCase()} at Carnival of Clothes →</a>
            </section>}
          </div>
        </div>
      </article>

      <section className="related-posts">
        <span>KEEP READING</span><h2>More {post.category.toLowerCase()} guides</h2>
        <div>{related.map((item) => <a href={`/blog/${item.slug}`} key={item.slug}><img src={item.image} alt="" /><span>{item.category}</span><h3>{item.title}</h3></a>)}</div>
      </section>
      <footer className="blog-footer"><a href="/ahmedabad">Carnival of Clothes by Nandini · Ahmedabad</a><span><a href="https://www.instagram.com/carnivalofclothes/" target="_blank" rel="noopener noreferrer">Instagram</a> · <a href="https://wa.me/919662143635" target="_blank" rel="noopener noreferrer">WhatsApp</a></span><a href="/blog">Explore all 100 guides →</a></footer>
    </main>
  );
}
