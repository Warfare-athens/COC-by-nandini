"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Header from "../components/Header";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { addToCart } from "@/app/cart-helper";
import { showGlobalStatus } from "@/app/global-status";
import { mapDbProductToHomeProduct, ProductSizeOption, ProductColorOption } from "@/lib/product-mapper";
import SizePickerPopover from "../components/SizePickerPopover";

const guide = [
  ["Top Wear", "Shirts, T-shirts, Crop Tops, Tank Tops and Bodysuits."],
  [
    "Bottom Wear",
    "Straight, Wide-leg, Mom-fit, Baggy & Flared Jeans, Denim Shorts, Trousers, Cargo Pants, Palazzo Pants, Skirts.",
  ],
  ["Indian", "Kurtis, Kurta Sets, Sarees, Lehenga Sets, Anarkali Suits and Dupattas."],
  ["Korean", "Korean Tops, Korean Dresses, Korean Co-ords, Oversized Shirts and Pleated Skirts."],
  ["Dresses", "Dresses."],
  ["Co-ord Sets", "Shirt & Trouser, Crop Top & Skirt, Blazer, Lounge Sets."],
  [
    "Trending",
    "Oversized Graphic T-shirts, Baggy/Wide-leg Jeans, Co-ord Sets, Linen Shirts, Cargo Pants, Ribbed Tops, Satin Shirts, Corset Tops, Maxi Dresses, Denim Jackets, Korean style.",
  ],
  [
    "Accessories",
    "Handbags, Belts, Sunglasses, Caps, Fashion Jewellery, Hair Accessories, Scarves, Socks.",
  ],
];

type ShopProduct = {
  id?: string;
  name: string;
  categories: string[];
  price: string;
  badge: string;
  img: string;
  href: string;
  sizes: ProductSizeOption[];
  colors?: ProductColorOption[];
  isAccessory: boolean;
};

const sortOptions = [
  ["featured", "Featured"],
  ["newest", "Newest"],
  ["price-asc", "Price: Low to High"],
  ["price-desc", "Price: High to Low"],
  ["name", "Name: A–Z"],
] as const;

function mapRawToShopProduct(product: Record<string, unknown>): ShopProduct {
  const mapped = mapDbProductToHomeProduct(product);
  const subcategory = Array.isArray(product.tags)
    ? product.tags.find((tag) => String(tag).startsWith("subcategory:"))?.slice(12)
    : undefined;
  return {
    id: mapped.id,
    name: mapped.name,
    categories: [...new Set([...mapped.categories, subcategory, "Trending"].filter(Boolean))] as string[],
    price: mapped.price,
    badge: mapped.badge,
    img: mapped.img,
    href: mapped.href,
    sizes: mapped.sizes,
    colors: mapped.colors,
    isAccessory: mapped.isAccessory,
  };
}

