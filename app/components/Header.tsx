"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getCartCount } from "../cart-helper";
import CartSheet from "./CartSheet";
import { Signature } from "./Signature";

interface HeaderProps {
  activeTab?: string;
}

const drawerCategories = [
  { name: "Top Wear", img: "/top-wear-pink-floral.png", href: "/shop?category=Everyday%20Essentials", subcategories: ["Shirts", "Kurtis", "T-shirts", "Crop Tops", "Tank Tops", "Bodysuits"] },
  { name: "Bottom Wear", img: "/bottom-wear-category.png", href: "/shop?category=Bottom%20Wear", subcategories: ["Jeans", "Trousers", "Cargo Pants", "Palazzo Pants", "Skirts", "Shorts"] },
  { name: "Indian", img: "/indian-suits.png", href: "/shop?category=Indian", subcategories: ["Kurtis", "Kurta Sets", "Sarees", "Lehenga Sets", "Anarkali Suits", "Dupattas"] },
  { name: "Korean", img: "/korean-suit-style.png", href: "/shop?category=Korean", subcategories: ["Korean Tops", "Korean Dresses", "Korean Co-ords", "Oversized Shirts", "Pleated Skirts"] },
  { name: "Party Wear", img: "/party-wear-red-dress.png", href: "/shop?category=Party%20Wear", subcategories: ["Party Dresses", "Cocktail Dresses", "Sequin Tops", "Satin Tops", "Corset Tops", "Jumpsuits", "Playsuits"] },
  { name: "Accessories", img: "/accessories-gold-jewelry.jpg", href: "/shop?category=Accessories", subcategories: ["Handbags", "Jewellery", "Sunglasses", "Belts", "Hair Accessories", "Scarves"] },
  { name: "COMBO", img: "/combos-co-ords.png", href: "/shop?category=Co-ord%20Sets", uppercase: true },
  { name: "OFFERS", img: "/special-offers-deals.jpg", href: "/shop?category=Trending", featured: true, uppercase: true },
];

