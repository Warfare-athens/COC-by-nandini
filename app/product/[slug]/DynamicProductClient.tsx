"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Header from "@/app/components/Header";
import { addToCart } from "@/app/cart-helper";
import { showGlobalStatus } from "@/app/global-status";
import { StockRequestForm } from "@/app/components/EngagementForms";
import UniversalSelect from "@/app/components/UniversalSelect";
import StickyMobileBuyBar from "@/app/components/StickyMobileBuyBar";
import { getColorSwatch, extractProductColors, filterImagesForColor } from "@/lib/colors";

type Variant = {
  id: string;
  size: string | null;
  color?: string | null;
  title: string;
  inventory_quantity: number;
  is_active: boolean;
};
type Image = {
  id: string;
  url: string;
  alt_text: string | null;
  is_hero: boolean;
  sort_order: number;
};
type Review = {
  id: string;
  customer_name: string;
  rating: number;
  title: string | null;
  body: string;
  image_url: string | null;
  is_verified: boolean;
  created_at: string;
};
type Product = {
  id: string;
  name: string;
  short_description: string | null;
  description: string | null;
  hero_image_url: string;
  price_inr: number;
  compare_at_price_inr: number | null;
  material: string | null;
  care_instructions: string | null;
  style_notes: string | null;
  is_new_arrival: boolean;
  is_best_seller: boolean;
  tags?: string[] | null;
  product_variants: Variant[];
  product_images: Image[];
};

