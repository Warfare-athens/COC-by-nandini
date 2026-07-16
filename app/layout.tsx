import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Carnival of Clothes by Nandini",
  description: "Timeless elegance, curated for you.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
