export type CollectionDefinition = {
  slug: string;
  name: string;
  tag: string;
  kind: "category" | "occasion";
  eyebrow: string;
  title: string;
  description: string;
  intro: string;
  image: string;
  keywords: string[];
};

export const COLLECTIONS: CollectionDefinition[] = [
  { slug: "dresses", name: "Dresses", tag: "Dresses", kind: "category", eyebrow: "THE DRESS EDIT", title: "Women’s dresses in Ahmedabad", description: "Shop curated women’s dresses in Ahmedabad from Carnival of Clothes, including everyday, party and occasion-ready styles.", intro: "Discover flattering dresses selected for celebrations, evenings out and effortless everyday dressing.", image: "/party-wear-red-dress.png", keywords: ["women's dresses Ahmedabad", "dress shop Ahmedabad", "party dresses Ahmedabad"] },
  { slug: "co-ord-sets", name: "Co-ord Sets", tag: "Co-ord Sets", kind: "category", eyebrow: "MATCHED WITH EASE", title: "Co-ord sets in Ahmedabad", description: "Shop coordinated women’s sets in Ahmedabad, from relaxed everyday pairings to polished party-ready co-ords.", intro: "Easy matching, thoughtful proportions and versatile separates make every set work harder in your wardrobe.", image: "/combos-co-ords.png", keywords: ["co-ord sets Ahmedabad", "women's co-ords Ahmedabad", "matching sets for women"] },
  { slug: "korean-clothing", name: "Korean Clothing", tag: "Korean", kind: "category", eyebrow: "THE SEOUL EDIT", title: "Korean clothing in Ahmedabad", description: "Explore Korean-inspired women’s clothing in Ahmedabad, including tops, dresses, co-ords, oversized shirts and pleated skirts.", intro: "Clean lines, relaxed silhouettes and playful details bring Korean-inspired style to everyday wardrobes in India.", image: "/korean-suit-style.png", keywords: ["Korean clothing Ahmedabad", "Korean fashion Ahmedabad", "Korean dresses India"] },
  { slug: "party-wear", name: "Party Wear", tag: "Party Wear", kind: "occasion", eyebrow: "AFTER-DARK STYLE", title: "Party wear dresses in Ahmedabad", description: "Shop party wear dresses and occasion outfits in Ahmedabad from Carnival of Clothes by Nandini.", intro: "Make an entrance in handpicked party styles for birthdays, dinners, celebrations and special evenings.", image: "/cocktail-dress.png", keywords: ["party wear dresses Ahmedabad", "party outfits Ahmedabad", "occasion wear women Ahmedabad"] },
  { slug: "indian-wear", name: "Indian Wear", tag: "Indian", kind: "category", eyebrow: "MODERN TRADITION", title: "Women’s Indian wear in Ahmedabad", description: "Explore kurtis, kurta sets, sarees, lehenga sets and anarkali suits from Carnival of Clothes in Ahmedabad.", intro: "Traditional silhouettes meet a modern, wearable point of view for festive days and meaningful occasions.", image: "/indian-suits.png", keywords: ["women's Indian wear Ahmedabad", "kurti shop Ahmedabad", "lehenga sets Ahmedabad"] },
  { slug: "top-wear", name: "Top Wear", tag: "Top Wear", kind: "category", eyebrow: "EVERYDAY FOUNDATIONS", title: "Women’s tops in Ahmedabad", description: "Shop women’s shirts, T-shirts, crop tops, tank tops and bodysuits in Ahmedabad.", intro: "Build more outfits with polished shirts, easy tees and modern tops chosen for repeat wear.", image: "/top-wear-pink-floral.png", keywords: ["women's tops Ahmedabad", "crop tops Ahmedabad", "shirts for women Ahmedabad"] },
  { slug: "bottom-wear", name: "Bottom Wear", tag: "Bottom Wear", kind: "category", eyebrow: "THE PERFECT PAIR", title: "Women’s bottom wear in Ahmedabad", description: "Shop jeans, trousers, cargo pants, palazzos, skirts and shorts for women in Ahmedabad.", intro: "Find flattering foundations for work, weekends, travel and everything in between.", image: "/wide-leg-trousers.png", keywords: ["women's bottom wear Ahmedabad", "women's jeans Ahmedabad", "trousers for women Ahmedabad"] },
  { slug: "accessories", name: "Accessories", tag: "Accessories", kind: "category", eyebrow: "FINISHING TOUCHES", title: "Women’s fashion accessories in Ahmedabad", description: "Shop handbags, jewellery, sunglasses, belts, hair accessories and scarves in Ahmedabad.", intro: "Complete your look with expressive finishing touches selected to mix easily across your wardrobe.", image: "/accessories-gold-jewelry.jpg", keywords: ["women's accessories Ahmedabad", "fashion jewellery Ahmedabad", "handbags Ahmedabad"] },
];

export const collectionBySlug = (slug: string) => COLLECTIONS.find((item) => item.slug === slug);

export const collectionForBlogCategory = (category: string) => {
  const slugByCategory: Record<string, string> = {
    Dresses: "dresses",
    "Co-ord Sets": "co-ord-sets",
    "Indian Wear": "indian-wear",
    "Korean Style": "korean-clothing",
    "Party Wear": "party-wear",
    "Top Wear": "top-wear",
    "Bottom Wear": "bottom-wear",
    Accessories: "accessories",
  };
  return collectionBySlug(slugByCategory[category] || "dresses");
};
