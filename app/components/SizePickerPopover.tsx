"use client";

import { useEffect, useRef, useState } from "react";
import { addToCart } from "@/app/cart-helper";
import { showGlobalStatus } from "@/app/global-status";

export type ProductSizeOption = {
  size: string;
  inStock: boolean;
  variantId?: string;
};

export interface SizePickerProduct {
  id?: string;
  name: string;
  price: string;
  img: string;
  sizes?: ProductSizeOption[];
  isAccessory?: boolean;
}

const DEFAULT_GARMENT_SIZES: ProductSizeOption[] = [
  { size: "XS", inStock: true },
  { size: "S", inStock: true },
  { size: "M", inStock: true },
  { size: "L", inStock: true },
  { size: "XL", inStock: true },
  { size: "XXL", inStock: true },
  { size: "3XL", inStock: true },
  { size: "4XL", inStock: true },
];

export default function SizePickerPopover({
  product,
  buttonClassName = "add-button",
}: {
  product: SizePickerProduct;
  buttonClassName?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [addedSize, setAddedSize] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const availableSizes =
    product.sizes && product.sizes.length > 0
      ? product.sizes.filter((s) => s.inStock)
      : product.isAccessory
      ? [{ size: "One Size", inStock: true }]
      : DEFAULT_GARMENT_SIZES;

  const isSingleSize =
    availableSizes.length === 1 ||
    availableSizes.every((s) => s.size.toLowerCase() === "one size" || s.size.toLowerCase() === "free size");

  // Close popover when clicking outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleMainClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // If single size (e.g. accessories / free size), add immediately
    if (isSingleSize) {
      const targetSize = availableSizes[0]?.size || "One Size";
      addToCart({
        productId: product.id,
        name: product.name,
        price: product.price,
        img: product.img,
        size: targetSize,
      });
      setAddedSize(targetSize);
      setTimeout(() => setAddedSize(null), 1200);
      return;
    }

    // Otherwise toggle the size picker popover
    setIsOpen((prev) => !prev);
  };

  const handleSelectSize = (e: React.MouseEvent, sizeOption: ProductSizeOption) => {
    e.preventDefault();
    e.stopPropagation();

    if (!sizeOption.inStock) {
      showGlobalStatus(`Size ${sizeOption.size} is currently out of stock`, "error");
      return;
    }

    addToCart({
      productId: product.id,
      name: product.name,
      price: product.price,
      img: product.img,
      size: sizeOption.size,
    });

    setAddedSize(sizeOption.size);
    setTimeout(() => {
      setIsOpen(false);
      setAddedSize(null);
    }, 800);
  };

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%" }}>
      {/* Trigger Button */}
      <button
        type="button"
        className={buttonClassName}
        onClick={handleMainClick}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        style={{
          transition: "all 0.2s ease",
          backgroundColor: addedSize ? "var(--rose, #bb7068)" : undefined,
          color: addedSize ? "#fff" : undefined,
        }}
      >
        {addedSize ? (
          <span>Added {addedSize} ✓</span>
        ) : (
          <>
            Add to bag <span>+</span>
          </>
        )}
      </button>

      {/* Popover */}
      {isOpen && (
        <div
          role="dialog"
          aria-label={`Select size for ${product.name}`}
          style={{
            position: "absolute",
            bottom: "calc(100% + 6px)",
            left: 0,
            right: 0,
            zIndex: 30,
            backgroundColor: "#fffaf6",
            border: "1px solid var(--rose, #bb7068)",
            borderRadius: "10px",
            boxShadow: "0 10px 25px rgba(58, 41, 38, 0.16)",
            padding: "12px 14px",
            animation: "fadeInUp 0.18s ease-out",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "10px",
              paddingBottom: "6px",
              borderBottom: "1px dashed var(--line, #e8cdbc)",
            }}
          >
            <span
              style={{
                fontSize: "11px",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                color: "#733b36",
              }}
            >
              Select Size
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsOpen(false);
              }}
              style={{
                fontSize: "16px",
                lineHeight: 1,
                color: "#92756b",
                padding: "2px 4px",
                cursor: "pointer",
              }}
              aria-label="Close size selector"
            >
              ✕
            </button>
          </div>

          {/* Size Options Grid */}
          <div
            style={{
              display: "flex",
              gap: "6px",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            {availableSizes.map((opt) => {
              const isSelected = addedSize === opt.size;
              return (
                <button
                  type="button"
                  key={opt.size}
                  disabled={!opt.inStock}
                  onClick={(e) => handleSelectSize(e, opt)}
                  style={{
                    minWidth: "36px",
                    height: "34px",
                    padding: "0 8px",
                    borderRadius: "6px",
                    border: isSelected
                      ? "1px solid var(--rose, #bb7068)"
                      : opt.inStock
                      ? "1px solid #d4b8aa"
                      : "1px solid #ebdcd0",
                    backgroundColor: isSelected
                      ? "var(--rose, #bb7068)"
                      : opt.inStock
                      ? "#fff"
                      : "#f7efeb",
                    color: isSelected ? "#fff" : opt.inStock ? "#3a2926" : "#bfa89d",
                    fontSize: "11px",
                    fontWeight: isSelected ? 700 : 600,
                    textDecoration: opt.inStock ? "none" : "line-through",
                    cursor: opt.inStock ? "pointer" : "not-allowed",
                    transition: "all 0.15s ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  title={opt.inStock ? `Size ${opt.size}` : `Size ${opt.size} (Out of Stock)`}
                >
                  {opt.size}
                </button>
              );
            })}
          </div>

          {/* Micro Footer Hint */}
          <div
            style={{
              marginTop: "8px",
              textAlign: "center",
              fontSize: "9px",
              color: "#92756b",
              letterSpacing: "0.05em",
            }}
          >
            Express delivery in Ahmedabad & across India
          </div>
        </div>
      )}
    </div>
  );
}
