"use client";

import { useEffect, useState } from "react";
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

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setIsDeleting(false);
      setError("");
    }
  }, [isOpen, product?.id]);

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

          <div className="admin-delete-warning-box">
            <AlertTriangle size={18} className="admin-delete-warning-icon" />
            <p>
              Are you sure you want to permanently delete <strong>{product.name}</strong>?
              This will remove all size inventory, image galleries, and catalog references.
              This action <strong>cannot be undone</strong>.
            </p>
          </div>

          {error && (
            <div className="admin-delete-error-box" role="alert">
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
