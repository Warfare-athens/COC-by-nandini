"use client";

import { useState, useRef, useEffect } from "react";
import { showGlobalStatus } from "@/app/global-status";

export function calculateGst(price: number | string) {
  const num = typeof price === "string" ? parseFloat(price.replace(/[^0-9.]/g, "")) : price;
  if (isNaN(num) || num <= 0) {
    return {
      hasPrice: false,
      rawPrice: 0,
      rate: 5,
      taxAmount: 0,
      totalPrice: 0,
      inclusiveBase: "0",
      inclusiveTax: "0",
    };
  }

  // Under 2500 -> 5% GST; After 2500 -> 18% GST
  const rate = num > 2500 ? 18 : 5;
  const taxAmount = Math.round(num * (rate / 100));
  const totalPrice = Math.round(num + taxAmount);
  const inclusiveBaseNum = num / (1 + rate / 100);
  const inclusiveTaxNum = num - inclusiveBaseNum;

  return {
    hasPrice: true,
    rawPrice: num,
    rate,
    taxAmount,
    totalPrice,
    inclusiveBase: inclusiveBaseNum.toFixed(2),
    inclusiveTax: inclusiveTaxNum.toFixed(2),
  };
}

interface AdminGstPriceHelperProps {
  price: string | number;
  onApplyPrice: (newPrice: string, rate: number, taxAmount: number) => void;
  label?: string;
}

