"use client";

import { useEffect, useMemo, useState } from "react";
import Header from "./components/Header";
import { Signature } from "./components/Signature";
import { addToCart } from "./cart-helper";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const products = [
  { name: "Rose Pink Blazer Co-ord", type: "Blush tailored · New arrival", categories: ["Co-ords", "Everyday"], price: "₹4,999", img: "/rose-pink-coord.png", badge: "New", href: "/product/rose-pink-co-ord-set", position: "50%" },
  { name: "Ivory Power Suit Co-ord", type: "Double-breasted · New arrival", categories: ["Co-ords", "Party Wear"], price: "₹5,499", img: "/ivory-coord.png", badge: "New", href: "/product/ivory-double-breasted-co-ord-set", position: "50%" },
  { name: "Midnight One-Shoulder Maxi", type: "Black drape · New arrival", categories: ["Dresses", "Party Wear"], price: "₹4,499", img: "/midnight-maxi-dress.png", badge: "New", href: "/product/black-one-shoulder-maxi-dress", position: "50%" },
  { name: "Classic Leather Shoulder Bag", type: "Tan leather · Gold hardware", categories: ["Everyday", "Accessories"], price: "₹2,999", img: "/classic-leather-bag.png", badge: "Classic", href: "/shop", position: "50%" },
  { name: "Oversized Denim Streetwear Set", type: "Medium wash · Loose fit", categories: ["Everyday", "Trending"], price: "₹5,899", img: "/streetwear-denim-set.jpg", badge: "Trending", href: "/shop", position: "50%" },
  { name: "Minimalist Cotton Dress", type: "Sand beige · Soft linen", categories: ["Dresses", "Everyday"], price: "₹3,999", img: "/minimalist-cotton-dress.jpg", badge: "Clean", href: "/shop", position: "50%" },
  { name: "Wide-leg Linen Trousers", type: "Flared cotton · Breathable", categories: ["Bottom Wear", "Everyday"], price: "₹3,499", img: "/wide-leg-trousers.png", badge: "Cozy", href: "/shop", position: "50%" },
  { name: "Cocktail Party Dress", type: "Midnight satin · Elegant drape", categories: ["Party Wear", "Dresses"], price: "₹6,299", img: "/cocktail-dress.png", badge: "Party", href: "/shop", position: "50%" },
  { name: "Black Oval sunglass", type: "Classic frame · UV protection", categories: ["Accessories", "Everyday"], price: "₹899", img: "/black-oval-sunglasses.png", badge: "Retro", href: "/shop", position: "50%" },
];

