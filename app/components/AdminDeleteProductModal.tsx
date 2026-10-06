"use client";

import { useEffect, useRef, useState } from "react";
import { Trash2, AlertTriangle, X, Loader2 } from "lucide-react";
import { showGlobalStatus } from "@/app/global-status";

export type DeleteModalProduct = {
  id: string;
  name: string;
  price?: number;
  category?: string;
  heroImageUrl?: string;
};

export type AdminDeleteProductModalProps = {
  isOpen: boolean;
  product: DeleteModalProduct | null;
  onClose: () => void;
  onSuccess: (deleted: DeleteModalProduct) => void;
};

export default function AdminDeleteProductModal({
  isOpen,
  product,
  onClose,
  onSuccess,
}: AdminDeleteProductModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  // Reset state after the modal has committed. Deferring avoids a cascading
  // render while preserving a clean confirmation state for every product.
  useEffect(() => {
    if (isOpen) {
      restoreFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      const timer = window.setTimeout(() => {
        setIsDeleting(false);
        setError("");
        closeButtonRef.current?.focus();
      }, 0);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [isOpen, product?.id]);

  useEffect(() => {
    if (!isOpen) return;
    const trap = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const dialog = document.querySelector<HTMLElement>("[data-admin-delete-dialog]");
      if (!dialog) return;
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", trap);
    return () => document.removeEventListener("keydown", trap);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen || !restoreFocusRef.current) return;
    const element = restoreFocusRef.current;
    restoreFocusRef.current = null;
    window.setTimeout(() => element.focus(), 0);
  }, [isOpen]);

  // Handle ESC key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isDeleting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isDeleting, onClose]);

  if (!isOpen || !product) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    setError("");

    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete product.");
      }

      showGlobalStatus(`Product "${product.name}" deleted successfully`, "success");
      onSuccess(product);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An error occurred while deleting.",
      );
      setIsDeleting(false);
    }
  };

  return (
    <div
      className="admin-dialog-layer admin-modal-fade-in"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isDeleting) {
          onClose();
        }
      }}
    >
      <div
        className="admin-delete-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
        data-admin-delete-dialog
      >
        <div className="admin-delete-modal-head">
          <div className="admin-delete-modal-title-group">
            <span className="admin-delete-modal-icon" aria-hidden="true">
              <Trash2 size={18} />
            </span>
            <div>
              <h2 id="delete-dialog-title">Delete Product</h2>
              <p>Permanent catalog removal</p>
            </div>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            className="admin-delete-modal-close"
            onClick={onClose}
            disabled={isDeleting}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        <div className="admin-delete-modal-body">
          <div className="admin-delete-product-preview">
            <div className="admin-delete-product-thumb">
              <img
                src={product.heroImageUrl || "/images/logo-mark.png"}
                alt={product.name}
              />
            </div>
            <div className="admin-delete-product-info">
              {product.category && (
                <span className="admin-delete-product-cat">
                  {product.category}
                </span>
              )}
              <strong>{product.name}</strong>
              {product.price !== undefined && (
                <span className="admin-delete-product-price">
                  ₹{Number(product.price).toLocaleString("en-IN")}
                </span>
              )}
            </div>
          </div>

          <div className="admin-delete-warning-box" id="delete-dialog-description">
            <AlertTriangle size={18} className="admin-delete-warning-icon" />
            <p>
              Are you sure you want to permanently delete <strong>{product.name}</strong>?
              This will remove all size inventory, image galleries, and catalog references.
              This action <strong>cannot be undone</strong>.
            </p>
          </div>

          {error && (
            <div className="admin-delete-error-box" role="alert" aria-live="assertive">
              <strong>Error:</strong> {error}
            </div>
          )}
        </div>

        <div className="admin-delete-modal-actions">
          <button
            type="button"
            className="admin-delete-btn-cancel"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="admin-delete-btn-confirm"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 size={15} className="admin-spin" />
                <span>Deleting…</span>
              </>
            ) : (
              <>
                <Trash2 size={15} />
                <span>Delete product</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
