"use client";

import { useState } from "react";

export interface StickyMobileBuyBarProps {
  product: {
    id: string;
    name: string;
    hero_image_url: string;
    price_inr: number;
    compare_at_price_inr?: number | null;
  };
  sizes: Array<{ size: string; available: boolean }>;
  selectedSize: string;
  onSelectSize: (size: string) => void;
  onAddToCart: () => void;
  added: boolean;
  canBuy: boolean;
  visible: boolean;
}

export default function StickyMobileBuyBar({
  product,
  sizes,
  selectedSize,
  onSelectSize,
  onAddToCart,
  added,
  canBuy,
  visible,
}: StickyMobileBuyBarProps) {
  const [sizePickerOpen, setSizePickerOpen] = useState(false);

  if (!visible) return null;

  const hasMultipleSizes = sizes.length > 1;

  return (
    <aside
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden animate-in slide-in-from-bottom-5 duration-200"
      style={{
        backgroundColor: "rgba(255, 250, 247, 0.96)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderTop: "1px solid #ebdcd0",
        boxShadow: "0 -8px 30px rgba(58, 41, 38, 0.12)",
        padding: "10px 16px",
        paddingBottom: "max(12px, env(safe-area-inset-bottom))",
      }}
      aria-label="Quick add to bag"
    >
      {/* Quick Size Picker Dropup */}
      {sizePickerOpen && hasMultipleSizes && (
        <div
          className="absolute bottom-full left-4 right-4 mb-2 rounded-2xl border border-[#ebdcd0] bg-[#fffaf7] p-3.5 shadow-[0_-6px_25px_rgba(58,41,38,0.14)]"
          style={{ animation: "fadeInUp 0.15s ease-out" }}
        >
          <div className="flex items-center justify-between border-b border-[#f0e2d8] pb-2 mb-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#733b36]">
              Choose Size
            </span>
            <button
              type="button"
              onClick={() => setSizePickerOpen(false)}
              className="text-sm font-bold text-[#8c746b] p-1"
              aria-label="Close size picker"
            >
              ✕
            </button>
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            {sizes.map((s) => {
              const isSelected = selectedSize === s.size;
              return (
                <button
                  type="button"
                  key={s.size}
                  disabled={!s.available}
                  onClick={() => {
                    onSelectSize(s.size);
                    setSizePickerOpen(false);
                  }}
                  className={`h-9 min-w-9 px-3 rounded-lg text-xs font-semibold transition ${
                    isSelected
                      ? "bg-[#bb7068] text-white"
                      : s.available
                      ? "bg-white border border-[#d4b8aa] text-[#3a2926] active:bg-[#f7ece5]"
                      : "bg-[#f5eeea] border border-[#ebdcd0] text-[#bfa89d] line-through cursor-not-allowed"
                  }`}
                >
                  {s.size}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Bar Content */}
      <div className="flex items-center justify-between gap-3">
        {/* Left: Thumbnail & Price */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <img
            src={product.hero_image_url || "/product.jpg"}
            alt={product.name}
            className="h-11 w-11 shrink-0 rounded-lg object-cover border border-[#ebdcd0]"
          />
          <div className="min-w-0">
            <h4
              className="truncate text-xs font-normal text-[#2b1812] leading-tight"
              style={{ fontFamily: "'Instrument Serif', serif", fontSize: "15px" }}
            >
              {product.name}
            </h4>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <strong className="text-xs font-bold text-[#bb7068]">
                ₹{Number(product.price_inr).toLocaleString("en-IN")}
              </strong>
              {product.compare_at_price_inr && product.compare_at_price_inr > product.price_inr && (
                <del className="text-[10px] text-[#9c847b]">
                  ₹{Number(product.compare_at_price_inr).toLocaleString("en-IN")}
                </del>
              )}
            </div>
          </div>
        </div>

        {/* Middle / Right: Size Switcher & Buy Button */}
        <div className="flex items-center gap-2 shrink-0">
          {hasMultipleSizes && (
            <button
              type="button"
              onClick={() => setSizePickerOpen((prev) => !prev)}
              className="flex h-10 items-center gap-1 rounded-xl border border-[#d4b8aa] bg-white px-2.5 text-xs font-bold text-[#3a2926] shadow-2xs active:bg-[#f7ece5]"
              aria-label="Change size"
            >
              <span>{selectedSize || "Size"}</span>
              <span className="text-[10px] text-[#8c746b]">▾</span>
            </button>
          )}

          <button
            type="button"
            onClick={onAddToCart}
            disabled={!canBuy}
            className={`h-10 px-4 rounded-xl text-xs font-bold uppercase tracking-wider text-white shadow-xs transition active:scale-95 ${
              added
                ? "bg-[#28a745]"
                : canBuy
                ? "bg-[#bb7068] hover:bg-[#a6544e]"
                : "bg-[#cdb9ae] cursor-not-allowed"
            }`}
          >
            {added ? "Added ✓" : !canBuy ? "Out of Stock" : "Add to Bag +"}
          </button>
        </div>
      </div>
    </aside>
  );
}