export default function Home() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [toast, setToast] = useState("");
  
  const shownProducts = useMemo(() => {
    if (activeCategory === "All") return products;
    return products.filter((p) => p.categories.includes(activeCategory));
  }, [activeCategory]);

  useEffect(() => {
    gsap.fromTo(".product-card",
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
  }, [shownProducts]);

  useEffect(() => {
    let handleMouseMove: (e: MouseEvent) => void;
    let hero: Element | null = null;
    let cardCleanups: (() => void)[] = [];

    if (typeof window !== "undefined") {
      gsap.registerPlugin(ScrollTrigger);

      // Hero Section Animations
      const tl = gsap.timeline();
      tl.fromTo(".hero-copy .eyebrow", 
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }
      )
      .fromTo(".hero-copy h1",
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 1, ease: "power3.out" },
        "-=0.6"
      )
      .fromTo(".hero-copy p",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" },
        "-=0.6"
      )
      .fromTo(".hero-copy .primary",
        { opacity: 0, scale: 0.9 },
        { opacity: 1, scale: 1, duration: 0.6, ease: "back.out(1.7)" },
        "-=0.4"
      )
      .fromTo(".hero-copy .dots",
        { opacity: 0 },
        { opacity: 1, duration: 0.6 },
        "-=0.4"
      )
      .fromTo(".hero-image img",
        { scale: 1.15, filter: "brightness(0.7) saturate(0.5)" },
        { scale: 1, filter: "brightness(1) saturate(0.9)", duration: 1.8, ease: "power2.out" },
        "0"
      )
      .fromTo(".hero-stamp",
        { opacity: 0, x: 20 },
        { opacity: 1, x: 0, duration: 1, ease: "power2.out" },
        "-=1"
      );

      // Collections Cards 3D Deal Entrance Animation
      gsap.fromTo(".collection-card", 
        { opacity: 0, y: 120, rotationY: 15, rotationX: -10, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          rotationY: 0,
          rotationX: 0,
          scale: 1,
          duration: 1.4,
          stagger: 0.18,
          ease: "power4.out",
          scrollTrigger: {
            trigger: ".collections",
            start: "top 80%",
            toggleActions: "play none none none"
          }
        }
      );

      // Scroll Parallax inside card images
      gsap.utils.toArray(".collection-card img").forEach((img: any) => {
        gsap.fromTo(img,
          { yPercent: -15 },
          {
            yPercent: 15,
            ease: "none",
            scrollTrigger: {
              trigger: img,
              start: "top bottom",
              end: "bottom top",
              scrub: true
            }
          }
        );
      });

      // Scroll Parallax on the story image
      gsap.fromTo(".story img",
        { yPercent: -20 },
        {
          yPercent: 20,
          ease: "none",
          scrollTrigger: {
            trigger: ".story",
            start: "top bottom",
            end: "bottom top",
            scrub: true
          }
        }
      );

      // Story Section entrance
      const storyTl = gsap.timeline({
        scrollTrigger: {
          trigger: ".story",
          start: "top 75%",
          toggleActions: "play none none none"
        }
      });
      storyTl.fromTo(".story div",
        { opacity: 0, x: 30 },
        { opacity: 1, x: 0, duration: 0.8, ease: "power2.out" }
      );

      // Perks Section reveal
      gsap.fromTo(".perks div",
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.12,
          ease: "power1.out",
          scrollTrigger: {
            trigger: ".perks",
            start: "top 85%",
            toggleActions: "play none none none"
          }
        }
      );

      // Subtle mouse-move parallax on hero image
      hero = document.querySelector(".hero");
      const img = document.querySelector(".hero-image img");
      if (hero && img) {
        handleMouseMove = (e: MouseEvent) => {
          const { clientX, clientY } = e;
          const { innerWidth, innerHeight } = window;
          const xPercent = (clientX / innerWidth - 0.5) * 15;
          const yPercent = (clientY / innerHeight - 0.5) * 15;

          gsap.to(img, {
            x: xPercent,
            y: yPercent,
            duration: 0.8,
            ease: "power2.out"
          });
        };

        hero.addEventListener("mousemove", handleMouseMove as any);
      }

      // Interactive 3D tilt hover on collection cards
      const cards = gsap.utils.toArray(".collection-card");
      cardCleanups = cards.map((card: any) => {
        const cardImg = card.querySelector("img");
        const handleCardMove = (e: MouseEvent) => {
          const { clientX, clientY } = e;
          const rect = card.getBoundingClientRect();
          const x = (clientX - rect.left) / rect.width - 0.5;
          const y = (clientY - rect.top) / rect.height - 0.5;

          gsap.to(card, {
            rotationY: x * 20,
            rotationX: -y * 20,
            scale: 1.04,
            transformPerspective: 1000,
            duration: 0.4,
            ease: "power2.out"
          });

          if (cardImg) {
            gsap.to(cardImg, {
              x: x * 12,
              y: y * 12,
              duration: 0.4,
              ease: "power2.out"
            });
          }
        };

        const handleCardLeave = () => {
          gsap.to(card, {
            rotationY: 0,
            rotationX: 0,
            scale: 1,
            duration: 0.7,
            ease: "power3.out"
          });

          if (cardImg) {
            gsap.to(cardImg, {
              x: 0,
              y: 0,
              duration: 0.7,
              ease: "power3.out"
            });
          }
        };

        card.addEventListener("mousemove", handleCardMove as any);
        card.addEventListener("mouseleave", handleCardLeave as any);

        return () => {
          card.removeEventListener("mousemove", handleCardMove as any);
          card.removeEventListener("mouseleave", handleCardLeave as any);
        };
      });
    }

    return () => {
      if (hero && handleMouseMove) {
        hero.removeEventListener("mousemove", handleMouseMove as any);
      }
      cardCleanups.forEach((cleanup) => cleanup());
    };
  }, []);

  useEffect(() => {
    // Quick stagger fade-in of product cards when category filter changes or grid mounts
    gsap.fromTo(".product-card",
      { opacity: 0, y: 25 },
      { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: "power2.out" }
    );
  }, [shownProducts]);

  const addToBag = (product: typeof products[0]) => {
    addToCart({
      name: product.name,
      price: product.price,
      img: product.img,
      size: "M"
    });
    setToast(`${product.name} added to your bag`);
    setTimeout(() => setToast(""), 2200);
  };

  return (
    <main>
      <Header activeTab="home" />

      <section className="hero" id="top">
        <div className="hero-copy">
          <span className="eyebrow">THE NEW SEASON EDIT</span>
          <h1>Timeless <i>Elegance,</i><br/>Crafted<br/>for You.</h1>
          <p>Discover curated collections that celebrate your style and every special moment.</p>
          <a href="#shop" className="primary">Explore Collection <span>→</span></a>
          <div className="dots"><b/>○ ○</div>
        </div>
        <div className="hero-image">
          <img src="/hero.jpg" alt="Rose pink tailored co-ord in the Carnival of Clothes boutique"/>
          <div className="hero-stamp">CARNIVAL<br/>OF CLOTHES</div>
        </div>
      </section>

      <section className="collections" id="collections">
        <div className="section-index">01</div>
        <div>
          <span className="eyebrow">OUR COLLECTION</span>
          <h2>Curated Styles <i>For Every You</i></h2>
          <div className="collection-grid">
            {[
              ["Party Wear", "/party-wear-red-dress.png", "/shop?category=Party%20Wear"],
              ["Bottom Wear", "/bottom-wear-category.png", "/shop?category=Bottom%20Wear"],
              ["Top Wear", "/top-wear-pink-floral.png", "/shop?category=Everyday%20Essentials"],
              ["Korean", "/korean-suit-style.png", "/shop?category=Korean"],
              ["Indian", "/indian-suits.png", "/shop?category=Indian"],
              ["Accessories", "/accessories-gold-jewelry.jpg", "/shop?category=Accessories"]
            ].map(([x, img, href]) => (
              <a className="collection-card" href={href} key={x}>
                <img src={img} alt={x}/>
                <strong>{x}</strong>
              </a>
            ))}
          </div>

          <div className="promo-grid">
            <a className="promo-card" href="/shop?category=Co-ord%20Sets">
              <div className="promo-image-wrapper">
                <img src="/combos-co-ords.png" alt="Combos & Co-ords" />
              </div>
              <strong>Combos & Co-ords</strong>
            </a>
            <a className="promo-card" href="/shop?category=Trending">
              <div className="promo-image-wrapper">
                <img src="/special-offers-deals.jpg" alt="Special Offers & Deals" />
              </div>
              <strong>Special Offers & Deals</strong>
            </a>
          </div>
        </div>
      </section>

      <section className="category-strip">
        <div className="section-heading">
          <span>✦</span>
          <h2>Shop by Category</h2>
          <span>✦</span>
        </div>
        <div className="category-nav">
          {["All","Everyday","Bottom Wear","Dresses","Co-ords","Party Wear"].map((c) => (
            <button className={activeCategory === c ? "active" : ""} key={c} onClick={() => setActiveCategory(c)}>{c}</button>
          ))}
        </div>
        <a className="category-all" href="/shop">Explore all categories&nbsp; →</a>
      </section>

      <section className="shop" id="shop">
        <div className="shop-heading">
          <div>
            <span className="eyebrow">THE CARNIVAL EDIT</span>
            <h2>Pieces to <i>fall for</i></h2>
          </div>
          <a className="text-link" href="/shop">Shop all&nbsp; →</a>
        </div>
        <div className="product-grid">
          {shownProducts.map((p) => (
            <article className="product-card" key={p.name}>
              <a href={p.href}>
                <div className="product-image">
                  {p.badge && <em>{p.badge}</em>}
                  <img src={p.img} alt={p.name} style={{objectPosition: `${p.position || "50%"} center`}}/>
                  <button aria-label="Add to wishlist" onClick={(e) => e.preventDefault()}>♡</button>
                </div>
                <div className="product-info">
                  <div>
                    <h3>{p.name}</h3>
                    <p>{p.type}</p>
                  </div>
                  <strong>{p.price}</strong>
                </div>
              </a>
              <button className="add-button" onClick={() => addToBag(p)}>Add to bag <span>+</span></button>
            </article>
          ))}
        </div>
      </section>

      <section className="story" id="story">
        <img src="/collection.jpg" alt="Our welcoming store"/>
        <div>
          <span className="eyebrow">OUR STORY</span>
          <h2>Where Tradition <i>Meets Trend</i></h2>
          <p>At Carnival of Clothes by Nandini, we blend timeless tradition with modern elegance. Each piece is handpicked to bring you quality, grace, and unmatched style.</p>
          <a className="text-link" href="#contact">Learn more about us&nbsp; →</a>
        </div>
        <div className="section-index">02</div>
      </section>

      <section className="perks">
        <div><span>♢</span><b>Premium quality</b><small>Finest fabrics, meticulous craftsmanship.</small></div>
        <div><span>♧</span><b>Curated collections</b><small>Handpicked styles for every occasion.</small></div>
        <div><span>♙</span><b>Personalized service</b><small>We style you with care and attention.</small></div>
        <div><span>♧</span><b>Worldwide shipping</b><small>Delivering elegance to your doorstep.</small></div>
      </section>

      <footer id="contact">
        <div>
          <a className="logo" style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>Carnival of Clothes <Signature /></a>
          <p>Curated collections that make every celebration unforgettable.</p>
        </div>
        <div>
          <b>Quick links</b>
          <a href="#shop">Collections</a>
          <a href="#shop">New arrivals</a>
          <a href="#story">About us</a>
        </div>
        <div>
          <b>Customer care</b>
          <a>Shipping & Delivery</a>
          <a>Returns & Exchange</a>
          <a>FAQs</a>
        </div>
        <div>
          <b>Stay in the loop</b>
          <p>Be the first to know about new arrivals & offers.</p>
          <div className="email"><input placeholder="Enter your email"/><button>→</button></div>
        </div>
        <div className="copyright">© 2024 Carnival of Clothes by Nandini. All rights reserved.</div>
      </footer>

      {toast && <div className="toast">♡ {toast}</div>}
    </main>
  );
}
