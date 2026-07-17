"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Header from "../components/Header";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const guide = [
  ["Everyday Essentials", "Oversized T-shirts, Basic T-shirts, Crop Tops, Tank Tops, Bodysuits, Shirts."],
  ["Bottom Wear", "Straight, Wide-leg, Mom-fit, Baggy & Flared Jeans, Denim Shorts, Trousers, Cargo Pants, Palazzo Pants, Skirts."],
  ["Dresses", "Bodycon, A-line, Maxi, Midi, Shirt, Wrap, Slip, Party Dresses."],
  ["Co-ord Sets", "Shirt & Trouser, Crop Top & Skirt, Blazer, Lounge Sets."],
  ["Party Wear", "Sequin Tops, Satin Tops, Corset Tops, Cocktail Dresses, Jumpsuits, Playsuits."],
  ["Trending", "Oversized Graphic T-shirts, Baggy/Wide-leg Jeans, Co-ord Sets, Linen Shirts, Cargo Pants, Ribbed Tops, Satin Shirts, Corset Tops, Maxi Dresses, Denim Jackets, Korean style."],
  ["Accessories", "Handbags, Belts, Sunglasses, Caps, Fashion Jewellery, Hair Accessories, Scarves, Socks."],
];

const products = [
  { name: "Rose Pink Blazer Co-ord", categories: ["Co-ord Sets", "Trending"], price: "₹4,999", badge: "New", img: "/rose-pink-coord.png", href: "/product/rose-pink-co-ord-set" },
  { name: "Ivory Power Suit Co-ord", categories: ["Co-ord Sets", "Party Wear", "Trending"], price: "₹5,499", badge: "New", img: "/ivory-coord.png", href: "/product/ivory-double-breasted-co-ord-set" },
  { name: "Midnight One-Shoulder Maxi", categories: ["Dresses", "Party Wear"], price: "₹4,499", badge: "New", img: "/midnight-maxi-dress.png", href: "/product/black-one-shoulder-maxi-dress" },
  { name: "Classic Leather Shoulder Bag", categories: ["Everyday Essentials", "Accessories"], price: "₹2,999", badge: "Classic", img: "/classic-leather-bag.png", href: "/shop" },
  { name: "Oversized Denim Streetwear Set", categories: ["Everyday Essentials", "Trending"], price: "₹5,899", badge: "Trending", img: "/streetwear-denim-set.jpg", href: "/shop" },
  { name: "Minimalist Cotton Dress", categories: ["Dresses", "Everyday Essentials"], price: "₹3,999", badge: "Clean", img: "/minimalist-cotton-dress.jpg", href: "/shop" },
  { name: "Wide-leg Linen Trousers", categories: ["Bottom Wear", "Everyday Essentials"], price: "₹3,499", badge: "Cozy", img: "/wide-leg-trousers.png", href: "/shop" },
  { name: "Cocktail Party Dress", categories: ["Party Wear", "Dresses"], price: "₹6,299", badge: "Party", img: "/cocktail-dress.png", href: "/shop" },
  { name: "Black Oval sunglass", categories: ["Accessories", "Everyday Essentials", "Trending"], price: "₹899", badge: "Retro", img: "/black-oval-sunglasses.png", href: "/shop" },
];

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
  const [sortBy, setSortBy] = useState<(typeof sortOptions)[number][0]>("featured");

  const visible = useMemo(() => {
    const filtered = active === "All collections"
      ? [...products]
      : products.filter((product) => product.categories.includes(active));
    const price = (value: string) => Number(value.replace(/[^0-9]/g, ""));
    if (sortBy === "newest") return filtered.sort((a, b) => Number(b.badge === "New") - Number(a.badge === "New"));
    if (sortBy === "price-asc") return filtered.sort((a, b) => price(a.price) - price(b.price));
    if (sortBy === "price-desc") return filtered.sort((a, b) => price(b.price) - price(a.price));
    if (sortBy === "name") return filtered.sort((a, b) => a.name.localeCompare(b.name));
    return filtered;
  }, [active, sortBy]);

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
      if (cat) {
        const decoded = decodeURIComponent(cat);
        const found = guide.find((g) => g[0].toLowerCase() === decoded.toLowerCase());
        if (found) {
          initialCategory = found[0];
        } else if (decoded.toLowerCase() === "all") {
          initialCategory = "All collections";
        } else if (decoded.toLowerCase() === "korean") {
          initialCategory = "Trending";
        } else if (decoded.toLowerCase() === "indian") {
          initialCategory = "Party Wear";
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
        gsap.timeline({
          scrollTrigger: {
            trigger: card,
            start: "top 90%",
            end: "bottom 12%",
            toggleActions: "restart none restart reverse",
          },
        })
          .fromTo(card, { y: 58, scale: 0.955, rotation: index % 2 ? 1.4 : -1.4 }, { y: 0, scale: 1, rotation: 0, duration: 0.78, ease: "power3.out", overwrite: "auto" })
          .fromTo(image, { clipPath: "inset(0 0 100% 0 round 10px)" }, { clipPath: "inset(0 0 0% 0 round 0px)", duration: 0.9, ease: "power4.inOut" }, 0)
          .fromTo(imageElement, { scale: 1.14 }, { scale: 1, duration: 1.05, ease: "power3.out" }, 0)
          .fromTo(details, { y: 18, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.45, stagger: 0.065, ease: "power2.out" }, 0.36);
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
          <h2>Shop by <i>category</i></h2>
          <p>Every piece is chosen to help you build a wardrobe that feels unmistakably yours.</p>
          <div className="mobile-shop-controls">
            <button
              className="mobile-filter-toggle"
              type="button"
              aria-expanded={filterOpen}
              aria-controls="mobile-category-filters"
              onClick={() => { setFilterOpen((open) => !open); setSortOpen(false); }}
            >
              <span>Filter</span>
              <b>{filterOpen ? "−" : "+"}</b>
            </button>
            <button
              className="mobile-sort-toggle"
              type="button"
              aria-expanded={sortOpen}
              aria-controls="mobile-sort-options"
              onClick={() => { setSortOpen((open) => !open); setFilterOpen(false); }}
            >
              <span>Sort</span>
              <b>{sortOpen ? "−" : "+"}</b>
            </button>
          </div>
        </div>
        <div className={`guide-grid ${filterOpen ? "is-open" : ""}`} id="mobile-category-filters">
          <button className={active === "All collections" ? "selected" : ""} onClick={() => selectCategory("All collections")}>
            <span>00</span>
            <div>
              <strong>All Collections</strong>
              <small>Explore everything we have curated for you.</small>
            </div>
            <b>→</b>
          </button>
          {guide.map(([title, text]) => (
            <button className={active === title ? "selected" : ""} onClick={() => selectCategory(title)} key={title}>
              <span>{String(guide.findIndex((g) => g[0] === title) + 1).padStart(2, "0")}</span>
              <div>
                <strong>{title}</strong>
                <small>{text}</small>
              </div>
              <b>→</b>
            </button>
          ))}
        </div>
        <div className={`mobile-sort-panel ${sortOpen ? "is-open" : ""}`} id="mobile-sort-options">
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
                <img src={p.img} alt={p.name} style={{objectPosition: `${15 + i * 11}% center`}}/>
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
