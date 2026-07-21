import type { Metadata } from "next";
import "./globals.css";
import GlobalStatusLoader from "./components/GlobalStatusLoader";

const publicSiteUrl = (process.env.NEXT_PUBLIC_SITE_URL || process.env.CF_PAGES_URL || "https://www.carnivalofclothes.com").replace(/\/$/, "");

export const metadata: Metadata = {
  ...(publicSiteUrl ? { metadataBase: new URL(publicSiteUrl), alternates: { canonical: "/" } } : {}),
  applicationName: "Carnival of Clothes",
  title: {
    default: "Women's Clothing Store in Ahmedabad | Carnival of Clothes",
    template: "%s | Carnival of Clothes",
  },
  description: "Shop curated women's clothing from Carnival of Clothes by Nandini in Ahmedabad, including dresses, co-ords, Indian wear, Korean styles, party wear and accessories.",
  keywords: ["Carnival of Clothes", "Carnival of Clothes by Nandini", "women's clothing store Ahmedabad", "women's fashion Ahmedabad", "dress shop Ahmedabad", "women's clothing India", "fashion blog India", "co-ord sets Ahmedabad", "party wear Ahmedabad", "Korean fashion", "Indian wear Ahmedabad"],
  authors: [{ name: "Carnival of Clothes by Nandini" }],
  creator: "Carnival of Clothes by Nandini",
  publisher: "Carnival of Clothes",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
  openGraph: {
    type: "website",
    siteName: "Carnival of Clothes",
    title: "Women's Clothing Store in Ahmedabad | Carnival of Clothes",
    description: "Ahmedabad-based curated women's fashion for everyday elegance and every special moment.",
    ...(publicSiteUrl ? { images: [{ url: "/hero.jpg", width: 1200, height: 900, alt: "Carnival of Clothes by Nandini" }] } : {}),
  },
  twitter: {
    card: "summary_large_image",
    title: "Women's Clothing Store in Ahmedabad | Carnival of Clothes",
    description: "Ahmedabad-based curated women's fashion for everyday elegance and every special moment.",
    ...(publicSiteUrl ? { images: ["/hero.jpg"] } : {}),
  },
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const brandSchema = publicSiteUrl ? {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebSite", "@id": `${publicSiteUrl}/#website`, url: publicSiteUrl, name: "Carnival of Clothes", alternateName: "Carnival of Clothes by Nandini", inLanguage: "en-IN", potentialAction: { "@type": "SearchAction", target: `${publicSiteUrl}/shop?search={search_term_string}`, "query-input": "required name=search_term_string" } },
      { "@type": ["ClothingStore", "OnlineStore"], "@id": `${publicSiteUrl}/#organization`, url: publicSiteUrl, name: "Carnival of Clothes", alternateName: "Carnival of Clothes by Nandini", description: "Ahmedabad-based women's clothing store for curated everyday and occasion fashion.", logo: `${publicSiteUrl}/favicon.svg`, image: `${publicSiteUrl}/collection.jpg`, address: { "@type": "PostalAddress", addressLocality: "Ahmedabad", addressRegion: "Gujarat", addressCountry: "IN" }, areaServed: [{ "@type": "City", name: "Ahmedabad" }, { "@type": "State", name: "Gujarat" }, { "@type": "Country", name: "India" }] },
    ],
  } : null;

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital,wght@0,400;1,400&family=Work+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
        <link rel="alternate" type="application/rss+xml" title="Carnival of Clothes Fashion Journal" href="/blog/rss.xml" />
        {brandSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(brandSchema) }} />}
      </head>
      <body className="selection:bg-[#e8b9b2] selection:text-[#3a2926]">
        <GlobalStatusLoader />
        {children}
      </body>
    </html>
  );
}
