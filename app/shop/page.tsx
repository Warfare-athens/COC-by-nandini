"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Header from "../components/Header";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

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
  name: string;
  categories: string[];
  price: string;
  badge: string;
  img: string;
  href: string;
};

const sortOptions = [
  ["featured", "Featured"],
  ["newest", "Newest"],
  ["price-asc", "Price: Low to High"],
  ["price-desc", "Price: High to Low"],
  ["name", "Name: A–Z"],
] as const;

export default function ShopPage() {
  const pageRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState("All collections");
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [sortBy, setSortBy] =
    useState<(typeof sortOptions)[number][0]>("featured");
  const [products, setProducts] = useState<ShopProduct[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/storefront/products", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload) => {
        if (cancelled || !Array.isArray(payload.products)) return;
        const live = payload.products.map(
          (product: Record<string, unknown>) => {
            const tags = Array.isArray(product.tags)
              ? product.tags.map(String)
              : [];
            const category = tags.find((tag) => tag.startsWith("category:"))?.slice(9);
            const subcategory = tags.find((tag) => tag.startsWith("subcategory:"))?.slice(12);
            const occasions = tags.filter((tag) => tag.startsWith("occasion:")).map((tag) => tag.slice(9));
            const categories = [category, subcategory, ...occasions, "Trending"].filter(Boolean) as string[];
            return {
              name: String(product.name),
              categories: [...new Set(categories)],
              price: `₹${Number(product.price_inr).toLocaleString("en-IN")}`,
              badge: product.is_new_arrival
                ? "New"
                : product.is_best_seller
                  ? "Best seller"
                  : product.is_featured
                    ? "Featured"
                    : "",
              img: String(product.hero_image_url || "/product.jpg"),
              href: `/product/${String(product.slug)}`,
            };
          },
        );
        setProducts(live);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const visible = useMemo(() => {
    const filtered =
      active === "All collections"
        ? [...products]
        : products.filter((product) => product.categories.includes(active));
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
  }, [active, sortBy, products]);

  const selectCategory = (category: string) => {
    setActive(category);
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
        const details = card.querySelectorAll("h3, p, strong");
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
          <p>
            Every piece is chosen to help you build a wardrobe that feels
            unmistakably yours.
          </p>
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
          {guide.map(([title, text]) => (
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
                <small>{text}</small>
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
            <h2>{active === "All collections" ? "All collections" : active}</h2>
          </div>
          <span className="count">{visible.length} pieces</span>
        </div>
        <div className="catalog-grid">
          {visible.map((p, i) => (
            <a href={p.href} className="catalog-card" key={p.name}>
              <div className="catalog-image">
                {p.badge && <em>{p.badge}</em>}
                <img
                  src={p.img}
                  alt={p.name}
                  style={{ objectPosition: `${15 + i * 11}% center` }}
                />
                <button onClick={(e) => e.preventDefault()}>♡</button>
              </div>
              <h3>{p.name}</h3>
              <p>{p.categories[0]}</p>
              <strong>{p.price}</strong>
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
