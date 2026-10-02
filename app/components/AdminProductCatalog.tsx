"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, SlidersHorizontal, Trash2 } from "lucide-react";
import UniversalSelect from "./UniversalSelect";
import AdminDeleteProductModal, { DeleteModalProduct } from "./AdminDeleteProductModal";

export type AdminCatalogProduct = {
  id: string;
  name: string;
  status: string;
  price: number;
  heroImageUrl: string;
  category: string;
  inventory: number;
  featured: boolean;
  newArrival: boolean;
  bestSeller: boolean;
};

export default function AdminProductCatalog({ products }: { products: AdminCatalogProduct[] }) {
  const router = useRouter();
  const [productList, setProductList] = useState<AdminCatalogProduct[]>(products);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const [stock, setStock] = useState("all");

  const [productToDelete, setProductToDelete] = useState<DeleteModalProduct | null>(null);
  const [deleteNotice, setDeleteNotice] = useState<string | null>(null);

  // Sync if initial products array changes
  useEffect(() => {
    setProductList(products);
  }, [products]);

  const categories = useMemo(
    () => [...new Set(productList.map((product) => product.category))].sort(),
    [productList],
  );

  const visible = useMemo(
    () =>
      productList.filter((product) => {
        if (
          query &&
          !`${product.name} ${product.category}`.toLowerCase().includes(query.toLowerCase())
        )
          return false;
        if (status !== "all" && product.status !== status) return false;
        if (category !== "all" && product.category !== category) return false;
        if (stock === "in" && product.inventory <= 0) return false;
        if (stock === "out" && product.inventory > 0) return false;
        return true;
      }),
    [category, productList, query, status, stock],
  );

  const handleProductDeleted = (deleted: DeleteModalProduct) => {
    setProductList((current) => current.filter((p) => p.id !== deleted.id));
    setProductToDelete(null);
    setDeleteNotice(`Product "${deleted.name}" has been deleted.`);
    try {
      router.refresh();
    } catch {
      // non-blocking
    }
    setTimeout(() => setDeleteNotice(null), 5000);
  };

  return (
    <>
      {deleteNotice && (
        <div className="admin-notice admin-product-delete-notice">
          <span>{deleteNotice}</span>
          <button
            type="button"
            className="admin-notice-dismiss"
            onClick={() => setDeleteNotice(null)}
            aria-label="Dismiss notice"
          >
            ×
          </button>
        </div>
      )}

      <div className="admin-product-toolbar">
        <label className="admin-search-field">
          <Search size={18} />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search products or categories"
            aria-label="Search products"
          />
        </label>
        <div className="admin-product-filters">
          <SlidersHorizontal size={17} aria-hidden="true" />
          <UniversalSelect
            controlSize="compact"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            aria-label="Filter by status"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </UniversalSelect>
          <UniversalSelect
            controlSize="compact"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            aria-label="Filter by category"
          >
            <option value="all">All categories</option>
            {categories.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </UniversalSelect>
          <UniversalSelect
            controlSize="compact"
            value={stock}
            onChange={(event) => setStock(event.target.value)}
            aria-label="Filter by stock"
          >
            <option value="all">All stock</option>
            <option value="in">In stock</option>
            <option value="out">Out of stock</option>
          </UniversalSelect>
        </div>
      </div>

      <div className="admin-product-count">
        Showing <b>{visible.length}</b> of {productList.length} products
      </div>

      <section className="admin-product-catalog">
        {visible.map((product) => (
          <div className="admin-product-card" key={product.id}>
            <div className="admin-product-card-media-wrap">
              <a
                className="admin-product-card-image"
                href={`/admin/products/${product.id}`}
                title={`Edit ${product.name}`}
              >
                <img
                  src={product.heroImageUrl || "/images/logo-mark.png"}
                  alt={product.name}
                  loading="lazy"
                />
                <span className="admin-product-edit-mark" aria-hidden="true">
                  Edit
                </span>
                {product.status !== "active" && (
                  <span className="admin-product-draft">{product.status}</span>
                )}
              </a>
              <button
                type="button"
                className="admin-product-quick-delete-btn"
                title={`Delete ${product.name}`}
                aria-label={`Delete ${product.name}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setProductToDelete(product);
                }}
              >
                <Trash2 size={15} />
              </button>
            </div>

            <div className="admin-product-card-copy">
              <div className="admin-product-card-badges">
                <em>{product.category}</em>
                {product.newArrival && <em>New</em>}
                {product.featured && <em>Featured</em>}
                {product.bestSeller && <em>Best seller</em>}
              </div>

              <a
                href={`/admin/products/${product.id}`}
                className="admin-product-name-link"
                title={`Edit ${product.name}`}
              >
                <strong className="admin-product-name">{product.name}</strong>
              </a>

              <div className="admin-product-card-footer">
                <div className="admin-product-pricing-block">
                  <b>₹{product.price.toLocaleString("en-IN")}</b>
                  <small className={product.inventory > 0 ? "is-stocked" : "is-empty"}>
                    {product.inventory > 0 ? `${product.inventory} in stock` : "Out of stock"}
                  </small>
                </div>

                <div className="admin-product-card-actions">
                  <a
                    href={`/admin/products/${product.id}`}
                    className="admin-card-action-link"
                    title={`Edit ${product.name}`}
                  >
                    Edit
                  </a>
                  <button
                    type="button"
                    className="admin-card-action-delete"
                    title={`Delete ${product.name}`}
                    aria-label={`Delete ${product.name}`}
                    onClick={() => setProductToDelete(product)}
                  >
                    <Trash2 size={13} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {!visible.length && (
          <div className="admin-product-empty">No products match these filters.</div>
        )}
      </section>

      <AdminDeleteProductModal
        isOpen={Boolean(productToDelete)}
        product={productToDelete}
        onClose={() => setProductToDelete(null)}
        onSuccess={handleProductDeleted}
      />
    </>
  );
}