export default function ShopClient({
  initialRawProducts = [],
}: {
  initialRawProducts?: Record<string, unknown>[];
}) {
  const pageRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState("All collections");
  const [activeSubcategory, setActiveSubcategory] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [sortBy, setSortBy] =
    useState<(typeof sortOptions)[number][0]>("featured");
  const [products, setProducts] = useState<ShopProduct[]>(() =>
    initialRawProducts.map(mapRawToShopProduct),
  );

  useEffect(() => {
    let cancelled = false;
    fetch("/api/storefront/products", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload) => {
        if (cancelled || !Array.isArray(payload.products)) return;
        setProducts(payload.products.map(mapRawToShopProduct));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const addToBag = (product: ShopProduct) => {
    addToCart({
      productId: product.id,
      name: product.name,
      price: product.price,
      img: product.img,
      size: "M",
    });
  };

  const toggleSaved = (product: ShopProduct) => {
    const key = "coc-saved-products";
    const saved = JSON.parse(localStorage.getItem(key) || "[]") as string[];
    const exists = saved.includes(product.href);
    localStorage.setItem(
      key,
      JSON.stringify(
        exists ? saved.filter((href) => href !== product.href) : [...saved, product.href],
      ),
    );
    showGlobalStatus(
      exists
        ? `${product.name} removed from saved items`
        : `${product.name} saved for later`,
      exists ? "info" : "success",
    );
  };

  const visible = useMemo(() => {
    const filtered =
      active === "All collections"
        ? [...products]
        : products.filter((product) => {
            const matchesCategory = product.categories.some(
              (category) => category.trim().toLowerCase() === active.trim().toLowerCase(),
            );
            const matchesSubcategory = !activeSubcategory || product.categories.some(
              (category) => category.trim().toLowerCase() === activeSubcategory.trim().toLowerCase(),
            );
            return matchesCategory && matchesSubcategory;
          });
    const price = (value: string) => Number(value.replace(/[^0-9]/g, ""));
    if (sortBy === "newest")
      return filtered.sort(
        (a, b) => Number(b.badge === "New") - Number(a.badge === "New"),
      );
    if (sortBy === "price-asc")
      return filtered.sort((a, b) => price(a.price) - price(b.price));
    if (sortBy === "price-desc")
      return filtered.sort((a, b) => price(b.price) - price(a.price));
    if (sortBy === "name")
      return filtered.sort((a, b) => a.name.localeCompare(b.name));
    return filtered;
  }, [active, activeSubcategory, sortBy, products]);

  const selectCategory = (category: string) => {
    setActive(category);
    setActiveSubcategory("");
    setFilterOpen(false);
  };

  const selectSort = (sort: (typeof sortOptions)[number][0]) => {
    setSortBy(sort);
    setSortOpen(false);
  };

  useEffect(() => {
    let initialCategory = "";
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const cat = params.get("category");
      const occasion = params.get("occasion");
      const sub = params.get("subcategory");
      if (occasion) initialCategory = decodeURIComponent(occasion);
      if (cat) {
        const decoded = decodeURIComponent(cat);
        const found = guide.find(
          (g) => g[0].toLowerCase() === decoded.toLowerCase(),
        );
        if (found) {
          initialCategory = found[0];
        } else if (decoded.toLowerCase() === "all") {
          initialCategory = "All collections";
        } else if (decoded) {
          initialCategory = decoded;
        }
      }
      if (sub) setActiveSubcategory(decodeURIComponent(sub));
    }
    if (!initialCategory) return;
    const initialLoad = window.setTimeout(() => setActive(initialCategory), 0);
    return () => window.clearTimeout(initialLoad);
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.registerPlugin(ScrollTrigger);
    const context = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>(".catalog-card");
      cards.forEach((card, index) => {
        const image = card.querySelector<HTMLElement>(".catalog-image");
        const imageElement = image?.querySelector("img");
        const details = card.querySelectorAll("h3, p, strong, .add-button");
        if (!image || !imageElement) return;
        gsap
          .timeline({
            scrollTrigger: {
              trigger: card,
              start: "top 90%",
              end: "bottom 12%",
              toggleActions: "restart none restart reverse",
            },
          })
          .fromTo(
            card,
            { y: 58, scale: 0.955, rotation: index % 2 ? 1.4 : -1.4 },
            {
              y: 0,
              scale: 1,
              rotation: 0,
              duration: 0.78,
              ease: "power3.out",
              overwrite: "auto",
            },
          )
          .fromTo(
            image,
            { clipPath: "inset(0 0 100% 0 round 10px)" },
            {
              clipPath: "inset(0 0 0% 0 round 0px)",
              duration: 0.9,
              ease: "power4.inOut",
            },
            0,
          )
          .fromTo(
            imageElement,
            { scale: 1.14 },
            { scale: 1, duration: 1.05, ease: "power3.out" },
            0,
          )
          .fromTo(
            details,
            { y: 18, autoAlpha: 0 },
            {
              y: 0,
              autoAlpha: 1,
              duration: 0.45,
              stagger: 0.065,
              ease: "power2.out",
            },
            0.36,
          );
      });
      requestAnimationFrame(() => ScrollTrigger.refresh());
    }, pageRef);
    return () => context.revert();
  }, [visible]);

  return (
    <main ref={pageRef}>
      <Header activeTab="shop" />

      <section className="guide" id="catalog">
        <div className="guide-title">
          <span className="eyebrow">EXPLORE THE EDIT</span>
          <h2>
            Shop by <i>category</i>
          </h2>
          <div className="mobile-shop-controls">
            <button
              className="mobile-filter-toggle"
              type="button"
              aria-expanded={filterOpen}
              aria-controls="mobile-category-filters"
              onClick={() => {
                setFilterOpen((open) => !open);
                setSortOpen(false);
              }}
            >
              <span>Filter</span>
              <b>{filterOpen ? "−" : "+"}</b>
            </button>
            <button
              className="mobile-sort-toggle"
              type="button"
              aria-expanded={sortOpen}
              aria-controls="mobile-sort-options"
              onClick={() => {
                setSortOpen((open) => !open);
                setFilterOpen(false);
              }}
            >
              <span>Sort</span>
              <b>{sortOpen ? "−" : "+"}</b>
            </button>
          </div>
        </div>
        <div
          className={`guide-grid ${filterOpen ? "is-open" : ""}`}
          id="mobile-category-filters"
        >
          <button
            className={active === "All collections" ? "selected" : ""}
            onClick={() => selectCategory("All collections")}
          >
            <span>00</span>
            <div>
              <strong>All Collections</strong>
              <small>Explore everything we have curated for you.</small>
            </div>
            <b>→</b>
          </button>
          {guide.map(([title]) => (
            <button
              className={active === title ? "selected" : ""}
              onClick={() => selectCategory(title)}
              key={title}
            >
              <span>
                {String(guide.findIndex((g) => g[0] === title) + 1).padStart(
                  2,
                  "0",
                )}
              </span>
              <div>
                <strong>{title}</strong>
              </div>
              <b>→</b>
            </button>
          ))}
        </div>
        <div
          className={`mobile-sort-panel ${sortOpen ? "is-open" : ""}`}
          id="mobile-sort-options"
        >
          {sortOptions.map(([value, label]) => (
            <button
              type="button"
              className={sortBy === value ? "selected" : ""}
              onClick={() => selectSort(value)}
              key={value}
            >
              <span>{label}</span>
              <b>{sortBy === value ? "✓" : ""}</b>
            </button>
          ))}
        </div>
      </section>

      <section className="catalog">
        <div className="catalog-head">
          <div>
            <span className="eyebrow">{active.toUpperCase()}</span>
            <h2>{activeSubcategory || (active === "All collections" ? "All collections" : active)}</h2>
          </div>
          <span className="count">{visible.length} pieces</span>
        </div>
        <div className="catalog-grid">
          {visible.map((p, i) => (
            <CatalogProductCard
              key={p.id || p.name}
              product={p}
              index={i}
              onToggleSaved={toggleSaved}
            />
          ))}
        </div>
      </section>
    </main>
  );
}

