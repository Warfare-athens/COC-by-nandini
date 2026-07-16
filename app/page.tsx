"use client";

import { useMemo, useState } from "react";
import CartSheet from "./components/CartSheet";

const categories = [
];

const products = [
  { name: "Rose Pink Blazer Co-ord", type: "Blush tailored · New arrival", price: "₹4,999", img: "/coord-set.jpg", badge: "New", href: "/product/rose-pink-co-ord-set" },
  { name: "Ivory Power Suit Co-ord", type: "Double-breasted · New arrival", price: "₹5,499", img: "/coord-ivory.jpg", badge: "New", href: "/product/ivory-double-breasted-co-ord-set" },
];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false); const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState(0);
  const [search, setSearch] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const [toast, setToast] = useState("");
  const shownProducts = useMemo(() => activeCategory === "All" ? products : products.filter((_, i) => i % 2 === 0), [activeCategory]);
  const addToBag = (name: string) => { setCart((c) => c + 1); setToast(`${name} added to your bag`); setTimeout(() => setToast(""), 2200); };

  return (
    <main>
      <div className="shipping">✦ &nbsp; FREE SHIPPING ON ORDERS ABOVE ₹2999 &nbsp; ✦</div>
      <header className="nav">
        <button className="icon-button menu-trigger" aria-label="Open menu" onClick={() => setMenuOpen(true)}><span className="modern-menu"><i/><i/><i/></span></button>
        <a className="logo" href="#top">Carnival of Clothes <small>by nandini ♡</small></a>
        <nav className="links"><a href="#collections">Collections</a><a href="#shop">Shop</a><a href="#story">Our Story</a><a href="#contact">Contact</a></nav>
        <div className="actions"><button className="icon-button" aria-label="Search" onClick={() => setSearch(!search)}>⌕</button><button className="bag" aria-label="Cart" onClick={() => setCartOpen(true)}><span className="modern-bag"><i/></span><b>{cart}</b></button></div>
      </header>
      {search && <div className="searchbar"><input autoFocus placeholder="Search your next favourite..." /><span>Press enter to search</span></div>}

      <section className="hero" id="top">
        <div className="hero-copy"><span className="eyebrow">THE NEW SEASON EDIT</span><h1>Timeless <i>Elegance,</i><br/>Crafted<br/>for You.</h1><p>Discover curated collections that celebrate your style and every special moment.</p><a href="#shop" className="primary">Explore Collection <span>→</span></a><div className="dots"><b/>○ ○</div></div>
        <div className="hero-image"><img src="/store.jpg" alt="Carnival of Clothes boutique interior"/><div className="hero-stamp">CARNIVAL<br/>OF CLOTHES</div></div>
      </section>

      <section className="collections" id="collections"><div className="section-index">01</div><div><span className="eyebrow">OUR COLLECTION</span><h2>Curated Styles <i>For Every You</i></h2><div className="collection-grid">{["Festive Wear","Ethnic Wear","Contemporary"].map((x, i) => <a className="collection-card" href="#shop" key={x}><img src="/product.jpg" alt={x} style={{objectPosition: `${20 + i * 30}% center`}}/><strong>{x}</strong><span>Explore&nbsp; →</span></a>)}</div><a className="text-link" href="#shop">View all collections&nbsp; →</a></div></section>

      <section className="category-strip"><div className="section-heading"><span>✦</span><h2>Shop by Category</h2><span>✦</span></div><div className="category-nav">{["All","Everyday","Bottom Wear","Dresses","Co-ords","Party Wear"].map((c) => <button className={activeCategory === c ? "active" : ""} key={c} onClick={() => setActiveCategory(c)}>{c}</button>)}</div><a className="category-all" href="/shop">Explore all categories&nbsp; →</a></section>

      <section className="shop" id="shop"><div className="shop-heading"><div><span className="eyebrow">THE CARNIVAL EDIT</span><h2>Pieces to <i>fall for</i></h2></div><a className="text-link" href="/shop">Shop all&nbsp; →</a></div><div className="product-grid">{shownProducts.map((p) => <article className="product-card" key={p.name}><a href={p.href}><div className="product-image">{p.badge && <em>{p.badge}</em>}<img src={p.img} alt={p.name} style={{objectPosition: `${p.position || "50%"} center`}}/><button aria-label="Add to wishlist" onClick={(e) => e.preventDefault()}>♡</button></div><div className="product-info"><div><h3>{p.name}</h3><p>{p.type}</p></div><strong>{p.price}</strong></div></a><button className="add-button" onClick={() => addToBag(p.name)}>Add to bag <span>+</span></button></article>)}</div></section>

      <section className="story" id="story"><img src="/collection.jpg" alt="Our welcoming store"/><div><span className="eyebrow">OUR STORY</span><h2>Where Tradition <i>Meets Trend</i></h2><p>At Carnival of Clothes by Nandini, we blend timeless tradition with modern elegance. Each piece is handpicked to bring you quality, grace, and unmatched style.</p><a className="text-link" href="#contact">Learn more about us&nbsp; →</a></div><div className="section-index">02</div></section>

      <section className="perks"><div><span>♢</span><b>Premium quality</b><small>Finest fabrics, meticulous craftsmanship.</small></div><div><span>♧</span><b>Curated collections</b><small>Handpicked styles for every occasion.</small></div><div><span>♙</span><b>Personalized service</b><small>We style you with care and attention.</small></div><div><span>♧</span><b>Worldwide shipping</b><small>Delivering elegance to your doorstep.</small></div></section>

      <footer id="contact"><div><a className="logo">Carnival of Clothes <small>by nandini ♡</small></a><p>Curated collections that make every celebration unforgettable.</p></div><div><b>Quick links</b><a href="#shop">Collections</a><a href="#shop">New arrivals</a><a href="#story">About us</a></div><div><b>Customer care</b><a>Shipping & Delivery</a><a>Returns & Exchange</a><a>FAQs</a></div><div><b>Stay in the loop</b><p>Be the first to know about new arrivals & offers.</p><div className="email"><input placeholder="Enter your email"/><button>→</button></div></div><div className="copyright">© 2024 Carnival of Clothes by Nandini. All rights reserved.</div></footer>

      {menuOpen && <div className="drawer-backdrop" onClick={() => setMenuOpen(false)}><aside className="drawer" onClick={(e) => e.stopPropagation()}><button className="close" onClick={() => setMenuOpen(false)}>×</button><a className="logo">Carnival of Clothes <small>by nandini ♡</small></a><div className="drawer-links">{["Home","Collections","New Arrivals","Shop by Category","About Us","Our Story","Contact Us"].map((x) => <a href={x === "Home" ? "#top" : x === "Our Story" ? "#story" : "#shop"} onClick={() => setMenuOpen(false)} key={x}>{x}<span>›</span></a>)}</div><div className="drawer-note">Free shipping<br/><small>On orders above ₹2999</small></div><a className="primary" href="#shop" onClick={() => setMenuOpen(false)}>Continue shopping&nbsp; →</a></aside></div>}
      {toast && <div className="toast">♡ {toast}</div>}<CartSheet open={cartOpen} onClose={() => setCartOpen(false)} itemCount={cart} />
    </main>
  );
}
