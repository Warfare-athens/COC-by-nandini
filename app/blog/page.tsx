import type { Metadata } from "next";
import Header from "../components/Header";
import { BLOG_CATEGORIES, BLOG_POSTS } from "@/lib/blogs";

export const metadata: Metadata = {
  title: "Women's Fashion Blog & Style Guides",
  description: "Explore 100 practical women's fashion guides covering dresses, co-ord sets, Indian wear, Korean style, party outfits, accessories and smart online shopping.",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "Women's Fashion Blog & Style Guides | Carnival of Clothes",
    description: "Helpful, answer-first style guides for building outfits you love and a wardrobe you actually wear.",
    url: "/blog",
    images: [{ url: "/collection.jpg", alt: "Carnival of Clothes fashion guides" }],
  },
};

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const activeCategory = BLOG_CATEGORIES.includes(category || "") ? category! : "All";
  const posts = activeCategory === "All" ? BLOG_POSTS : BLOG_POSTS.filter((post) => post.category === activeCategory);

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Carnival of Clothes Fashion Blog",
    description: "Practical women's fashion, styling and shopping guides.",
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: posts.length,
      itemListElement: posts.map((post, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `/blog/${post.slug}`,
        name: post.title,
      })),
    },
  };

  return (
    <main className="blog-page">
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }} />
      <header className="blog-hero">
        <span>THE CARNIVAL JOURNAL</span>
        <h1>Style advice for <i>real wardrobes</i></h1>
        <p>100 practical guides to help you choose, style, rewear and care for clothes with confidence.</p>
      </header>

      <nav className="blog-filters" aria-label="Blog categories">
        {BLOG_CATEGORIES.map((item) => (
          <a
            className={activeCategory === item ? "active" : ""}
            href={item === "All" ? "/blog" : `/blog?category=${encodeURIComponent(item)}`}
            key={item}
          >
            {item}
          </a>
        ))}
      </nav>

      <section className="blog-index" aria-labelledby="blog-results-title">
        <div className="blog-index-heading">
          <div>
            <span>{activeCategory === "All" ? "EXPLORE ALL TOPICS" : activeCategory.toUpperCase()}</span>
            <h2 id="blog-results-title">{activeCategory === "All" ? "Latest from the journal" : `${activeCategory} guides`}</h2>
          </div>
          <p>{posts.length} articles</p>
        </div>
        <div className="blog-grid">
          {posts.map((post, index) => (
            <article className={index === 0 ? "blog-card featured" : "blog-card"} key={post.slug}>
              <a className="blog-card-image" href={`/blog/${post.slug}`}>
                <img src={post.image} alt={post.imageAlt} loading={index < 4 ? "eager" : "lazy"} />
              </a>
              <div className="blog-card-copy">
                <span>{post.category} · {post.readTime}</span>
                <h3><a href={`/blog/${post.slug}`}>{post.title}</a></h3>
                <p>{post.excerpt}</p>
                <a className="blog-read-link" href={`/blog/${post.slug}`}>Read guide <span>→</span></a>
              </div>
            </article>
          ))}
        </div>
      </section>
      <footer className="blog-footer">
        <a href="/">Carnival of Clothes by Nandini</a>
        <span>Thoughtful fashion from Ahmedabad for every occasion.</span>
      </footer>
    </main>
  );
}
