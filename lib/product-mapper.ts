export type ProductSizeOption = {
  size: string;
  inStock: boolean;
  variantId?: string;
};

export type HomeProduct = {
  id?: string;
  name: string;
  type: string;
  categories: string[];
  price: string;
  img: string;
  badge: string;
  href: string;
  position: string;
  sizes: ProductSizeOption[];
  isAccessory: boolean;
};

export function mapDbProductToHomeProduct(product: Record<string, unknown>): HomeProduct {
  const tags = Array.isArray(product.tags) ? product.tags.map(String) : [];
  const searchable = `${product.name || ""} ${tags.join(" ")}`.toLowerCase();
  const savedCategory = tags.find((tag) => tag.startsWith("category:"))?.slice(9);
  const occasions = tags.filter((tag) => tag.startsWith("occasion:")).map((tag) => tag.slice(9));
  const isAccessory =
    savedCategory === "Accessories" ||
    searchable.includes("sunglass") ||
    searchable.includes("bag") ||
    searchable.includes("jewel") ||
    searchable.includes("belt");

  const categories = [
    savedCategory,
    ...occasions,
    !savedCategory && searchable.includes("dress") && "Dresses",
    !occasions.length && (searchable.includes("party") || searchable.includes("evening")) && "Party Wear",
    !savedCategory && (searchable.includes("trouser") || searchable.includes("jean") || searchable.includes("skirt")) && "Bottom Wear",
    isAccessory && "Accessories",
    (savedCategory === "Co-ord Sets" || searchable.includes("co-ord") || searchable.includes("set") || searchable.includes("suit")) && "Co-ord Sets",
    searchable.includes("korean") && "Korean",
    (searchable.includes("lehenga") || searchable.includes("saree") || searchable.includes("kurti") || searchable.includes("anarkali")) && "Indian",
    (searchable.includes("shirt") || searchable.includes("top") || searchable.includes("blazer")) && "Top Wear",
    (searchable.includes("casual") || searchable.includes("cotton") || searchable.includes("denim")) && "Everyday",
    (savedCategory === "Co-ord Sets" || searchable.includes("co-ord")) && "COMBO",
    (product.is_featured || product.is_best_seller) && "OFFERS",
  ].filter(Boolean) as string[];

  // Process variants for sizes
  let sizes: ProductSizeOption[] = [];
  const rawVariants = Array.isArray(product.product_variants) ? product.product_variants : [];
  if (rawVariants.length > 0) {
    const sizeOrder = ["XS", "S", "M", "L", "XL", "XXL", "2XL", "3XL", "4XL", "Free Size", "One Size"];
    sizes = rawVariants
      .filter((v: Record<string, unknown>) => v.is_active !== false)
      .map((v: Record<string, unknown>) => {
        let sizeLabel = String(v.size || v.title || "").trim();
        const match = sizeLabel.match(/Size\s+([A-Z0-9]+)/i);
        if (match) sizeLabel = match[1];
        const inStock = Number(v.inventory_quantity ?? 1) > 0;
        return {
          size: sizeLabel || (isAccessory ? "One Size" : "M"),
          inStock,
          variantId: v.id ? String(v.id) : undefined,
        };
      })
      .sort((a, b) => {
        const idxA = sizeOrder.indexOf(a.size);
        const idxB = sizeOrder.indexOf(b.size);
        return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
      });
  }

  if (!sizes.length) {
    if (isAccessory) {
      sizes = [{ size: "One Size", inStock: true }];
    } else {
      sizes = [
        { size: "XS", inStock: true },
        { size: "S", inStock: true },
        { size: "M", inStock: true },
        { size: "L", inStock: true },
        { size: "XL", inStock: true },
      ];
    }
  }

  return {
    id: product.id ? String(product.id) : undefined,
    name: String(product.name),
    type: String(
      product.short_description ||
        tags.slice(0, 2).join(" · ") ||
        "Carnival edit"
    ),
    categories: [...new Set(categories)],
    price: `₹${Number(product.price_inr).toLocaleString("en-IN")}`,
    img: String(product.hero_image_url || "/product.jpg"),
    badge: product.is_new_arrival
      ? "New"
      : product.is_best_seller
        ? "Best seller"
        : product.is_featured
          ? "Featured"
          : "",
    href: `/product/${String(product.slug)}`,
    position: "50%",
    sizes,
    isAccessory,
  } satisfies HomeProduct;
}