export default function AdminGstPriceHelper({
  price,
  onApplyPrice,
  label = "Price (INR)",
}: AdminGstPriceHelperProps) {
  const [open, setOpen] = useState(false);
  const [previousBase, setPreviousBase] = useState<string | null>(null);
  const [lastAppliedRate, setLastAppliedRate] = useState<number | null>(null);
  const [lastAppliedTax, setLastAppliedTax] = useState<number | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const {
    hasPrice,
    rawPrice,
    rate,
    taxAmount,
    totalPrice,
    inclusiveBase,
    inclusiveTax,
  } = calculateGst(price);

  // Close popover when clicking outside
  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleApply = () => {
    if (!hasPrice) {
      setOpen(true);
      return;
    }
    setPreviousBase(String(rawPrice));
    setLastAppliedRate(rate);
    setLastAppliedTax(taxAmount);
    onApplyPrice(String(totalPrice), rate, taxAmount);
    setOpen(false);
    showGlobalStatus(`Added ${rate}% GST (+₹${taxAmount}). Price is now ₹${totalPrice}.`, "success", 4000);
  };

  const handleUndo = () => {
    if (previousBase) {
      onApplyPrice(previousBase, 0, 0);
      setPreviousBase(null);
      setLastAppliedRate(null);
      setLastAppliedTax(null);
      showGlobalStatus(`Reverted back to base price ₹${previousBase}.`, "info", 3000);
    }
  };

  const isApplied =
    previousBase !== null &&
    String(rawPrice) === String(Number(previousBase) + (lastAppliedTax || 0));

  return (
    <div className="admin-gst-helper" ref={popoverRef}>
      <div className="admin-gst-header">
        <label style={{ margin: 0 }}>{label}</label>
        <div className="admin-gst-actions">
          <button
            type="button"
            className={`admin-gst-guide-btn ${open ? "active" : ""}`}
            onClick={() => setOpen((prev) => !prev)}
            title="GST Guidance: 5% under ₹2,500 / 18% after ₹2,500"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            <span>Guidance</span>
          </button>

          <button
            type="button"
            className="admin-gst-plus-btn"
            onClick={handleApply}
            title={
              hasPrice
                ? `Click to add ${rate}% GST (+₹${taxAmount}) to set price to ₹${totalPrice}`
                : "Enter a price, then click to add applicable GST"
            }
          >
            <span className="plus-icon">+</span>{" "}
            {hasPrice ? `${rate}% GST (+₹${taxAmount})` : "GST (5% / 18%)"}
          </button>
        </div>
      </div>

      {isApplied && (
        <div className="admin-gst-undo-pill">
          <span>
            ✓ Added {lastAppliedRate}% GST (+₹{lastAppliedTax}) to base ₹{previousBase}
          </span>
          <button type="button" className="admin-gst-undo-btn" onClick={handleUndo}>
            Undo
          </button>
        </div>
      )}

      {open && (
        <div className="admin-gst-popover">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <strong style={{ fontSize: "12px", color: "#3a2926", display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ color: "#bb7068" }}>✦</span> GST Tax Guidance & Calculator
            </strong>
            <button
              type="button"
              onClick={() => setOpen(false)}
              style={{
                background: "none",
                border: "none",
                fontSize: "18px",
                color: "#99827b",
                cursor: "pointer",
                padding: 0,
                lineHeight: 1,
              }}
              aria-label="Close guidance"
            >
              ×
            </button>
          </div>

          <p style={{ margin: "4px 0 8px", fontSize: "11px", color: "#806f69" }}>
            According to your pricing rules, garments under ₹2,500 incur 5% GST, and garments above ₹2,500 incur 18% GST.
          </p>

          <div className="admin-gst-rule-grid">
            <div className={`admin-gst-rule-card ${hasPrice && rawPrice <= 2500 ? "active" : ""}`}>
              <span className="admin-gst-rule-tag">Under ₹2,500</span>
              <div className="admin-gst-rule-rate">5% GST</div>
              <span className="admin-gst-rule-sub">Everyday & standard wear</span>
            </div>

            <div className={`admin-gst-rule-card ${hasPrice && rawPrice > 2500 ? "active" : ""}`}>
              <span className="admin-gst-rule-tag">Above ₹2,500</span>
              <div className="admin-gst-rule-rate">18% GST</div>
              <span className="admin-gst-rule-sub">Party & luxury couture</span>
            </div>
          </div>

          {hasPrice ? (
            <>
              <div className="admin-gst-breakdown">
                <div className="admin-gst-breakdown-row">
                  <span style={{ color: "#806f69" }}>Entered base price:</span>
                  <span style={{ fontWeight: 600 }}>₹{rawPrice.toLocaleString("en-IN")}</span>
                </div>
                <div className="admin-gst-breakdown-row">
                  <span style={{ color: "#806f69" }}>Applicable tax tier:</span>
                  <span style={{ fontWeight: 600, color: "#bb7068" }}>
                    {rate}% GST ({rawPrice <= 2500 ? "≤ ₹2,500" : "> ₹2,500"})
                  </span>
                </div>
                <div className="admin-gst-breakdown-row">
                  <span style={{ color: "#806f69" }}>GST amount (+):</span>
                  <span style={{ fontWeight: 600, color: "#bb7068" }}>+ ₹{taxAmount.toLocaleString("en-IN")}</span>
                </div>
                <div className="admin-gst-breakdown-row total">
                  <span>Price with GST:</span>
                  <span style={{ color: "#bb7068" }}>₹{totalPrice.toLocaleString("en-IN")}</span>
                </div>
              </div>

              <div style={{ display: "grid", gap: "8px" }}>
                <button type="button" className="admin-gst-apply-btn" onClick={handleApply}>
                  <span style={{ fontSize: "14px", lineHeight: 1 }}>+</span> Apply ₹{totalPrice} as Selling Price
                </button>
              </div>

              <div
                style={{
                  marginTop: "10px",
                  padding: "8px 10px",
                  background: "#fdf8f5",
                  border: "1px dashed #ebdcd0",
                  borderRadius: "6px",
                  fontSize: "10.5px",
                  color: "#7e6c66",
                  lineHeight: 1.4,
                }}
              >
                💡 <strong>Tax-inclusive note:</strong> If your ₹{rawPrice} was already intended as the final tax-inclusive price, the net base is <strong>₹{inclusiveBase}</strong> and GST is <strong>₹{inclusiveTax}</strong>.
              </div>
            </>
          ) : (
            <div
              style={{
                padding: "12px",
                background: "#fbf0eb",
                borderRadius: "8px",
                textAlign: "center",
                fontSize: "11px",
                color: "#815f57",
              }}
            >
              Enter a price in the field to calculate the exact GST and add it with one click.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
