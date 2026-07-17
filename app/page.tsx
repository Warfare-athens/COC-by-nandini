"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  const pageRef = useRef<HTMLElement>(null);
  
  const shownProducts = useMemo(() => {
    if (activeCategory === "All") return products;
    return products.filter((p) => p.categories.includes(activeCategory));
  }, [activeCategory]);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    const cleanups: Array<() => void> = [];

    const context = gsap.context(() => {
      media.add(
        {
          motion: "(prefers-reduced-motion: no-preference)",
          desktop: "(min-width: 801px)",
        },
        (mediaContext) => {
          const { motion, desktop } = mediaContext.conditions as { motion: boolean; desktop: boolean };
          if (!motion) return;

          gsap.timeline({
            defaults: { ease: "power3.out" },
            scrollTrigger: {
              trigger: ".hero",
              start: "top 70%",
              end: "bottom 20%",
              toggleActions: "restart none restart reverse",
            },
          })
            .fromTo(".hero-copy .eyebrow", { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.55 })
            .fromTo(".hero-copy h1", { autoAlpha: 0, y: 55, skewY: 2 }, { autoAlpha: 1, y: 0, skewY: 0, duration: 1.05 }, "-=0.25")
            .fromTo(".hero-copy p", { autoAlpha: 0, y: 22 }, { autoAlpha: 1, y: 0, duration: 0.65 }, "-=0.55")
            .fromTo(".hero-copy .primary", { autoAlpha: 0, y: 18, scale: 0.94 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.55, ease: "back.out(1.5)" }, "-=0.35")
            .fromTo(".hero-copy .dots", { autoAlpha: 0, x: -15 }, { autoAlpha: 1, x: 0, duration: 0.45 }, "-=0.25")
            .fromTo(".hero-image", { autoAlpha: 0, clipPath: "inset(0 0 100% 0 round 999px 999px 0 0)" }, { autoAlpha: 1, clipPath: "inset(0 0 0% 0 round 999px 999px 0 0)", duration: 1.25, ease: "power4.inOut" }, 0.08)
            .fromTo(".hero-image img", { scale: 1.16 }, { scale: 1, duration: 1.55, ease: "power3.out" }, 0.08)
            .fromTo(".hero-stamp", { autoAlpha: 0, x: 16 }, { autoAlpha: 1, x: 0, duration: 0.65 }, "-=0.6");

          const reveal = (trigger: string, targets: string, from: gsap.TweenVars, stagger = 0.1) => {
            gsap.fromTo(targets, from, {
              autoAlpha: 1,
              x: 0,
              y: 0,
              scale: 1,
              rotation: 0,
              duration: 0.72,
              stagger,
              ease: "back.out(1.18)",
              scrollTrigger: {
                trigger,
                start: "top 66%",
                end: "bottom 24%",
                toggleActions: "restart none restart reverse",
                fastScrollEnd: true,
              },
            });
          };

          reveal(".collections", ".collections .section-index, .collections .eyebrow, .collections h2", { autoAlpha: 0, y: 24 }, 0.08);
          reveal(".collection-grid", ".collection-card", { autoAlpha: 0, y: 38, scale: 0.95, rotation: 1.2 }, 0.09);
          reveal(".promo-grid", ".promo-card", { autoAlpha: 0, y: 34, scale: 0.96 }, 0.11);
          reveal(".category-strip", ".section-heading, .category-nav button, .category-all", { autoAlpha: 0, y: 18 }, 0.055);
          reveal(".shop", ".shop-heading > *, .product-card", { autoAlpha: 0, y: 32, scale: 0.975 }, 0.065);
          reveal(".perks", ".perks > div", { autoAlpha: 0, y: 26, scale: 0.96 }, 0.085);
          reveal("footer", "footer > div", { autoAlpha: 0, y: 20 }, 0.07);

          gsap.timeline({
            scrollTrigger: {
              trigger: ".story",
              start: "top 66%",
              end: "bottom 24%",
              toggleActions: "restart none restart reverse",
            },
          })
            .fromTo(".story > img", { autoAlpha: 0, clipPath: "inset(100% 0 0 0 round 50% 50% 0 0)", scale: 1.08 }, { autoAlpha: 1, clipPath: "inset(0% 0 0 0 round 50% 50% 0 0)", scale: 1, duration: 1.1, ease: "power4.inOut" })
            .fromTo(".story > div:not(.section-index) > *", { autoAlpha: 0, x: 36 }, { autoAlpha: 1, x: 0, duration: 0.7, stagger: 0.1, ease: "power3.out" }, "-=0.65")
            .fromTo(".story .section-index", { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.65 }, "-=0.45");

          if (desktop) {
            gsap.to(".hero-image img", { yPercent: 8, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 0.8 } });
            gsap.to(".story > img", { yPercent: 9, ease: "none", scrollTrigger: { trigger: ".story", start: "top bottom", end: "bottom top", scrub: 0.8 } });

            const hero = pageRef.current?.querySelector<HTMLElement>(".hero");
            const heroImage = pageRef.current?.querySelector<HTMLElement>(".hero-image");
            if (hero && heroImage) {
              const moveX = gsap.quickTo(heroImage, "x", { duration: 0.7, ease: "power3.out" });
              const moveY = gsap.quickTo(heroImage, "y", { duration: 0.7, ease: "power3.out" });
              const onMove = (event: MouseEvent) => {
                const bounds = hero.getBoundingClientRect();
                moveX(((event.clientX - bounds.left) / bounds.width - 0.5) * 12);
                moveY(((event.clientY - bounds.top) / bounds.height - 0.5) * 12);
              };
              const onLeave = () => { moveX(0); moveY(0); };
              hero.addEventListener("mousemove", onMove);
              hero.addEventListener("mouseleave", onLeave);
              cleanups.push(() => {
                hero.removeEventListener("mousemove", onMove);
                hero.removeEventListener("mouseleave", onLeave);
              });
            }

            pageRef.current?.querySelectorAll<HTMLElement>(".collection-card, .promo-card, .product-card").forEach((card) => {
              const onEnter = () => gsap.to(card, { y: -8, scale: 1.025, duration: 0.35, ease: "power2.out", overwrite: "auto" });
              const onLeave = () => gsap.to(card, { y: 0, scale: 1, duration: 0.55, ease: "power3.out", overwrite: "auto" });
              card.addEventListener("mouseenter", onEnter);
              card.addEventListener("mouseleave", onLeave);
              cleanups.push(() => {
                card.removeEventListener("mouseenter", onEnter);
                card.removeEventListener("mouseleave", onLeave);
              });
            });
          }
        }
      );
    }, pageRef);

    return () => {
      cleanups.forEach((cleanup) => cleanup());
      media.revert();
      context.revert();
    };
  }, []);

  useEffect(() => {
    const cards = pageRef.current?.querySelectorAll<HTMLElement>(".product-card");
    if (!cards?.length || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const tween = gsap.fromTo(cards, { autoAlpha: 0, y: 28, scale: 0.97 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.55, stagger: 0.065, ease: "power3.out", overwrite: "auto" });
    return () => {
      tween.kill();
    };
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
    <main ref={pageRef}>
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
              <strong className="uppercase">Combo</strong>
            </a>
            <a className="promo-card" href="/shop?category=Trending">
              <div className="promo-image-wrapper">
                <img src="/special-offers-deals.jpg" alt="Special Offers & Deals" />
              </div>
              <strong className="uppercase">Offers</strong>
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
