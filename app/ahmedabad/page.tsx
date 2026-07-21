import type { Metadata } from "next";
import Header from "../components/Header";
import styles from "./Ahmedabad.module.css";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || process.env.CF_PAGES_URL || "https://www.carnivalofclothes.com").replace(/\/$/, "");

export const metadata: Metadata = {
  title: "Women's Clothing Store in Ahmedabad",
  description: "Discover Carnival of Clothes by Nandini, an Ahmedabad-based women's clothing store for dresses, co-ord sets, Indian wear, Korean-inspired fashion, party wear and accessories.",
  keywords: ["clothing store in Ahmedabad", "women's clothing Ahmedabad", "women's fashion Ahmedabad", "dress shop Ahmedabad", "co-ord sets Ahmedabad", "party wear Ahmedabad", "Indian wear Ahmedabad"],
  alternates: { canonical: "/ahmedabad" },
  openGraph: {
    title: "Women's Clothing Store in Ahmedabad | Carnival of Clothes",
    description: "Curated women's fashion from Ahmedabad for everyday style and special occasions.",
    url: "/ahmedabad",
    images: [{ url: "/collection.jpg", alt: "Carnival of Clothes women's fashion store in Ahmedabad" }],
  },
};

const faqs = [
  { question: "Is Carnival of Clothes based in Ahmedabad?", answer: "Yes. Carnival of Clothes by Nandini is based in Ahmedabad, Gujarat, and offers curated women's fashion through its online store." },
  { question: "What clothing can I shop from Carnival of Clothes?", answer: "The collection includes dresses, co-ord sets, Indian wear, Korean-inspired clothing, party wear, tops, bottom wear and accessories." },
  { question: "Can customers outside Ahmedabad place an order?", answer: "Yes. Customers can browse the online collection and place orders from Ahmedabad and other supported delivery locations." },
  { question: "How do I find the latest arrivals?", answer: "Visit the Shop page and use the category and sorting options to explore current products and new arrivals." },
];

export default function AhmedabadPage() {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["ClothingStore", "OnlineStore"],
        "@id": `${siteUrl}/#organization`,
        name: "Carnival of Clothes by Nandini",
        alternateName: "Carnival of Clothes",
        url: siteUrl,
        logo: `${siteUrl}/favicon.svg`,
        image: `${siteUrl}/collection.jpg`,
        description: "Ahmedabad-based women's clothing store offering curated everyday and occasion fashion.",
        address: { "@type": "PostalAddress", addressLocality: "Ahmedabad", addressRegion: "Gujarat", addressCountry: "IN" },
        areaServed: [{ "@type": "City", name: "Ahmedabad" }, { "@type": "State", name: "Gujarat" }, { "@type": "Country", name: "India" }],
        knowsAbout: ["Women's clothing", "Dresses", "Co-ord sets", "Indian wear", "Korean fashion", "Party wear", "Accessories"],
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
          { "@type": "ListItem", position: 2, name: "Ahmedabad Clothing Store", item: `${siteUrl}/ahmedabad` },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: faqs.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })),
      },
    ],
  };

  return (
    <main className={styles.page}>
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <section className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>WOMEN’S FASHION · AHMEDABAD</span>
          <h1>Ahmedabad style,<br /><i>curated for you</i></h1>
          <p>Carnival of Clothes by Nandini is an Ahmedabad-based women’s clothing store bringing together dresses, co-ord sets, Indian wear, Korean-inspired styles and occasion pieces.</p>
          <div className={styles.actions}><a className={styles.primary} href="/shop">Shop the collection →</a><a className={styles.secondary} href="/blog">Explore style guides</a></div>
        </div>
        <div className={styles.heroImage}><img src="/collection.jpg" alt="Curated women's clothing from Carnival of Clothes in Ahmedabad" /></div>
      </section>

      <section className={styles.intro}>
        <div><span className={styles.sectionLabel}>BASED IN AHMEDABAD</span><h2>Your fashion partner for every occasion</h2></div>
        <div>
          <p>Our collections are selected for the way women in Ahmedabad really dress: comfortable everyday pieces, polished co-ords, expressive party looks and Indian styles for celebrations. Shop by your personal style rather than a passing rule.</p>
          <p>Every product page brings together clear imagery, prices, available sizes and useful styling details so you can make a more confident choice online.</p>
          <div className={styles.facts}><div><b>Ahmedabad</b><span>Home of Carnival of Clothes</span></div><div><b>Curated edits</b><span>Everyday and occasion fashion</span></div><div><b>Online access</b><span>Browse the latest collection anytime</span></div></div>
        </div>
      </section>

      <section className={styles.categories}>
        <span className={styles.sectionLabel}>SHOP WOMEN’S CLOTHING IN AHMEDABAD</span><h2>Find your next favourite</h2>
        <div className={styles.categoryGrid}>
          <a href="/shop?category=Dresses"><img src="/party-wear-red-dress.png" alt="Women's dresses in Ahmedabad" /><span>Dresses →</span></a>
          <a href="/shop?category=Co-ord%20Sets"><img src="/coord-set.jpg" alt="Women's co-ord sets in Ahmedabad" /><span>Co-ord sets →</span></a>
          <a href="/shop?category=Indian"><img src="/indian-suits.png" alt="Women's Indian wear in Ahmedabad" /><span>Indian wear →</span></a>
          <a href="/shop?occasion=Party%20Wear"><img src="/cocktail-dress.png" alt="Women's party wear in Ahmedabad" /><span>Party wear →</span></a>
        </div>
      </section>

      <section className={styles.why}>
        <div><span className={styles.sectionLabel}>CARNIVAL OF CLOTHES</span><h2>A local fashion name with an online wardrobe</h2><p>Being based in Ahmedabad shapes our eye for versatile clothing that can move between daily plans, festive calendars and special evenings. Our online store makes the collection easy to explore without filling the page with confusing choices.</p></div>
        <div className={styles.benefits}><div><b>Occasion-ready variety</b><p>Explore outfits for everyday wear, celebrations, parties and gifting.</p></div><div><b>Useful product information</b><p>Check product imagery, size availability, prices and details before ordering.</p></div><div><b>Style inspiration</b><p>Use our fashion journal for practical outfit, fit and wardrobe guidance.</p></div></div>
      </section>

      <section className={styles.faq}><span className={styles.sectionLabel}>LOCAL QUESTIONS</span><h2>Shopping Carnival of Clothes in Ahmedabad</h2>{faqs.map((item) => <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</section>
      <footer className={styles.footer}><span>Carnival of Clothes by Nandini · Ahmedabad, Gujarat</span><a href="/shop">Shop women’s clothing →</a></footer>
    </main>
  );
}
