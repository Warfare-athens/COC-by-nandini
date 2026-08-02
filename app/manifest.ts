import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Carnival of Clothes by Nandini",
    short_name: "Carnival of Clothes",
    description: "Ahmedabad-based curated women's fashion for every occasion.",
    start_url: "/",
    display: "standalone",
    background_color: "#fbf4ee",
    theme_color: "#bb7068",
    icons: [
      { src: "/favicon-logo.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/favicon-logo.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
