"use client";

import { useState } from "react";
import Header from "@/app/components/Header";
import { addToCart } from "@/app/cart-helper";

type Variant = {
  id: string;
  size: string | null;
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
  const variants = product.product_variants.filter(
    (variant) => variant.is_active,
  );
  const available = variants.filter(
    (variant) => variant.inventory_quantity > 0,
  );
  const [size, setSize] = useState(available[0]?.size || "");
  const [added, setAdded] = useState(false);
  const [open, setOpen] = useState("Product Details");
  const [faq, setFaq] = useState("");
  const images = [...product.product_images].sort(
    (a, b) => a.sort_order - b.sort_order,
  );
  const gallery = images.length
    ? images
    : [
        {
          id: "hero",
          url: product.hero_image_url,
          alt_text: product.name,
          is_hero: true,
          sort_order: 0,
        },
      ];
  const [mainImage, setMainImage] = useState(
    product.hero_image_url || gallery[0].url,
  );
  const words = product.name.split(" ");
  const splitAt = Math.max(1, Math.ceil(words.length / 2));
  const titleLead = words.slice(0, splitAt).join(" ");
  const titleAccent = words.slice(splitAt).join(" ");
  const selected = available.find(
    (variant) => (variant.size || variant.title) === size,
  );
  const canBuy = Boolean(selected);
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

  const add = () => {
    if (!canBuy) return;
    addToCart({
      name: product.name,
      price: `₹${Number(product.price_inr).toLocaleString("en-IN")}`,
      img: mainImage,
      size,
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  };

  return (
    <main>
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
          <div className="select-head">
            <b>Select size</b>
            <a>Size Guide</a>
          </div>
          <div className="sizes">
            {["XS", "S", "M", "L", "XL", "XXL"].map((label) => {
              const variant = variants.find(
                (item) => (item.size || item.title).toUpperCase() === label,
              );
              const inStock = Boolean(variant && variant.inventory_quantity > 0);
              return (
                <button
                  type="button"
                  disabled={!inStock}
                  className={`${size === label ? "chosen" : ""} ${!inStock ? "unavailable" : ""}`}
                  onClick={() => setSize(label)}
                  key={label}
                  aria-label={`${label}${inStock ? "" : " unavailable"}`}
                >
                  {label}
                </button>
              );
            })}
          </div>
          {!available.length && (
            <p className="fit-note">
              Stock is currently unavailable for every size.
            </p>
          )}
          <button
            className="detail-add"
            type="button"
            onClick={add}
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
            onClick={add}
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
      <section className="reviews">
        <div className="reviews-head">
          <div>
            <span className="eyebrow">CUSTOMER LOVE</span>
            <h2>
              Reviews <i>({reviews.length})</i>
            </h2>
          </div>
        </div>
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
    </main>
  );
}
