"use client";
import { useEffect, useState } from "react";
import Header from "../components/Header";
import { gsap } from "gsap";

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

export default function ShopPage() {
  const [active, setActive] = useState("All collections");

  const visible = active === "All collections" 
    ? products 
    : products.filter((p) => p.categories.includes(active));

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const cat = params.get("category");
      if (cat) {
        const decoded = decodeURIComponent(cat);
        const found = guide.find((g) => g[0].toLowerCase() === decoded.toLowerCase());
        if (found) {
          setActive(found[0]);
        } else if (decoded.toLowerCase() === "all") {
          setActive("All collections");
        } else if (decoded.toLowerCase() === "korean") {
          setActive("Trending");
        } else if (decoded.toLowerCase() === "indian") {
          setActive("Party Wear");
        }
      }
    }
  }, []);

  useEffect(() => {
    gsap.fromTo(".catalog-card",
      { opacity: 0, y: 25 },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        stagger: 0.06,
        ease: "power2.out",
        overwrite: "auto"
      }
    );
  }, [visible]);

  return (
    <main>
      <Header activeTab="shop" />

      <section className="guide" id="catalog">
        <div className="guide-title">
          <span className="eyebrow">EXPLORE THE EDIT</span>
          <h2>Shop by <i>category</i></h2>
          <p>Every piece is chosen to help you build a wardrobe that feels unmistakably yours.</p>
        </div>
        <div className="guide-grid">
          <button className={active === "All collections" ? "selected" : ""} onClick={() => setActive("All collections")}>
            <span>00</span>
            <div>
              <strong>All Collections</strong>
              <small>Explore everything we have curated for you.</small>
            </div>
            <b>→</b>
          </button>
          {guide.map(([title, text]) => (
            <button className={active === title ? "selected" : ""} onClick={() => setActive(title)} key={title}>
              <span>{String(guide.findIndex((g) => g[0] === title) + 1).padStart(2, "0")}</span>
              <div>
                <strong>{title}</strong>
                <small>{text}</small>
              </div>
              <b>→</b>
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
