export const PRODUCT_TAXONOMY = {
  "Top Wear": ["Shirts", "T-shirts", "Crop Tops", "Tank Tops", "Bodysuits"],
  "Bottom Wear": ["Jeans", "Trousers", "Cargo Pants", "Palazzo Pants", "Skirts", "Shorts"],
  Indian: ["Kurtis", "Kurta Sets", "Sarees", "Lehenga Sets", "Anarkali Suits", "Dupattas"],
  Korean: ["Korean Tops", "Korean Dresses", "Korean Co-ords", "Oversized Shirts", "Pleated Skirts"],
  Dresses: [],
  "Co-ord Sets": [],
  Accessories: ["Handbags", "Jewellery", "Sunglasses", "Belts", "Hair Accessories", "Scarves"],
} as const;

export const PRODUCT_CATEGORIES = Object.keys(PRODUCT_TAXONOMY);
export const OCCASIONS = ["Everyday", "Party Wear"] as const;
export const taxonomyTag = (kind: "category" | "subcategory" | "occasion", value: string) => `${kind}:${value}`;
export const tagValue = (tags: string[] | null | undefined, kind: string) =>
  (tags || []).find((tag) => tag.startsWith(`${kind}:`))?.slice(kind.length + 1) || "";
export const publicTags = (tags: string[] | null | undefined) =>
  (tags || []).filter((tag) => !/^(category|subcategory|occasion):/.test(tag));
