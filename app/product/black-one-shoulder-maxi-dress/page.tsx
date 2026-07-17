"use client";

import { useState } from "react";
import Header from "../../components/Header";
import { addToCart } from "../../cart-helper";

export default function BlackMaxiDressPage() {
  const [size, setSize] = useState("M");
  const [added, setAdded] = useState(false);
  const [open, setOpen] = useState("Size & Fit");
  const [faq, setFaq] = useState("");

  const rows = [
    ["Size & Fit", "Slim fit with an elegant cowl-drape front and side leg slit. Model is 5'8” and wears size S."],
    ["Fabric & Care", "Premium lightweight heavy satin. Dry clean only. Iron on low heat on reverse side."],
    ["Shipping & Returns", "Dispatch in 2–3 business days. Easy returns and exchanges within 7 days."],
    ["Customize Your Outfit", "Our stylists can help customize dress length and slit height."]
  ];

  const faqs = [
    ["What fabric is used for this dress?", "We use premium heavy-weight satin which gives a rich, fluid drape and natural sheen."],
    ["Is the fabric see-through?", "No, the satin has a substantial weight and is fully lined with soft, breathable lining."],
    ["How should I care for it?", "Dry clean only. Hang on a padded hanger and iron on reverse with a press cloth."],
    ["When will it arrive?", "Orders ship within 2–3 business days and arrive in 4–7 business days across India."]
  ];

  const handleAddToBag = () => {
    addToCart({
      name: "Midnight One-Shoulder Maxi",
      price: "₹4,499",
      img: "/midnight-maxi-dress.png",
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
        <b>Midnight One-Shoulder Maxi Dress</b>
      </div>

      <section className="product-detail">
        <div className="detail-visual">
          <div className="detail-main coord-main">
            <img src="/midnight-maxi-dress.png" alt="Midnight One-Shoulder Maxi Dress" />
          </div>
          <div className="detail-thumbs">
            <img src="/midnight-maxi-dress.png" alt="Dress front detail" />
            <img src="/midnight-maxi-dress.png" alt="Dress back detail" />
            <img src="/midnight-maxi-dress.png" alt="Draping styling" />
          </div>
        </div>
        <div className="detail-copy">
          <span className="badge-label">NEW ARRIVAL</span>
          <span className="eyebrow">DRESSES · CARNIVAL EDIT</span>
          <h1>Midnight One-Shoulder<br /><i>Maxi Dress</i></h1>
          <p className="subcopy">Asymmetrical one-shoulder draped black maxi dress with leg slit</p>
          <div className="price">₹4,499 <del>₹5,499</del> <small>18% OFF</small></div>
          <p className="tax">Inclusive of all taxes</p>
          <div className="rating">★★★★★ <span>4.9&nbsp; (24 reviews)</span></div>
          <hr />
          <div className="select-head"><b>Select size</b><a>Size Guide</a></div>
          <div className="sizes">
            {["XS", "S", "M", "L", "XL", "XXL"].map(s => (
              <button className={size === s ? "chosen" : ""} onClick={() => setSize(s)} key={s}>{s}</button>
            ))}
          </div>
          <p className="fit-note">ⓘ Model is 5'8” tall and is wearing size S</p>
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
            <h2>Reviews <i>(24)</i></h2>
          </div>
          <a>View all&nbsp; →</a>
        </div>
        <div className="review-summary">
          <div className="score">4.9<strong>★★★★★</strong><small>(24 reviews)</small></div>
          <div className="bars">
            <div><span>5 ★</span><i><b style={{ width: "92%" }} /></i><em>92%</em></div>
            <div><span>4 ★</span><i><b style={{ width: "8%" }} /></i><em>8%</em></div>
            <div><span>3 ★</span><i><b style={{ width: "0%" }} /></i><em>0%</em></div>
          </div>
        </div>
        <div className="review-card">
          <div className="review-avatar">RM</div>
          <div>
            <b>Riya M.</b><span>Verified Buyer</span><small>15 June 2024</small>
            <div className="review-stars">★★★★★</div>
            <p>Absolutely gorgeous dress! The satin is very high quality and flows beautifully. Got so many compliments at a cocktail party!</p>
          </div>
          <img src="/midnight-maxi-dress.png" alt="Customer wearing black maxi dress" />
        </div>
      </section>

      <section className="faq">
        <div className="faq-heading">
          <span className="eyebrow">NEED TO KNOW</span>
          <h2>Frequently asked <i>questions</i></h2>
          <p>Everything you need to know before your dress finds a place in your wardrobe.</p>
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
