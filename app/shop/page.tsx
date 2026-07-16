"use client";

import { useState } from "react";

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
  ["Rose Noor Anarkali Set", "Festive Wear", "₹6,499", "Bestseller"],
  ["Soft Focus Satin Shirt", "Everyday Essentials", "₹2,499", "New"],
  ["The Wide Leg Edit", "Bottom Wear", "₹3,299", ""],
  ["Afterglow Maxi Dress", "Dresses", "₹4,899", "New"],
  ["Sunday Ease Co-ord", "Co-ord Sets", "₹3,799", ""],
  ["Midnight Sequin Top", "Party Wear", "₹2,899", "Trending"],
  ["City Girl Cargo", "Trending", "₹2,999", ""],
  ["Mini Moon Shoulder Bag", "Accessories", "₹1,899", ""],
];

export default function ShopPage() {
  const [active, setActive] = useState("All collections");
  const visible = active === "All collections" ? products : products.filter((p) => p[1] === active);
  return <main><div className="shipping">✦ &nbsp; FREE SHIPPING ON ORDERS ABOVE ₹2999 &nbsp; ✦</div><header className="nav"><a className="logo" href="/">Carnival of Clothes <small>by nandini ♡</small></a><nav className="links"><a href="/">Home</a><a className="active-link" href="/shop">Shop all</a><a href="/#story">Our Story</a></nav><div className="actions"><a className="icon-button" href="/">⌕</a><a className="icon-button" href="/">♡</a><a className="bag" href="/">♧<b>0</b></a></div></header>
    <section className="shop-hero"><span className="eyebrow">THE WESTERN WEAR COLLECTION</span><h1>Find your <i>everyday</i> favourite.</h1><p>Curated pieces for the way you live, celebrate, and express your style.</p></section>
    <section className="guide"><div className="guide-title"><span className="eyebrow">EXPLORE THE EDIT</span><h2>Shop by <i>category</i></h2><p>Every piece is chosen to help you build a wardrobe that feels unmistakably yours.</p></div><div className="guide-grid">{guide.map(([title, text]) => <button className={active === title ? "selected" : ""} onClick={() => setActive(title)} key={title}><span>{String(guide.findIndex((g) => g[0] === title) + 1).padStart(2, "0")}</span><div><strong>{title}</strong><small>{text}</small></div><b>→</b></button>)}</div></section>
    <section className="catalog"><div className="catalog-head"><div><span className="eyebrow">{active.toUpperCase()}</span><h2>{active === "All collections" ? "All collections" : active}</h2></div><span className="count">{visible.length} pieces</span></div><div className="catalog-grid">{visible.map(([name, type, price, badge], i) => <a href="/product/rose-noor-anarkali-set" className="catalog-card" key={name}><div className="catalog-image">{badge && <em>{badge}</em>}<img src="/product.jpg" alt={name} style={{objectPosition: `${15 + i * 11}% center`}}/><button onClick={(e) => e.preventDefault()}>♡</button></div><h3>{name}</h3><p>{type}</p><strong>{price}</strong></a>)}</div></section>
  </main>;
}