export default function Header({ activeTab }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [search, setSearch] = useState(false);
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const drawerBackdropRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const touchStartXRef = useRef<number | null>(null);
  const drawerClosingRef = useRef(false);

  const closeMenu = useCallback(() => {
    if (drawerClosingRef.current) return;

    const backdrop = drawerBackdropRef.current;
    const drawer = drawerRef.current;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!backdrop || !drawer || reduceMotion) {
      setMenuOpen(false);
      return;
    }

    drawerClosingRef.current = true;
    import("gsap").then(({ gsap }) => {
      gsap.timeline({ onComplete: () => setMenuOpen(false) })
        .to(drawer, { x: "-100%", opacity: 0.75, duration: 0.34, ease: "power2.in" })
        .to(backdrop, { opacity: 0, duration: 0.2, ease: "power1.in" }, "-=0.16");
    });
  }, []);

  const splitText = (text: string, className: string) => {
    return text.split("").map((char, index) => (
      <span key={index} className={`${className} logo-char`} style={{ display: "inline-block", opacity: 0 }}>
        {char === " " ? "\u00A0" : char}
      </span>
    ));
  };

  useEffect(() => {
    const handleUpdate = () => {
      setCartCount(getCartCount());
    };
    const initialLoad = window.setTimeout(handleUpdate, 0);
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

    return () => {
      window.clearTimeout(initialLoad);
      window.removeEventListener("coc-cart-updated", handleUpdate);
    };
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

  useEffect(() => {
    if (!menuOpen || !drawerBackdropRef.current || !drawerRef.current) return;

    drawerClosingRef.current = false;

    let cleanup = () => {};
    let cancelled = false;

    import("gsap").then(({ gsap }) => {
      if (cancelled || !drawerBackdropRef.current || !drawerRef.current) return;

      const backdrop = drawerBackdropRef.current;
      const drawer = drawerRef.current;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (reduceMotion) {
        gsap.set(backdrop, { opacity: 1 });
        return;
      }

      const timeline = gsap.timeline();
      timeline
        .fromTo(backdrop, { opacity: 0 }, { opacity: 1, duration: 0.22, ease: "power1.out" })
        .fromTo(drawer, { x: -45, opacity: 0 }, { x: 0, opacity: 1, duration: 0.42, ease: "power3.out" }, 0)
        .fromTo(
          drawer.querySelectorAll(".drawer-top > *"),
          { opacity: 0, y: -10 },
          { opacity: 1, y: 0, duration: 0.28, stagger: 0.08, ease: "power2.out" },
          0.12
        )
        .fromTo(
          drawer.querySelectorAll(".drawer-category-item"),
          { opacity: 0, x: -22 },
          { opacity: 1, x: 0, duration: 0.34, stagger: 0.065, ease: "power2.out" },
          0.2
        )
        .fromTo(
          drawer.querySelectorAll(".drawer-footer-links > a"),
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, duration: 0.32, stagger: 0.09, ease: "power2.out" },
          "-=0.12"
        );

      cleanup = () => timeline.kill();
    });

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;

    const scrollY = window.scrollY;
    const previous = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width,
    };

    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";

    return () => {
      document.body.style.overflow = previous.overflow;
      document.body.style.position = previous.position;
      document.body.style.top = previous.top;
      document.body.style.width = previous.width;
      window.scrollTo(0, scrollY);
    };
  }, [menuOpen]);

  const handleDrawerTouchStart = (event: React.TouchEvent) => {
    touchStartXRef.current = event.touches[0]?.clientX ?? null;
  };

  const handleDrawerTouchEnd = (event: React.TouchEvent) => {
    const startX = touchStartXRef.current;
    const endX = event.changedTouches[0]?.clientX;
    touchStartXRef.current = null;

    if (startX !== null && endX !== undefined && startX - endX > 70) {
      closeMenu();
    }
  };

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
        <div ref={drawerBackdropRef} className="drawer-backdrop overscroll-contain opacity-0" onClick={closeMenu}>
          <aside
            ref={drawerRef}
            className="drawer !flex touch-pan-y !flex-col overscroll-contain"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleDrawerTouchStart}
            onTouchEnd={handleDrawerTouchEnd}
          >
            <div className="drawer-top flex !h-[70px] !min-h-[70px] shrink-0 items-center justify-between border-b border-[#e8cdbc] py-0">
              <a className="logo drawer-logo !m-0 !flex !min-h-0 !w-auto !clear-none flex-col !items-start !p-0" href="/">
                <span className="block whitespace-nowrap text-[19px] leading-none opacity-100">
                  Carnival of Clothes
                </span>
                <Signature />
              </a>
              <button
                className="close !static !float-none !m-0 !p-0 text-[34px] leading-none"
                aria-label="Close menu"
                onClick={closeMenu}
              >
                ×
              </button>
            </div>
            <div className="drawer-links drawer-categories !mt-0 !min-h-0 !flex-1 !overflow-x-hidden !border-t-0 !pt-2 [&_span]:!font-['Work_Sans'] [&_span]:!text-[12px] [&_span]:!font-normal [&_span]:!tracking-normal">
              {drawerCategories.map((category) => {
                const expanded = openCategory === category.name;

                return (
                  <div className="drawer-category-item border-b border-[#eeded5] last:!border-b-0" key={category.name}>
                    {category.subcategories ? (
                      <>
                        <button
                          className={`flex w-full items-center justify-between px-1 py-2 text-left transition-colors duration-300 ${expanded ? "bg-[#f8ebe5]" : ""}`}
                          aria-expanded={expanded}
                          onClick={() => setOpenCategory(expanded ? null : category.name)}
                        >
                          <span className="drawer-cat-info">
                            <img src={category.img} alt="" className="drawer-cat-img" style={catImgStyle} />
                            <span>{category.name}</span>
                          </span>
                          <b className={`text-base font-normal transition-transform duration-300 ${expanded ? "rotate-90" : ""}`}>›</b>
                        </button>
                        <div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                          <div className="min-h-0 overflow-hidden">
                            <div className="mb-3 ml-[55px] overflow-hidden rounded-md border border-[#ead8ce] bg-[#fffaf7]">
                              {category.subcategories.map((subcategory) => (
                                <a
                                  className="!flex !w-full !items-center !justify-between !border-0 !border-b !border-[#ead8ce] !px-3 !py-2.5 !text-[11px] !normal-case !tracking-normal text-[#66534d] last:!border-b-0 hover:!bg-[#f8ebe5] hover:!text-[#bb7068]"
                                  href={`${category.href}&subcategory=${encodeURIComponent(subcategory)}`}
                                  onClick={() => setMenuOpen(false)}
                                  key={subcategory}
                                >
                                  {subcategory}
                                  <b className="text-sm font-normal text-[#bb7068]">›</b>
                                </a>
                              ))}
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <a className="!border-0" href={category.href} onClick={() => setMenuOpen(false)}>
                        <div className="drawer-cat-info">
                          <img src={category.img} alt={category.name} className="drawer-cat-img" style={catImgStyle} />
                          <span className={`${category.featured ? "offer-highlight" : ""} ${category.uppercase ? "!uppercase" : ""}`}>{category.name}</span>
                        </div>
                        <b>›</b>
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="drawer-footer-links !mt-auto !flex !flex-col !items-stretch !gap-2 !pb-0">
              <a className="track-order-link !flex !w-full !justify-start !px-1 !py-3" href="/shop?category=Track%20Order" onClick={() => setMenuOpen(false)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px', verticalAlign: 'middle', display: 'inline-block' }}>
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                  <line x1="12" y1="22.08" x2="12" y2="12"></line>
                </svg>
                Track Order
              </a>
              <a className="account-button !flex !w-full !justify-center !rounded-lg !bg-[#bb7068] !px-4 !py-3.5 !text-white shadow-[0_8px_20px_rgba(187,112,104,0.24)]" href="/shop?category=Account" onClick={() => setMenuOpen(false)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px', verticalAlign: 'middle', display: 'inline-block' }}>
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                My Account
              </a>
            </div>
          </aside>
        </div>
      )}

      <CartSheet open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
