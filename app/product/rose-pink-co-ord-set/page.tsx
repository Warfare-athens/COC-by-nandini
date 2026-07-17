"use client";

import { useState } from "react";
import Header from "../../components/Header";
import { addToCart } from "../../cart-helper";

export default function CoordSetPage() {
  const [size, setSize] = useState("M");
  const [added, setAdded] = useState(false);
  const [open, setOpen] = useState("Size & Fit");
  const [faq, setFaq] = useState("");

  const rows = [
    ["Size & Fit", "Relaxed tailored fit with a high-waisted wide-leg trouser. Model is 5'7” and wears size S."],
    ["Fabric & Care", "Smooth premium crepe with a satin camisole. Dry clean only."],
    ["Shipping & Returns", "Dispatch in 2–3 business days. Easy returns and exchanges within 7 days."],
    ["Customize Your Outfit", "Our stylists can help with length, fit and occasion styling."]
  ];

  const faqs = [
    ["What comes with this co-ord set?", "The set includes a blush pink tailored blazer, matching wide-leg trousers and a satin camisole."],
    ["Is the fit true to size?", "Yes, it follows a relaxed tailored fit. Choose your usual size; size up for an oversized look."],
    ["How should I care for it?", "Dry clean only. Store the blazer on a hanger and fold trousers neatly."],
    ["When will it arrive?", "Orders ship within 2–3 business days and arrive in 4–7 business days across India."]
  ];

  const handleAddToBag = () => {
    addToCart({
      name: "Rose Pink Blazer Co-ord",
      price: "₹4,999",
      img: "/rose-pink-coord.png",
      size: size
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2200);
  };

  return (
    <main>
      <Header />
      
      <div className="breadcrumbs">
        <a href="/">Home</a>
        <span>›</span>
        <a href="/shop">Collections</a>
        <span>›</span>
        <b>Rose Pink Blazer Co-ord Set</b>
      </div>

      <section className="product-detail">
        <div className="detail-visual">
          <div className="detail-main coord-main">
            <img src="/rose-pink-coord.png" alt="Rose Pink Blazer Co-ord Set" />
          </div>
          <div className="detail-thumbs">
            <img src="/rose-pink-coord.png" alt="Blazer detail" />
            <img src="/rose-pink-coord.png" alt="Trouser detail" />
            <img src="/rose-pink-coord.png" alt="Co-ord styling" />
          </div>
        </div>
        <div className="detail-copy">
          <span className="badge-label">NEW ARRIVAL</span>
          <span className="eyebrow">CO-ORD SETS · CARNIVAL EDIT</span>
          <h1>Rose Pink<br /><i>Blazer Co-ord</i></h1>
          <p className="subcopy">Tailored blush pink blazer, camisole and wide-leg trousers</p>
          <div className="price">₹4,999 <del>₹6,499</del> <small>23% OFF</small></div>
          <p className="tax">Inclusive of all taxes</p>
          <div className="rating">★★★★★ <span>4.7&nbsp; (48 reviews)</span></div>
          <hr />
          <div className="select-head"><b>Select size</b><a>Size Guide</a></div>
          <div className="sizes">
            {["XS", "S", "M", "L", "XL", "XXL"].map(s => (
              <button className={size === s ? "chosen" : ""} onClick={() => setSize(s)} key={s}>{s}</button>
            ))}
          </div>
          <p className="fit-note">ⓘ Model is 5&apos;7” tall and is wearing size S</p>
          <button className="detail-add" onClick={handleAddToBag}>
            {added ? "Added to bag ✓" : "Add to bag"}
          </button>
          <button className="detail-buy" onClick={handleAddToBag}>Buy now</button>
          
          <div className="info-accordions">
            {rows.map(([title, text]) => (
              <div className={open === title ? "info-row open" : "info-row"} key={title}>
                <button onClick={() => setOpen(open === title ? "" : title)}>
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
            <h2>Reviews <i>(48)</i></h2>
          </div>
          <a>View all&nbsp; →</a>
        </div>
        <div className="review-summary">
          <div className="score">4.7<strong>★★★★★</strong><small>(48 reviews)</small></div>
          <div className="bars">
            <div><span>5 ★</span><i><b style={{ width: "88%" }} /></i><em>88%</em></div>
            <div><span>4 ★</span><i><b style={{ width: "8%" }} /></i><em>8%</em></div>
            <div><span>3 ★</span><i><b style={{ width: "4%" }} /></i><em>4%</em></div>
          </div>
        </div>
        <div className="review-card">
          <div className="review-avatar">AR</div>
          <div>
            <b>Ananya Rao</b><span>Verified Buyer</span><small>18 June 2024</small>
            <div className="review-stars">★★★★★</div>
            <p>The tailoring is beautiful and the pink shade is even prettier in person. The perfect polished co-ord.</p>
          </div>
          <img src="/rose-pink-coord.png" alt="Customer wearing co-ord set" />
        </div>
      </section>

      <section className="faq">
        <div className="faq-heading">
          <span className="eyebrow">NEED TO KNOW</span>
          <h2>Frequently asked <i>questions</i></h2>
          <p>Everything you need to know before your set finds a place in your wardrobe.</p>
        </div>
        <div className="faq-list">
          {faqs.map(([q, a]) => (
            <div className={faq === q ? "faq-item open" : "faq-item"} key={q}>
              <button onClick={() => setFaq(faq === q ? "" : q)}>
                <span>{q}</span>
                <b>{faq === q ? "−" : "+"}</b>
              </button>
              {faq === q && <p>{a}</p>}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