function CatalogProductCard({
  product,
  index,
  onToggleSaved,
}: {
  product: ShopProduct;
  index: number;
  onToggleSaved: (p: ShopProduct) => void;
}) {
  const [activeImg, setActiveImg] = useState(product.img);
  const [activeColor, setActiveColor] = useState<string | null>(null);

  useEffect(() => {
    setActiveImg(product.img);
  }, [product.img]);

  return (
    <article className="catalog-card">
      <a href={product.href}>
        <div className="catalog-image">
          {product.badge && <em>{product.badge}</em>}
          <img
            src={activeImg}
            alt={product.name}
            style={{ objectPosition: `${15 + (index % 6) * 11}% center` }}
          />
          <button
            type="button"
            aria-label="Add to wishlist"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleSaved(product);
            }}
          >
            ♡
          </button>
        </div>
        {product.colors && product.colors.length > 0 && (
          <div
            className="card-color-swatches"
            onClick={(e) => e.preventDefault()}
          >
            {product.colors.slice(0, 5).map((c) => (
              <span
                key={c.name}
                className={`card-color-dot ${activeColor === c.name ? "active" : ""}`}
                style={{
                  background: c.swatch.bg,
                  border: c.swatch.border ? `1px solid ${c.swatch.border}` : "1px solid rgba(0,0,0,0.15)",
                }}
                title={c.name}
                onMouseEnter={() => {
                  if (c.imageUrl) {
                    setActiveImg(c.imageUrl);
                    setActiveColor(c.name);
                  }
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (c.imageUrl) {
                    setActiveImg(c.imageUrl);
                    setActiveColor(c.name);
                  }
                }}
              />
            ))}
            {product.colors.length > 5 && (
              <small className="card-color-more">+{product.colors.length - 5}</small>
            )}
          </div>
        )}
        <h3>{product.name}</h3>
        <strong>{product.price}</strong>
      </a>
      <SizePickerPopover product={product} />
    </article>
  );
}
