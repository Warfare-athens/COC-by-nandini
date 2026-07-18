import type { Metadata } from "next";
import "./globals.css";

const publicSiteUrl = (process.env.NEXT_PUBLIC_SITE_URL || process.env.CF_PAGES_URL || "https://www.carnivalofclothes.com").replace(/\/$/, "");

export const metadata: Metadata = {
  ...(publicSiteUrl ? { metadataBase: new URL(publicSiteUrl), alternates: { canonical: "/" } } : {}),
  applicationName: "Carnival of Clothes",
  title: {
    default: "Carnival of Clothes | Women's Fashion by Nandini",
    template: "%s | Carnival of Clothes",
  },
  description: "Shop Carnival of Clothes by Nandini for curated women's fashion, co-ord sets, dresses, party wear, Korean styles, Indian wear and accessories.",
  keywords: ["Carnival of Clothes", "Carnival of Clothes by Nandini", "women's fashion", "women's clothing India", "co-ord sets", "party wear", "Korean fashion", "Indian wear"],
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
    title: "Carnival of Clothes | Women's Fashion by Nandini",
    description: "Curated women's fashion for everyday elegance and every special moment.",
    ...(publicSiteUrl ? { images: [{ url: "/hero.jpg", width: 1200, height: 900, alt: "Carnival of Clothes by Nandini" }] } : {}),
  },
  twitter: {
    card: "summary_large_image",
    title: "Carnival of Clothes | Women's Fashion by Nandini",
    description: "Curated women's fashion for everyday elegance and every special moment.",
    ...(publicSiteUrl ? { images: ["/hero.jpg"] } : {}),
  },
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const brandSchema = publicSiteUrl ? {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebSite", "@id": `${publicSiteUrl}/#website`, url: publicSiteUrl, name: "Carnival of Clothes", alternateName: "Carnival of Clothes by Nandini" },
      { "@type": "OnlineStore", "@id": `${publicSiteUrl}/#organization`, url: publicSiteUrl, name: "Carnival of Clothes", alternateName: "Carnival of Clothes by Nandini", description: "Curated women's fashion, occasion wear and accessories.", logo: `${publicSiteUrl}/favicon.svg` },
    ],
  } : null;

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital,wght@0,400;1,400&family=Work+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
        {brandSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(brandSchema) }} />}
      </head>
      <body className="selection:bg-[#e8b9b2] selection:text-[#3a2926]">{children}</body>
    </html>
  );
}