export default function DynamicProductClient({
  product,
  reviews,
}: {
  product: Product;
  reviews: Review[];
}) {
  const router = useRouter();
  const availableColors = extractProductColors(product.tags, product.product_variants);
  const [selectedColor, setSelectedColor] = useState(availableColors[0] || "");
  const variants = product.product_variants.filter(
    (variant) => variant.is_active,
  );
  const available = variants.filter(
    (variant) => variant.inventory_quantity > 0,
  );
  const unavailableSizes = variants.filter(variant=>variant.inventory_quantity<=0).map(variant=>variant.size||variant.title);
  const [size, setSize] = useState(available[0]?.size || available[0]?.title || "");
  const [added, setAdded] = useState(false);
  const [open, setOpen] = useState("Product Details");
  const [faq, setFaq] = useState("");
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewBusy, setReviewBusy] = useState(false);
  const [reviewPhoto, setReviewPhoto] = useState<{ url: string; name: string } | null>(null);
  const [reviewImageBusy, setReviewImageBusy] = useState(false);
  const mainBuyButtonRef = useRef<HTMLButtonElement>(null);
  const [stickyVisible, setStickyVisible] = useState(false);

  useEffect(() => {
    const target = mainBuyButtonRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Show sticky bar when user has scrolled past the main buy button
        setStickyVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0);
      },
      { threshold: 0 }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, []);
  const allImages = [...product.product_images].sort(
    (a, b) => a.sort_order - b.sort_order,
  );
  const fallbackGallery = allImages.length
    ? allImages
    : [
        {
          id: "hero",
          url: product.hero_image_url,
          alt_text: product.name,
          is_hero: true,
          sort_order: 0,
        },
      ];

  const { visible: gallery } = filterImagesForColor(fallbackGallery, selectedColor);

  const [mainImage, setMainImage] = useState(() => {
    const initial = filterImagesForColor(fallbackGallery, availableColors[0] || "");
    return initial.dedicated[0]?.url || product.hero_image_url || initial.visible[0]?.url || "";
  });

  useEffect(() => {
    const { visible, dedicated: colorDedicated } = filterImagesForColor(fallbackGallery, selectedColor);
    if (colorDedicated.length > 0) {
      setMainImage(colorDedicated[0].url);
    } else if (visible.length > 0) {
      setMainImage(visible[0].url);
    }
  }, [selectedColor]);
  const words = product.name.split(" ");
  const splitAt = Math.max(1, Math.ceil(words.length / 2));
  const titleLead = words.slice(0, splitAt).join(" ");
  const titleAccent = words.slice(splitAt).join(" ");
  const selected = available.find(
    (variant) =>
      (variant.size || variant.title).toUpperCase() === size.toUpperCase() ||
      (size.toUpperCase() === "XXL" && (variant.size || variant.title).toUpperCase() === "2XL"),
  );
  const canBuy = available.length > 0;
  const discount =
    product.compare_at_price_inr &&
    product.compare_at_price_inr > product.price_inr
      ? Math.round((1 - product.price_inr / product.compare_at_price_inr) * 100)
      : 0;
  const rows = [
    ["Product Details", product.description],
    [
      "Fabric & Care",
      [product.material, product.care_instructions].filter(Boolean).join(" · "),
    ],
    ["Style Notes", product.style_notes],
    [
      "Shipping & Returns",
      "Dispatch in 2–3 business days. Easy returns and exchanges within 7 days.",
    ],
  ].filter((row): row is [string, string] => Boolean(row[1]));
  const faqs = [
    [
      "Is this product true to size?",
      "Choose your regular size for the intended fit. If you are between sizes, select the larger size.",
    ],
    [
      "What material is it made from?",
      product.material ||
        "Material details are listed in the product information above.",
    ],
    [
      "How should I care for it?",
      product.care_instructions ||
        "Follow the care label attached to the garment.",
    ],
    [
      "When will it arrive?",
      "Orders dispatch within 2–3 business days and generally arrive within 4–7 business days across India.",
    ],
    [
      "Can I return or exchange it?",
      "Eligible unworn items can be returned or exchanged within 7 days of delivery.",
    ],
  ];
  const averageRating = reviews.length
    ? reviews.reduce((sum, review) => sum + Number(review.rating), 0) /
      reviews.length
    : 0;

  const uploadReviewPhoto = async (file: File) => {
    setReviewPhoto(null);
    if (!file.size || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      return showGlobalStatus("Choose a JPG, PNG or WebP image.", "error");
    }
    if (file.size > 8_000_000) return showGlobalStatus("Choose an image smaller than 8MB.", "error");
    setReviewImageBusy(true);
    try {
      const form = new FormData();
      form.set("file", file);
      const response = await fetch("/api/reviews/upload", { method: "POST", body: form });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Photo upload failed.");
      setReviewPhoto({ url: payload.url, name: file.name });
      showGlobalStatus("Photo uploaded", "success");
    } catch (error) {
      showGlobalStatus(error instanceof Error ? error.message : "Photo upload failed.", "error");
    } finally {
      setReviewImageBusy(false);
    }
  };

  const submitReview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (reviewBusy || reviewImageBusy) return;
    const data = new FormData(event.currentTarget);
    const body = String(data.get("body") || "").trim();
    if (body.split(/\s+/).length > 50) return showGlobalStatus("Review must be 50 words or fewer.", "error");
    setReviewBusy(true);
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          customerName: data.get("customerName"),
          rating: data.get("rating"),
          body,
          imageUrl: reviewPhoto?.url,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Unable to submit review.");
      setReviewPhoto(null);
      setReviewOpen(false);
      showGlobalStatus("Review published", "success");
      router.refresh();
    } catch (error) {
      showGlobalStatus(error instanceof Error ? error.message : "Unable to submit review.", "error");
    } finally {
      setReviewBusy(false);
    }
  };

  const add = () => {
    if (!available.length) {
      showGlobalStatus("This item is currently out of stock", "error");
      return;
    }
    if (!size) {
      showGlobalStatus("Please select a size first", "info");
      document.querySelector(".sizes")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    addToCart({
      productId: product.id,
      name: product.name,
      price: `₹${Number(product.price_inr).toLocaleString("en-IN")}`,
      img: mainImage,
      size,
      color: selectedColor || undefined,
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  };

  const buyNow = () => {
    if (!available.length) {
      showGlobalStatus("This item is currently out of stock", "error");
      return;
    }
    if (!size) {
      showGlobalStatus("Please select a size first", "info");
      document.querySelector(".sizes")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    addToCart({
      productId: product.id,
      name: product.name,
      price: `₹${Number(product.price_inr).toLocaleString("en-IN")}`,
      img: mainImage,
      size,
      color: selectedColor || undefined,
    });
    router.push("/checkout");
  };

  const standardSizeOrder = [
    "XS",
    "S",
    "M",
    "L",
    "XL",
    "XXL",
    "2XL",
    "3XL",
    "4XL",
    "Free Size",
    "One Size",
  ];

  // ONLY show the sizes that are available in this item (in stock)
  const displaySizeLabels = Array.from(
    new Set(
      available
        .map((v) => (v.size || v.title || "").trim())
        .filter(Boolean),
    ),
  ).sort((a, b) => {
    const idxA = standardSizeOrder.indexOf(a.toUpperCase());
    const idxB = standardSizeOrder.indexOf(b.toUpperCase());
    return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
  });

  const allSizesList = displaySizeLabels.map((lbl) => ({
    size: lbl,
    available: true,
  }));

  useEffect(() => {
    if (!size && displaySizeLabels.length === 1) {
      setSize(displaySizeLabels[0]);
    }
  }, [displaySizeLabels, size]);

  return (
    <main data-commerce-product={product.id}>
      <Header />
      <div className="breadcrumbs">
        <a href="/">Home</a>
        <span>›</span>
        <a href="/shop">Collections</a>
        <span>›</span>
        <b>{product.name}</b>
      </div>
      <section className="product-detail">
        <div className="detail-visual">
          <div className="detail-main coord-main">
            <img src={mainImage} alt={product.name} />
          </div>
          {gallery.length > 1 && (
            <div className="detail-thumbs">
              {gallery.map((image) => (
                <button
                  className={mainImage === image.url ? "chosen" : ""}
                  type="button"
                  onClick={() => setMainImage(image.url)}
                  key={image.id}
                >
                  <img src={image.url} alt={image.alt_text || product.name} />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="detail-copy">
          {(product.is_new_arrival || product.is_best_seller) && (
            <span className="badge-label">
              {product.is_best_seller ? "BEST SELLER" : "NEW ARRIVAL"}
            </span>
          )}
          <span className="eyebrow">CARNIVAL EDIT</span>
          <h1>
            {titleLead}
            {titleAccent && (
              <>
                <br />
                <i>{titleAccent}</i>
              </>
            )}
          </h1>
          {product.short_description && (
            <p className="subcopy">{product.short_description}</p>
          )}
          <div className="price">
            ₹{Number(product.price_inr).toLocaleString("en-IN")}{" "}
            {product.compare_at_price_inr && (
              <del>
                ₹{Number(product.compare_at_price_inr).toLocaleString("en-IN")}
              </del>
            )}{" "}
            {discount > 0 && <small>{discount}% OFF</small>}
          </div>
          <p className="tax">Inclusive of all taxes</p>
          <hr />
          {availableColors.length > 0 && (() => {
            const activeColorName = selectedColor || availableColors[0] || "";
            const activeSwatch = getColorSwatch(activeColorName);
            return (
              <div className="product-color-group">
                <div className="select-head color-select-head">
                  <div className="color-header-meta">
                    <b>Colour:</b>
                    <span className="color-active-chip">
                      <span
                        className="color-active-chip-dot"
                        style={{
                          background: activeSwatch.bg,
                          border: activeSwatch.border ? `1px solid ${activeSwatch.border}` : "1px solid rgba(0,0,0,0.15)",
                        }}
                      />
                      <span className="color-active-chip-name">{activeColorName}</span>
                    </span>
                  </div>
                  {availableColors.length > 1 && (
                    <span className="color-variants-count">{availableColors.length} Shades</span>
                  )}
                </div>
                <div className="colors-flex">
                  {availableColors.map((colorName) => {
                    const swatch = getColorSwatch(colorName);
                    const isChosen = activeColorName.toLowerCase() === colorName.toLowerCase();
                    return (
                      <button
                        type="button"
                        key={colorName}
                        className={`color-swatch-btn ${isChosen ? "chosen" : ""}`}
                        onClick={() => setSelectedColor(colorName)}
                        aria-label={`Select colour ${colorName}`}
                        title={colorName}
                      >
                        <span
                          className="color-swatch-disc"
                          style={{
                            background: swatch.bg,
                            border: swatch.border ? `1px solid ${swatch.border}` : "1px solid rgba(0,0,0,0.12)",
                          }}
                        >
                          {isChosen && (
                            <svg
                              className="color-swatch-check"
                              viewBox="0 0 12 12"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                              aria-hidden="true"
                            >
                              <path
                                d="M2.5 6.2L4.8 8.5L9.5 3.5"
                                stroke={swatch.isLight ? "#2a1c18" : "#ffffff"}
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          )}
                        </span>
                        <span className="color-swatch-tooltip" role="tooltip">
                          {colorName}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })()}
          {displaySizeLabels.length > 0 ? (
            <>
              <div className="select-head">
                <b>Select size</b>
                <a href="/size-guide">Size Guide</a>
              </div>
              <div className="sizes">
                {displaySizeLabels.map((label) => (
                  <button
                    type="button"
                    className={size.toUpperCase() === label.toUpperCase() ? "chosen" : ""}
                    onClick={() => setSize(label)}
                    key={label}
                    aria-label={`Size ${label}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <p className="fit-note">
              Stock is currently unavailable for this item.
            </p>
          )}
          {unavailableSizes.length > 0 && (
            <StockRequestForm productId={product.id} sizes={unavailableSizes} />
          )}
          <button
            ref={mainBuyButtonRef}
            className="detail-add"
            type="button"
            onClick={add} data-commerce-action="add_to_cart"
            disabled={!canBuy}
          >
            {!available.length
              ? "Out of stock"
              : !size
                ? "Select a size"
                : added
                  ? "Added to bag ✓"
                  : "Add to bag"}
          </button>
          <button
            className="detail-buy"
            type="button"
            onClick={buyNow} data-commerce-action="buy_now"
            disabled={!canBuy}
          >
            Buy now
          </button>
          <div className="info-accordions">
            {rows.map(([title, text]) => (
              <div
                className={open === title ? "info-row open" : "info-row"}
                key={title}
              >
                <button
                  type="button"
                  onClick={() => setOpen(open === title ? "" : title)}
                >
                  <span>{title}</span>
                  <b>⌄</b>
                </button>
                {open === title && <p>{text}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="reviews" id="reviews">
        <div className="reviews-head">
          <div>
            <span className="eyebrow">CUSTOMER LOVE</span>
            <h2>
              Reviews <i>({reviews.length})</i>
            </h2>
          </div>
          <button
            className="review-toggle" data-commerce-action={reviewOpen ? undefined : "write_review"}
            type="button"
            aria-expanded={reviewOpen}
            disabled={reviewBusy || reviewImageBusy}
            onClick={() => {
              setReviewPhoto(null);
              setReviewOpen(!reviewOpen);
            }}
          >{reviewOpen ? "Close review form" : "Write a review"}</button>
        </div>
        {reviewOpen && (
          <form className="review-form" onSubmit={submitReview}>
            <div className="review-form-intro">
              <span className="eyebrow">YOUR EXPERIENCE MATTERS</span>
              <h3>Share your style story</h3>
              <p>Tell us how it fits, feels, or made your day. Your review helps other shoppers choose with confidence.</p>
            </div>
            <div className="review-form-grid">
              <label className="review-field">
                <span>Your name</span>
                <input name="customerName" placeholder="Enter your name" autoComplete="name" minLength={2} maxLength={100} required />
              </label>
              <fieldset className="review-field review-rating-field">
                <legend>Rating</legend>
                <div className="review-rating-picker">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <label className="review-star-option" key={value}>
                      <input type="radio" name="rating" value={value} defaultChecked={value === 5} required />
                      <span aria-hidden="true">★</span><em>{value} {value === 1 ? "star" : "stars"}</em>
                    </label>
                  ))}
                </div>
              </fieldset>
              <div className="review-field review-field-wide">
                <span>Photo <em>optional · JPG, PNG or WebP up to 8MB</em></span>
                <div className={`review-photo-picker ${reviewPhoto ? "has-photo" : ""}`}>
                  <input
                    id="review-photo-upload"
                    className="review-photo-input"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      event.target.value = "";
                      if (file) void uploadReviewPhoto(file);
                    }}
                    disabled={reviewBusy || reviewImageBusy}
                  />
                  <label className="review-photo-dropzone" htmlFor="review-photo-upload">
                    {reviewPhoto ? <img className="review-photo-preview" src={reviewPhoto.url} alt="Selected review photo" /> : <span className="review-photo-icon" aria-hidden="true">＋</span>}
                    <span className="review-photo-copy">
                      <strong>{reviewImageBusy ? "Uploading photo…" : reviewPhoto ? "Replace photo" : "Choose a photo"}</strong>
                      <small>{reviewPhoto?.name || "Tap to browse from your device"}</small>
                    </span>
                  </label>
                  {reviewPhoto && <small className="review-upload-status is-ready">Photo uploaded and ready to submit.</small>}
                </div>
              </div>
              <label className="review-field review-field-wide">
                <span>Your review <em>50 words max</em></span>
                <textarea name="body" placeholder="What did you love about it?" minLength={3} maxLength={2000} required />
              </label>
            </div>
            <div className="review-form-foot">
              <small>Your review will appear after submission.</small>
              <button className="review-submit" disabled={reviewBusy || reviewImageBusy}>{reviewBusy ? "Submitting…" : reviewImageBusy ? "Uploading…" : "Submit review"}</button>
            </div>
          </form>
        )}
        {reviews.length ? (
          <>
            <div className="review-summary">
              <div className="score">
                {averageRating.toFixed(1)}
                <strong>
                  {"★".repeat(Math.round(averageRating))}
                  {"☆".repeat(5 - Math.round(averageRating))}
                </strong>
                <small>({reviews.length} reviews)</small>
              </div>
            </div>
            <div className="product-review-list">
              {reviews.map((review) => (
                <article className="review-card" key={review.id}>
                  <div className="review-avatar">
                    {review.customer_name
                      .split(" ")
                      .map((part) => part[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div>
                    <b>{review.customer_name}</b>
                    {review.is_verified && <span>Verified Buyer</span>}
                    <small>
                      {new Date(review.created_at).toLocaleDateString("en-IN")}
                    </small>
                    <div className="review-stars">
                      {"★".repeat(review.rating)}
                      {"☆".repeat(5 - review.rating)}
                    </div>
                    {review.title && <strong>{review.title}</strong>}
                    <p>{review.body}</p>
                  </div>
                  {review.image_url && (
                    <img src={review.image_url} alt="Customer review" />
                  )}
                </article>
              ))}
            </div>
          </>
        ) : (
          <div className="review-empty">
            <span>☆</span>
            <h3>No reviews yet</h3>
            <p>Reviews from verified customers will appear here.</p>
          </div>
        )}
      </section>
      <section className="faq">
        <div className="faq-heading">
          <span className="eyebrow">NEED TO KNOW</span>
          <h2>
            Frequently asked <i>questions</i>
          </h2>
        </div>
        <div className="faq-list">
          {faqs.map(([question, answer]) => (
            <div
              className={faq === question ? "faq-item open" : "faq-item"}
              key={question}
            >
              <button
                type="button"
                onClick={() => setFaq(faq === question ? "" : question)}
              >
                <span>{question}</span>
                <b>{faq === question ? "−" : "+"}</b>
              </button>
              {faq === question && <p>{answer}</p>}
            </div>
          ))}
        </div>
      </section>
      <StickyMobileBuyBar
        product={product}
        sizes={allSizesList}
        selectedSize={size}
        onSelectSize={(s) => setSize(s)}
        onAddToCart={add}
        onBuyNow={buyNow}
        added={added}
        canBuy={canBuy}
        visible={stickyVisible}
      />
    </main>
  );
}
