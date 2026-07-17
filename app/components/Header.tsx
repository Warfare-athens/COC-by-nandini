"use client";

import { useEffect, useState } from "react";
import { getCartCount } from "../cart-helper";
import CartSheet from "./CartSheet";
import { Signature } from "./Signature";

interface HeaderProps {
  activeTab?: string;
}

export default function Header({ activeTab }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [search, setSearch] = useState(false);

  const splitText = (text: string, className: string) => {
    return text.split("").map((char, index) => (
      <span key={index} className={`${className} logo-char`} style={{ display: "inline-block", opacity: 0 }}>
        {char === " " ? "\u00A0" : char}
      </span>
    ));
  };

  useEffect(() => {
    setCartCount(getCartCount());
    const handleUpdate = () => {
      setCartCount(getCartCount());
    };
    window.addEventListener("coc-cart-updated", handleUpdate);

    // GSAP writing animation
    import("gsap").then(({ gsap }) => {
      gsap.timeline()
        .to(".logo-char-main", {
          opacity: 1,
          stagger: 0.1,
          duration: 0.1,
          ease: "none"
        })
        .to(".logo-char-sub", {
          opacity: 1,
          stagger: 0.08,
          duration: 0.1,
          ease: "none"
        }, "-=0.1");
    });

    return () => window.removeEventListener("coc-cart-updated", handleUpdate);
  }, []);

  useEffect(() => {
    if (cartCount > 0) {
      import("gsap").then(({ gsap }) => {
        gsap.timeline()
          .fromTo(".bag", 
            { scale: 1 },
            { scale: 1.35, duration: 0.15, ease: "power1.out" }
          )
          .to(".bag", 
            { scale: 1, duration: 0.6, ease: "elastic.out(1, 0.4)" }
          );
      });
    }
  }, [cartCount]);

  const catImgStyle = {
    width: "40px",
    height: "40px",
    minWidth: "40px",
    minHeight: "40px",
    objectFit: "cover" as const,
    borderRadius: "6px",
    border: "1px solid var(--gold)"
  };

  return (
    <>
      <div className="shipping">✦ &nbsp; FREE SHIPPING ON ORDERS ABOVE ₹2999 &nbsp; ✦</div>
      <header className="nav">
        <button className="icon-button menu-trigger" aria-label="Open menu" onClick={() => setMenuOpen(true)}>
          <span className="modern-menu"><i/><i/><i/></span>
        </button>
        <a className="logo" href="/" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <span style={{ display: "block" }}>{splitText("Carnival of Clothes", "logo-char-main")}</span>
          <Signature />
        </a>
        <nav className="links">
          <a href="/" className={activeTab === "home" ? "active-link" : ""}>Home</a>
          <a href="/shop" className={activeTab === "shop" ? "active-link" : ""}>Shop All</a>
          <a href="/#story">Our Story</a>
          <a href="/#contact">Contact</a>
        </nav>
        <div className="actions">
          <button className="icon-button" aria-label="Search" onClick={() => setSearch(!search)} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </button>
          <button className="bag" aria-label="Cart" onClick={() => setCartOpen(true)} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
            <b>{cartCount}</b>
          </button>
        </div>
      </header>
      {search && (
        <div className="searchbar">
          <input autoFocus placeholder="Search your next favourite..." />
          <span>Press enter to search</span>
        </div>
      )}
      
      {/* Mobile Drawer */}
      {menuOpen && (
        <div className="drawer-backdrop" onClick={() => setMenuOpen(false)}>
          <aside className="drawer" onClick={(e) => e.stopPropagation()}>
            <button className="close" onClick={() => setMenuOpen(false)}>×</button>
            <a className="logo" href="/" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>Carnival of Clothes <Signature /></a>
            <div className="drawer-links drawer-categories">
              <a href="/shop?category=Korean" onClick={() => setMenuOpen(false)}>
                <div className="drawer-cat-info">
                  <img src="/korean-suit-style.png" alt="Korean" className="drawer-cat-img" style={catImgStyle} />
                  <span>Korean Style</span>
                </div>
                <b>›</b>
              </a>
              <a href="/shop?category=Party%20Wear" onClick={() => setMenuOpen(false)}>
                <div className="drawer-cat-info">
                  <img src="/party-wear-red-dress.png" alt="Party Wear" className="drawer-cat-img" style={catImgStyle} />
                  <span>Party Wear</span>
                </div>
                <b>›</b>
              </a>
              <a href="/shop?category=Accessories" onClick={() => setMenuOpen(false)}>
                <div className="drawer-cat-info">
                  <img src="/accessories-gold-jewelry.jpg" alt="Accessories" className="drawer-cat-img" style={catImgStyle} />
                  <span>Accessories</span>
                </div>
                <b>›</b>
              </a>
              <a href="/shop?category=Everyday%20Essentials" onClick={() => setMenuOpen(false)}>
                <div className="drawer-cat-info">
                  <img src="/top-wear-pink-floral.png" alt="Everyday Essentials" className="drawer-cat-img" style={catImgStyle} />
                  <span>Everyday Essentials</span>
                </div>
                <b>›</b>
              </a>
              <a href="/shop?category=Bottom%20Wear" onClick={() => setMenuOpen(false)}>
                <div className="drawer-cat-info">
                  <img src="/bottom-wear-category.png" alt="Bottom Wear" className="drawer-cat-img" style={catImgStyle} />
                  <span>Bottom Wear</span>
                </div>
                <b>›</b>
              </a>
              <a href="/shop?category=Co-ord%20Sets" onClick={() => setMenuOpen(false)}>
                <div className="drawer-cat-info">
                  <img src="/combos-co-ords.png" alt="Combos & Co-ords" className="drawer-cat-img" style={catImgStyle} />
                  <span>Combos & Co-ords</span>
                </div>
                <b>›</b>
              </a>
              <a href="/shop?category=Trending" onClick={() => setMenuOpen(false)}>
                <div className="drawer-cat-info">
                  <img src="/special-offers-deals.jpg" alt="Special Offers" className="drawer-cat-img" style={catImgStyle} />
                  <span className="offer-highlight">Special Offers & Deals</span>
                </div>
                <b>›</b>
              </a>
            </div>
            <div className="drawer-footer-links">
              <a href="/shop?category=Track%20Order" onClick={() => setMenuOpen(false)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px', verticalAlign: 'middle', display: 'inline-block' }}>
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                  <line x1="12" y1="22.08" x2="12" y2="12"></line>
                </svg>
                Track Order
              </a>
              <a href="/shop?category=Account" onClick={() => setMenuOpen(false)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px', verticalAlign: 'middle', display: 'inline-block' }}>
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                My Account
              </a>
            </div>
            <a className="primary" href="/shop" onClick={() => setMenuOpen(false)}>Continue shopping&nbsp; →</a>
          </aside>
        </div>
      )}

      <CartSheet open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
