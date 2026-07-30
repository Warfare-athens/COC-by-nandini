import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Header from "@/app/components/Header";
import { commerceConfigured, getSupabaseAdmin } from "@/db";
import { COLLECTIONS, collectionBySlug } from "@/lib/collections";
import styles from "./Collection.module.css";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.carnivalofclothes.com").replace(/\/$/, "");

export function generateStaticParams() {
  return COLLECTIONS.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const collection = collectionBySlug((await params).slug);
  if (!collection) return {};
  return {
    title: collection.title,
    description: collection.description,
    keywords: collection.keywords,
    alternates: { canonical: `/collections/${collection.slug}` },
    openGraph: { title: collection.title, description: collection.description, url: `/collections/${collection.slug}`, images: [{ url: collection.image }] },
  };
}

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const collection = collectionBySlug((await params).slug);
  if (!collection) notFound();
  const products = commerceConfigured()
    ? (await getSupabaseAdmin().from("products").select("name,slug,hero_image_url,price_inr").eq("status", "active").contains("tags", [`${collection.kind}:${collection.tag}`]).order("updated_at", { ascending: false }).limit(12)).data || []
    : [];
  const url = `${siteUrl}/collections/${collection.slug}`;
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "CollectionPage", "@id": url, url, name: collection.title, description: collection.description, isPartOf: { "@id": `${siteUrl}/#website` } },
      { "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
        { "@type": "ListItem", position: 2, name: "Shop", item: `${siteUrl}/shop` },
        { "@type": "ListItem", position: 3, name: collection.name, item: url },
      ] },
      ...(products.length ? [{ "@type": "ItemList", itemListElement: products.map((product, index) => ({ "@type": "ListItem", position: index + 1, url: `${siteUrl}/product/${product.slug}`, name: product.name })) }] : []),
    ],
  };
  return <main className={styles.page}>
    <Header activeTab="shop" />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
    <section className={styles.hero}>
      <div className={styles.copy}><span className={styles.eyebrow}>{collection.eyebrow}</span><h1>{collection.title}</h1><p>{collection.intro}</p><a href={`/shop?${collection.kind === "occasion" ? "occasion" : "category"}=${encodeURIComponent(collection.tag)}`}>Explore the complete edit →</a></div>
      <img className={styles.heroImage} src={collection.image} alt={`${collection.name} at Carnival of Clothes Ahmedabad`} />
    </section>
    <section className={styles.products}>
      <div className={styles.heading}><div><span className={styles.eyebrow}>SHOP THE COLLECTION</span><h2>Selected for you</h2></div><a href="/shop">View all clothing →</a></div>
      {products.length ? <div className={styles.grid}>{products.map((product) => <a className={styles.card} href={`/product/${product.slug}`} key={product.slug}><img src={product.hero_image_url || "/product.jpg"} alt={product.name} /><h3>{product.name}</h3><p>₹{Number(product.price_inr).toLocaleString("en-IN")}</p></a>)}</div> : <p className={styles.empty}>New pieces are being added to this collection. Explore the complete shop in the meantime.</p>}
    </section>
    <section className={styles.links}><span className={styles.eyebrow}>EXPLORE MORE</span><h2>More Carnival edits</h2><div className={styles.linkGrid}>{COLLECTIONS.filter((item) => item.slug !== collection.slug).map((item) => <a href={`/collections/${item.slug}`} key={item.slug}>{item.name}</a>)}</div></section>
  </main>;
}
