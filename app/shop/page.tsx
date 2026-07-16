"use client";

import { useState } from "react";
import CartSheet from "../components/CartSheet";

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
  ["Rose Pink Blazer Co-ord", "Co-ord Sets", "₹4,999", "New"],
  ["Ivory Power Suit Co-ord", "Co-ord Sets", "₹5,499", "New"],
  ["Midnight One-Shoulder Maxi", "Dresses", "₹4,499", "New"],
  ["Sandstone Vest Co-ord", "Co-ord Sets", "₹4,799", "New"],
];

export default function ShopPage() {
  const [active, setActive] = useState("All collections"); const [cartOpen, setCartOpen] = useState(false);
  const visible = active === "All collections" ? products : products.filter((p) => p[1] === active);
  return <main><div className="shipping">✦ &nbsp; FREE SHIPPING ON ORDERS ABOVE ₹2999 &nbsp; ✦</div><header className="nav"><a className="logo" href="/">Carnival of Clothes <small>by nandini ♡</small></a><nav className="links"><a href="/">Home</a><a className="active-link" href="/shop">Shop all</a><a href="/#story">Our Story</a></nav><div className="actions"><a className="icon-button" href="/">⌕</a><button className="bag" onClick={() => setCartOpen(true)}><span className="modern-bag"><i/></span><b>0</b></button></div></header>
    <section className="shop-hero"><span className="eyebrow">THE WESTERN WEAR COLLECTION</span><h1>Find your <i>everyday</i> favourite.</h1><p>Curated pieces for the way you live, celebrate, and express your style.</p></section>
    <a className="korean-feature" href="#catalog"><div><span className="eyebrow">TRENDING NOW</span><h2>Korean <i>Street Wear</i></h2><p>Clean fits. Effortless style. Everyday you.</p><span className="text-link">Shop now&nbsp; →</span></div><img src="/korean-streetwear.jpg" alt="Korean street wear collection"/></a>
    <a className="korean-feature bottom-feature" href="#catalog"><div><span className="eyebrow">THE EVERYDAY EDIT</span><h2>Bottom <i>Wear</i></h2><p>From classic to contemporary. Find your perfect fit.</p><span className="text-link">Shop now&nbsp; →</span></div><img src="/bottom-wear.jpg" alt="Bottom wear collection"/></a>
    <section className="guide"><div className="guide-title"><span className="eyebrow">EXPLORE THE EDIT</span><h2>Shop by <i>category</i></h2><p>Every piece is chosen to help you build a wardrobe that feels unmistakably yours.</p></div><div className="guide-grid">{guide.map(([title, text]) => <button className={active === title ? "selected" : ""} onClick={() => setActive(title)} key={title}><span>{String(guide.findIndex((g) => g[0] === title) + 1).padStart(2, "0")}</span><div><strong>{title}</strong><small>{text}</small></div><b>→</b></button>)}</div></section>
  <section className="catalog"><div className="catalog-head"><div><span className="eyebrow">{active.toUpperCase()}</span><h2>{active === "All collections" ? "All collections" : active}</h2></div><span className="count">{visible.length} pieces</span></div><div className="catalog-grid">{visible.map(([name, type, price, badge], i) => <a href={name === "Sunday Ease Co-ord" ? "/product/rose-pink-co-ord-set" : "/product/rose-noor-anarkali-set"} className="catalog-card" key={name}><div className="catalog-image">{badge && <em>{badge}</em>}<img src={name === "Sunday Ease Co-ord" ? "/coord-set.jpg" : "/product.jpg"} alt={name} style={{objectPosition: `${15 + i * 11}% center`}}/><button onClick={(e) => e.preventDefault()}>♡</button></div><h3>{name}</h3><p>{type}</p><strong>{price}</strong></a>)}</div></section>
  <CartSheet open={cartOpen} onClose={() => setCartOpen(false)} /></main>;
}
