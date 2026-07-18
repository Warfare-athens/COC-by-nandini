"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Header from "./components/Header";
import { Signature } from "./components/Signature";
import { addToCart } from "./cart-helper";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

type HomeProduct = {
  name: string;
  type: string;
  categories: string[];
  price: string;
  img: string;
  badge: string;
  href: string;
  position: string;
};

type ProductImageSource = {
  img?: string;
  heroImage?: string | null;
  primaryImage?: string | null;
  images?: Array<string | { url: string; isPrimary?: boolean }>;
};

// Render exactly one primary image per product, including future database rows.
const getProductHeroImage = (product: ProductImageSource) => {
  const primaryGalleryImage = product.images?.find(
    (image) => typeof image !== "string" && image.isPrimary,
  );
  const firstGalleryImage = product.images?.[0];
  return (
    product.heroImage ??
    product.primaryImage ??
    (typeof primaryGalleryImage === "object"
      ? primaryGalleryImage.url
      : undefined) ??
    (typeof firstGalleryImage === "string"
      ? firstGalleryImage
      : firstGalleryImage?.url) ??
    product.img
  );
};

export default function Home() {
  const [products, setProducts] = useState<HomeProduct[]>([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [toast, setToast] = useState("");
  const pageRef = useRef<HTMLElement>(null);
  const showcaseRef = useRef<HTMLElement>(null);
  const showcaseItemsRef = useRef<Array<HTMLAnchorElement | null>>([]);
  const curvedRailRefs = useRef<Array<HTMLElement | null>>([]);
  const curvedCardsRefs = useRef<Array<Array<HTMLAnchorElement | null>>>([
    [],
    [],
  ]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/storefront/products", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload) => {
        if (cancelled || !Array.isArray(payload.products)) return;
        setProducts(
          payload.products.map((product: Record<string, unknown>) => {
            const tags = Array.isArray(product.tags)
              ? product.tags.map(String)
              : [];
            const searchable =
              `${product.name || ""} ${tags.join(" ")}`.toLowerCase();
            const categories = [
              searchable.includes("dress") && "Dresses",
              (searchable.includes("coord") || searchable.includes("co-ord")) &&
                "Co-ords",
              (searchable.includes("party") ||
                searchable.includes("evening")) &&
                "Party Wear",
              (searchable.includes("trouser") ||
                searchable.includes("jean") ||
                searchable.includes("skirt")) &&
                "Bottom Wear",
              "Everyday",
            ].filter(Boolean) as string[];
            return {
              name: String(product.name),
              type: String(
                product.short_description ||
                  tags.slice(0, 2).join(" · ") ||
                  "Carnival edit",
              ),
              categories: [...new Set(categories)],
              price: `₹${Number(product.price_inr).toLocaleString("en-IN")}`,
              img: String(product.hero_image_url || "/product.jpg"),
              badge: product.is_new_arrival
                ? "New"
                : product.is_best_seller
                  ? "Best seller"
                  : product.is_featured
                    ? "Featured"
                    : "",
              href: `/product/${String(product.slug)}`,
              position: "50%",
            } satisfies HomeProduct;
          }),
        );
      })
      .catch(() => setProducts([]));
    return () => {
      cancelled = true;
    };
  }, []);

  const shownProducts = useMemo(() => {
    if (activeCategory === "All") return products;
    return products.filter((p) => p.categories.includes(activeCategory));
  }, [activeCategory]);

  const showcaseProducts = useMemo(
    () =>
      products
        .map((product) => ({
          ...product,
          heroImage: getProductHeroImage(product),
        }))
        .filter((product): product is typeof product & { heroImage: string } =>
          Boolean(product.heroImage),
        ),
    [products],
  );
  const curvedProductSlides = useMemo(
    () => [
      {
        id: "best-sellers",
        label: "BEST SELLERS",
        products: showcaseProducts.filter((product) => product.badge !== "New"),
      },
      {
        id: "new-arrivals",
        label: "NEW ARRIVALS",
        products: showcaseProducts.filter((product) => product.badge === "New"),
      },
    ],
    [showcaseProducts],
  );

  const animatedLetters = (text: string, keyPrefix: string) =>
    text.split("").map((letter, index) => (
      <span
        className="hero-letter"
        aria-hidden="true"
        key={`${keyPrefix}-${index}`}
      >
        {letter === " " ? "\u00A0" : letter}
      </span>
    ));

  const animatedHeadingWords = (text: string, keyPrefix: string) =>
    text.split(" ").map((word, wordIndex) => (
      <span
        className="heading-word"
        aria-hidden="true"
        key={`${keyPrefix}-word-${wordIndex}`}
      >
        {word.split("").map((letter, letterIndex) => (
          <span
            className="section-letter"
            key={`${keyPrefix}-${wordIndex}-${letterIndex}`}
          >
            {letter}
          </span>
        ))}
        {wordIndex < text.split(" ").length - 1 ? "\u00A0" : null}
      </span>
    ));

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
          const { motion, desktop } = mediaContext.conditions as {
            motion: boolean;
            desktop: boolean;
          };
          if (!motion) return;

          gsap
            .timeline({
              defaults: { ease: "power3.out" },
              scrollTrigger: {
                trigger: desktop ? ".hero" : ".hero-copy",
                start: desktop ? "top 70%" : "top 78%",
                end: desktop ? "bottom 20%" : "bottom 18%",
                toggleActions: "restart none restart reverse",
              },
            })
            .fromTo(
              ".hero-copy .eyebrow",
              { autoAlpha: 0, y: 18 },
              { autoAlpha: 1, y: 0, duration: 0.55 },
            )
            .fromTo(
              ".hero-letter",
              { autoAlpha: 0, y: 48, rotationX: -85, filter: "blur(7px)" },
              {
                autoAlpha: 1,
                y: 0,
                rotationX: 0,
                filter: "blur(0px)",
                duration: 0.62,
                stagger: 0.045,
                ease: "back.out(1.35)",
              },
              "-=0.25",
            )
            .fromTo(
              ".hero-copy p",
              { autoAlpha: 0, y: 22 },
              { autoAlpha: 1, y: 0, duration: 0.65 },
              "-=0.55",
            )
            .fromTo(
              ".hero-copy .primary",
              { autoAlpha: 0, y: 18, scale: 0.94 },
              {
                autoAlpha: 1,
                y: 0,
                scale: 1,
                duration: 0.55,
                ease: "back.out(1.5)",
              },
              "-=0.35",
            )
            .fromTo(
              ".hero-copy .dots",
              { autoAlpha: 0, x: -15 },
              { autoAlpha: 1, x: 0, duration: 0.45 },
              "-=0.25",
            );

          gsap
            .timeline({
              scrollTrigger: {
                trigger: ".hero-image",
                start: desktop ? "top 75%" : "top 88%",
                toggleActions: "restart none restart reverse",
              },
            })
            .fromTo(
              ".hero-image",
              {
                autoAlpha: 0,
                clipPath: "inset(0 0 100% 0 round 999px 999px 0 0)",
              },
              {
                autoAlpha: 1,
                clipPath: "inset(0 0 0% 0 round 999px 999px 0 0)",
                duration: 1.25,
                ease: "power4.inOut",
              },
              0.08,
            )
            .fromTo(
              ".hero-image img",
              { scale: 1.16 },
              { scale: 1, duration: 1.55, ease: "power3.out" },
              0.08,
            )
            .fromTo(
              ".hero-stamp",
              { autoAlpha: 0, x: 16 },
              { autoAlpha: 1, x: 0, duration: 0.65 },
              "-=0.6",
            );

          const reveal = (
            trigger: string,
            targets: string,
            from: gsap.TweenVars,
            stagger = 0.1,
          ) => {
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

          reveal(
            ".collections",
            ".collections .section-index, .collections .eyebrow",
            { autoAlpha: 0, y: 24 },
            0.08,
          );
          reveal(
            ".collections",
            ".collection-card, .promo-card",
            { autoAlpha: 0, y: 58, scale: 0.96 },
            0.13,
          );
          reveal(
            ".perks",
            ".perks > div",
            { autoAlpha: 0, y: 26, scale: 0.96 },
            0.085,
          );
          reveal("footer", "footer > div", { autoAlpha: 0, y: 20 }, 0.07);

          pageRef.current
            ?.querySelectorAll<HTMLElement>(".letter-heading")
            .forEach((heading) => {
              const letters =
                heading.querySelectorAll<HTMLElement>(".section-letter");
              gsap.fromTo(
                letters,
                { autoAlpha: 0, y: 30, rotationX: -70, filter: "blur(5px)" },
                {
                  autoAlpha: 1,
                  y: 0,
                  rotationX: 0,
                  filter: "blur(0px)",
                  duration: 0.5,
                  stagger: 0.035,
                  ease: "back.out(1.3)",
                  scrollTrigger: {
                    trigger: heading,
                    start: "top 76%",
                    end: "bottom 24%",
                    toggleActions: "restart none restart reverse",
                  },
                },
              );
            });

          gsap
            .timeline({
              scrollTrigger: {
                trigger: ".story",
                start: "top 66%",
                end: "bottom 24%",
                toggleActions: "restart none restart reverse",
              },
            })
            .fromTo(
              ".story > img",
              {
                autoAlpha: 0,
                clipPath: "inset(100% 0 0 0 round 50% 50% 0 0)",
                scale: 1.08,
              },
              {
                autoAlpha: 1,
                clipPath: "inset(0% 0 0 0 round 50% 50% 0 0)",
                scale: 1,
                duration: 1.1,
                ease: "power4.inOut",
              },
            )
            .fromTo(
              ".story > div:not(.section-index) > .eyebrow, .story > div:not(.section-index) > p, .story > div:not(.section-index) > a",
              { autoAlpha: 0, x: 36 },
              {
                autoAlpha: 1,
                x: 0,
                duration: 0.7,
                stagger: 0.1,
                ease: "power3.out",
              },
              "-=0.65",
            )
            .fromTo(
              ".story .section-index",
              { autoAlpha: 0, y: 30 },
              { autoAlpha: 1, y: 0, duration: 0.65 },
              "-=0.45",
            );

          if (desktop) {
            gsap.to(".hero-image img", {
              yPercent: 8,
              ease: "none",
              scrollTrigger: {
                trigger: ".hero",
                start: "top top",
                end: "bottom top",
                scrub: 0.8,
              },
            });
            gsap.to(".story > img", {
              yPercent: 9,
              ease: "none",
              scrollTrigger: {
                trigger: ".story",
                start: "top bottom",
                end: "bottom top",
                scrub: 0.8,
              },
            });

            const hero = pageRef.current?.querySelector<HTMLElement>(".hero");
            const heroImage =
              pageRef.current?.querySelector<HTMLElement>(".hero-image");
            if (hero && heroImage) {
              const moveX = gsap.quickTo(heroImage, "x", {
                duration: 0.7,
                ease: "power3.out",
              });
              const moveY = gsap.quickTo(heroImage, "y", {
                duration: 0.7,
                ease: "power3.out",
              });
              const onMove = (event: MouseEvent) => {
                const bounds = hero.getBoundingClientRect();
                moveX(
                  ((event.clientX - bounds.left) / bounds.width - 0.5) * 12,
                );
                moveY(
                  ((event.clientY - bounds.top) / bounds.height - 0.5) * 12,
                );
              };
              const onLeave = () => {
                moveX(0);
                moveY(0);
              };
              hero.addEventListener("mousemove", onMove);
              hero.addEventListener("mouseleave", onLeave);
              cleanups.push(() => {
                hero.removeEventListener("mousemove", onMove);
                hero.removeEventListener("mouseleave", onLeave);
              });
            }

            pageRef.current
              ?.querySelectorAll<HTMLElement>(
                ".collection-card, .promo-card, .product-card",
              )
              .forEach((card) => {
                const onEnter = () =>
                  gsap.to(card, {
                    y: -8,
                    scale: 1.025,
                    duration: 0.35,
                    ease: "power2.out",
                    overwrite: "auto",
                  });
                const onLeave = () =>
                  gsap.to(card, {
                    y: 0,
                    scale: 1,
                    duration: 0.55,
                    ease: "power3.out",
                    overwrite: "auto",
                  });
                card.addEventListener("mouseenter", onEnter);
                card.addEventListener("mouseleave", onLeave);
                cleanups.push(() => {
                  card.removeEventListener("mouseenter", onEnter);
                  card.removeEventListener("mouseleave", onLeave);
                });
              });
          } else {
            const rail =
              pageRef.current?.querySelector<HTMLElement>(".category-marquee");
            const track =
              pageRef.current?.querySelector<HTMLElement>(".category-nav");
            const group = track?.querySelector<HTMLElement>(".category-group");
            if (rail && track && group) {
              const travel = group.offsetWidth;
              if (travel > 0)
                gsap.fromTo(
                  track,
                  { x: 0 },
                  {
                    x: -travel,
                    duration: Math.max(travel / 42, 8),
                    repeat: -1,
                    ease: "none",
                  },
                );
            }
          }
        },
      );
    }, pageRef);

    return () => {
      cleanups.forEach((cleanup) => cleanup());
      media.revert();
      context.revert();
    };
  }, []);

  useLayoutEffect(() => {
    const section = showcaseRef.current;
    const items = showcaseItemsRef.current.filter(
      (item): item is HTMLAnchorElement => Boolean(item),
    );
    if (!section || !items.length) return;

    let frame = 0;
    const render = () => {
      frame = 0;
      const rect = section.getBoundingClientRect();
      const travel = Math.max(section.offsetHeight - window.innerHeight, 1);
      const progress = Math.min(1, Math.max(0, -rect.top / travel));
      const mobile = window.innerWidth <= 800;
      const radiusX = mobile
        ? Math.min(window.innerWidth * 0.36, 150)
        : Math.min(window.innerWidth * 0.36, 510);
      const radiusY = mobile ? 190 : Math.min(window.innerHeight * 0.31, 260);
      const revolveProgress = Math.min(1, Math.max(0, progress / 0.78));
      const clusterProgress = Math.min(
        1,
        Math.max(0, (progress - 0.78) / 0.22),
      );
      const easedCluster =
        clusterProgress * clusterProgress * (3 - 2 * clusterProgress);

      items.forEach((item, index) => {
        const arrivalStart = index * 0.055;
        const flightProgress = Math.min(
          1,
          Math.max(0, (progress - arrivalStart) / 0.14),
        );
        const easedFlight =
          flightProgress * flightProgress * (3 - 2 * flightProgress);
        const revealProgress =
          index === 0
            ? 1
            : Math.min(1, Math.max(0, (progress - arrivalStart) / 0.025));
        const angle =
          (index / items.length) * Math.PI * 2 -
          Math.PI / 2 +
          revolveProgress * Math.PI * 2.5;
        const orbitX = Math.cos(angle) * radiusX * easedFlight;
        const orbitY = Math.sin(angle) * radiusY * easedFlight;
        const clusterX =
          ((index % 3) - 1) * (mobile ? 74 : 128) + (index % 2 ? 12 : -12);
        const clusterY = (Math.floor(index / 3) - 1) * (mobile ? 88 : 120);
        const x = orbitX + (clusterX - orbitX) * easedCluster;
        const y = orbitY + (clusterY - orbitY) * easedCluster;
        const stackedRotation = (index - (items.length - 1) / 2) * 0.7;
        const orbitRotation = index % 2 ? 9 : -9;
        const rotation =
          stackedRotation +
          (orbitRotation - stackedRotation) * easedFlight +
          (((index % 3) - 1) * 5 - orbitRotation) * easedCluster;
        const stackedScale = 1 - (items.length - 1 - index) * 0.012;
        const orbitScale = stackedScale + (1 - stackedScale) * easedFlight;
        const scale =
          orbitScale + ((index % 2 ? 0.93 : 1.07) - orbitScale) * easedCluster;
        item.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${rotation}deg) scale(${scale})`;
        item.style.opacity = String(revealProgress);
      });
    };
    const queueRender = () => {
      if (!frame) frame = requestAnimationFrame(render);
    };

    render();
    window.addEventListener("scroll", queueRender, { passive: true });
    window.addEventListener("resize", queueRender);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", queueRender);
      window.removeEventListener("resize", queueRender);
    };
  }, [showcaseProducts.length]);

  useLayoutEffect(() => {
    const rails = curvedRailRefs.current
      .map((section, railIndex) => ({
        section,
        scroller:
          section?.querySelector<HTMLElement>(".curved-rail-cards") ?? null,
        cards:
          curvedCardsRefs.current[railIndex]?.filter(
            (card): card is HTMLAnchorElement => Boolean(card),
          ) ?? [],
      }))
      .filter(
        (
          rail,
        ): rail is {
          section: HTMLElement;
          scroller: HTMLElement;
          cards: HTMLAnchorElement[];
        } => Boolean(rail.section && rail.scroller && rail.cards.length),
      );
    if (!rails.length) return;

    let frame = 0;
    const render = () => {
      frame = 0;
      rails.forEach(({ scroller, cards }) => {
        const mobile = window.innerWidth <= 800;
        const scrollerWidth = scroller.clientWidth;

        cards.forEach((card) => {
          const cardCenter =
            card.offsetLeft - scroller.scrollLeft + card.offsetWidth / 2;
          const normalizedX = Math.min(
            1,
            Math.max(
              -1,
              (cardCenter - scrollerWidth / 2) / (scrollerWidth * 0.55),
            ),
          );
          const curveDepth = mobile ? 52 : 92;
          const y = (1 - normalizedX * normalizedX) * curveDepth;
          const rotation = normalizedX * 13;
          card.style.transform = `translate3d(0, ${y}px, 0) rotate(${rotation}deg)`;
        });
      });
    };
    const queueRender = () => {
      if (!frame) frame = requestAnimationFrame(render);
    };

    render();
    rails.forEach(({ scroller }) =>
      scroller.addEventListener("scroll", queueRender, { passive: true }),
    );
    window.addEventListener("resize", queueRender);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      rails.forEach(({ scroller }) =>
        scroller.removeEventListener("scroll", queueRender),
      );
      window.removeEventListener("resize", queueRender);
    };
  }, [curvedProductSlides]);

  useEffect(() => {
    const cards =
      pageRef.current?.querySelectorAll<HTMLElement>(".product-card");
    if (
      !cards?.length ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const animationContext = gsap.context(() => {
      cards.forEach((card, index) => {
        const image = card.querySelector<HTMLElement>(".product-image");
        const imageElement = image?.querySelector("img");
        const details = card.querySelectorAll(
          ".product-info h3, .product-info p, .product-info strong, .add-button",
        );
        if (!image || !imageElement) return;
        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: card,
            start: "top 90%",
            end: "bottom 12%",
            toggleActions: "restart none restart reverse",
          },
        });

        timeline
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
    return () => {
      animationContext.revert();
    };
  }, [shownProducts]);

  const addToBag = (product: HomeProduct) => {
    addToCart({
      name: product.name,
      price: product.price,
      img: product.img,
      size: "M",
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
          <h1
            className="hero-shimmer"
            aria-label="Style Everyday with Elegance"
          >
            <span>{animatedLetters("Style Everyday", "style")}</span>
            <br aria-hidden="true" />
            <span>
              {animatedLetters("with ", "with")}
              <i>{animatedLetters("Elegance", "elegance")}</i>
            </span>
          </h1>
          <p>
            Discover curated collections that celebrate your style and every
            special moment.
          </p>
          <a href="#shop" className="primary">
            Explore Collection <span>→</span>
          </a>
          <div className="dots">
            <b />○ ○
          </div>
        </div>
        <div className="hero-image">
          <img
            src="/hero.jpg"
            alt="Rose pink tailored co-ord in the Carnival of Clothes boutique"
          />
          <div className="hero-stamp">
            CARNIVAL
            <br />
            OF CLOTHES
          </div>
        </div>
      </section>

      <section className="collections" id="collections">
        <div className="section-index">01</div>
        <div>
          <span className="eyebrow">OUR COLLECTION</span>
          <h2
            className="letter-heading"
            aria-label="Curated Styles For Every You"
          >
            {animatedHeadingWords("Curated Styles", "collections")}{" "}
            <i>{animatedHeadingWords("For Every You", "collections-accent")}</i>
          </h2>
          <div className="collection-grid">
            {[
              [
                "Party Wear",
                "/party-wear-red-dress.png",
                "/shop?category=Party%20Wear",
              ],
              [
                "Bottom Wear",
                "/bottom-wear-category.png",
                "/shop?category=Bottom%20Wear",
              ],
              [
                "Top Wear",
                "/top-wear-pink-floral.png",
                "/shop?category=Everyday%20Essentials",
              ],
              ["Korean", "/korean-suit-style.png", "/shop?category=Korean"],
              ["Indian", "/indian-suits.png", "/shop?category=Indian"],
              [
                "Accessories",
                "/accessories-gold-jewelry.jpg",
                "/shop?category=Accessories",
              ],
            ].map(([x, img, href]) => (
              <a className="collection-card" href={href} key={x}>
                <img src={img} alt={x} />
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
                <img
                  src="/special-offers-deals.jpg"
                  alt="Special Offers & Deals"
                />
              </div>
              <strong className="uppercase">Offers</strong>
            </a>
          </div>
        </div>
      </section>

      {curvedProductSlides.map((slide, slideIndex) => (
        <section
          ref={(section) => {
            curvedRailRefs.current[slideIndex] = section;
          }}
          className={`curved-product-rail ${slide.id}`}
          aria-label={`${slide.label} product slider`}
          key={slide.id}
        >
          <div className="curved-rail-stage">
            <div className="curved-rail-copy">
              <h2>
                {slide.label === "BEST SELLERS"
                  ? "Best Sellers"
                  : "New Arrivals"}
              </h2>
            </div>
            <a
              className="curved-shop-all"
              href="/shop"
              aria-label={`Shop all ${slide.label.toLowerCase()}`}
            >
              Shop all <span>→</span>
            </a>
            <div className="curved-rail-cards">
              {slide.products.map((product, index) => (
                <a
                  ref={(card) => {
                    if (!curvedCardsRefs.current[slideIndex])
                      curvedCardsRefs.current[slideIndex] = [];
                    curvedCardsRefs.current[slideIndex][index] = card;
                  }}
                  className="curved-product-card"
                  href={product.href}
                  key={`${slide.id}-${product.name}`}
                  aria-label={`View ${product.name}`}
                >
                  <img src={product.heroImage} alt={product.name} />
                  <span>
                    <b>{product.name}</b>
                    <small>{product.price}</small>
                  </span>
                </a>
              ))}
            </div>
          </div>
        </section>
      ))}

      <section className="category-strip">
        <div className="section-heading">
          <span>✦</span>
          <h2 className="letter-heading" aria-label="Shop by Category">
            {animatedHeadingWords("Shop by Category", "category")}
          </h2>
          <span>✦</span>
        </div>
        <div className="category-marquee">
          <div className="category-nav">
            <div className="category-group">
              {[
                "All",
                "Everyday",
                "Bottom Wear",
                "Dresses",
                "Co-ords",
                "Party Wear",
              ].map((c) => (
                <button
                  className={activeCategory === c ? "active" : ""}
                  key={c}
                  onClick={() => setActiveCategory(c)}
                >
                  {c}
                </button>
              ))}
            </div>
            <div className="category-group" aria-hidden="true">
              {[
                "All",
                "Everyday",
                "Bottom Wear",
                "Dresses",
                "Co-ords",
                "Party Wear",
              ].map((c) => (
                <button
                  className={activeCategory === c ? "active" : ""}
                  tabIndex={-1}
                  key={c}
                  onClick={() => setActiveCategory(c)}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>
        <a className="category-all" href="/shop">
          Explore all categories&nbsp; →
        </a>
      </section>

      <section className="shop" id="shop">
        <div className="shop-heading">
          <div>
            <span className="eyebrow">THE CARNIVAL EDIT</span>
            <h2 className="letter-heading" aria-label="Pieces to fall for">
              {animatedHeadingWords("Pieces to", "shop")}{" "}
              <i>{animatedHeadingWords("fall for", "shop-accent")}</i>
            </h2>
          </div>
          <a className="text-link" href="/shop">
            Shop all&nbsp; →
          </a>
        </div>
        <div className="product-grid">
          {shownProducts.map((p) => (
            <article className="product-card" key={p.name}>
              <a href={p.href}>
                <div className="product-image">
                  {p.badge && <em>{p.badge}</em>}
                  <img
                    src={p.img}
                    alt={p.name}
                    style={{ objectPosition: `${p.position || "50%"} center` }}
                  />
                  <button
                    aria-label="Add to wishlist"
                    onClick={(e) => e.preventDefault()}
                  >
                    ♡
                  </button>
                </div>
                <div className="product-info">
                  <div>
                    <h3>{p.name}</h3>
                    <p>{p.type}</p>
                  </div>
                  <strong>{p.price}</strong>
                </div>
              </a>
              <button className="add-button" onClick={() => addToBag(p)}>
                Add to bag <span>+</span>
              </button>
            </article>
          ))}
        </div>
      </section>

      <section
        ref={showcaseRef}
        className="motion-showcase"
        aria-label="Scroll through the Carnival product showcase"
      >
        <div className="showcase-stage">
          <div className="showcase-center">
            <h2>
              Every piece,
              <br />
              <i>a new story</i>
            </h2>
            <p>Scroll to explore</p>
          </div>
          {showcaseProducts.map((product, index) => (
            <a
              ref={(item) => {
                showcaseItemsRef.current[index] = item;
              }}
              className="orbit-product"
              href={product.href}
              aria-label={product.name}
              key={`showcase-${product.name}`}
              style={{ zIndex: 10 + index }}
            >
              <img src={product.heroImage} alt="" />
            </a>
          ))}
        </div>
      </section>

      <section className="story" id="story">
        <img src="/collection.jpg" alt="Our welcoming store" />
        <div>
          <span className="eyebrow">OUR STORY</span>
          <h2
            className="letter-heading"
            aria-label="Where Tradition Meets Trend"
          >
            {animatedHeadingWords("Where Tradition", "story")}{" "}
            <i>{animatedHeadingWords("Meets Trend", "story-accent")}</i>
          </h2>
          <p>
            At Carnival of Clothes by Nandini, we blend timeless tradition with
            modern elegance. Each piece is handpicked to bring you quality,
            grace, and unmatched style.
          </p>
          <a className="text-link" href="#contact">
            Learn more about us&nbsp; →
          </a>
        </div>
        <div className="section-index">02</div>
      </section>

      <section className="perks">
        <div>
          <span>♢</span>
          <b>Premium quality</b>
          <small>Finest fabrics, meticulous craftsmanship.</small>
        </div>
        <div>
          <span>♧</span>
          <b>Curated collections</b>
          <small>Handpicked styles for every occasion.</small>
        </div>
        <div>
          <span>♙</span>
          <b>Personalized service</b>
          <small>We style you with care and attention.</small>
        </div>
        <div>
          <span>♧</span>
          <b>Worldwide shipping</b>
          <small>Delivering elegance to your doorstep.</small>
        </div>
      </section>

      <footer id="contact">
        <div>
          <a
            className="logo"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
            }}
          >
            Carnival of Clothes <Signature />
          </a>
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
          <div className="email">
            <input placeholder="Enter your email" />
            <button>→</button>
          </div>
        </div>
        <div className="copyright">
          © 2024 Carnival of Clothes by Nandini. All rights reserved.
        </div>
      </footer>

      {toast && <div className="toast">♡ {toast}</div>}
    </main>
  );
}
