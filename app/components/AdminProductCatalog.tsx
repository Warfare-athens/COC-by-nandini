"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, Bell, CheckSquare, Copy, RotateCcw, Search, SlidersHorizontal, Trash2 } from "lucide-react";
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
  lowStock: boolean;
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
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkNotice, setBulkNotice] = useState<string | null>(null);

  const [productToDelete, setProductToDelete] = useState<DeleteModalProduct | null>(null);
  const [deleteNotice, setDeleteNotice] = useState<string | null>(null);

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
        if (stock === "low" && !product.lowStock) return false;
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

  const selectedVisible = visible.filter((product) => selected.includes(product.id));
  const lowStockCount = productList.filter((product) => product.lowStock).length;
  const outOfStockCount = productList.filter((product) => product.inventory <= 0).length;
  const allVisibleSelected = visible.length > 0 && selectedVisible.length === visible.length;
  const toggleSelected = (id: string) => setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const toggleAllVisible = () => setSelected((current) => allVisibleSelected ? current.filter((id) => !visible.some((product) => product.id === id)) : [...new Set([...current, ...visible.map((product) => product.id)])]);
  const bulkAction = async (action: "archive" | "restore" | "duplicate") => {
    if (!selected.length || bulkBusy) return;
    setBulkBusy(true);
    try {
      const response = await fetch("/api/admin/products/bulk", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, ids: action === "duplicate" ? [selected[0]] : selected }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Unable to update products.");
      setBulkNotice(action === "duplicate" ? "Product duplicated as a draft." : `${payload.updated || selected.length} product${(payload.updated || selected.length) === 1 ? "" : "s"} ${action === "archive" ? "archived" : "restored"}.`);
      setSelected([]);
      router.refresh();
    } catch (error) {
      setBulkNotice(error instanceof Error ? error.message : "Unable to update products.");
    } finally {
      setBulkBusy(false);
      window.setTimeout(() => setBulkNotice(null), 5000);
    }
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
      {bulkNotice && <div className="admin-notice admin-product-delete-notice" role="status"><span>{bulkNotice}</span><button type="button" className="admin-notice-dismiss" onClick={() => setBulkNotice(null)} aria-label="Dismiss notice">×</button></div>}

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
            <option value="low">Low stock</option>
            <option value="out">Out of stock</option>
          </UniversalSelect>
        </div>
      </div>

      <div className="admin-product-count">
        Showing <b>{visible.length}</b> of {productList.length} products{selected.length ? <> · <b>{selected.length}</b> selected</> : null}
      </div>
      {(lowStockCount > 0 || outOfStockCount > 0) && <div className="admin-product-stock-alerts" role="status"><Bell size={15} /><span><b>{lowStockCount}</b> low-stock · <b>{outOfStockCount}</b> out of stock</span><button type="button" onClick={() => setStock("low")}>Review low stock</button></div>}

      <div className="admin-product-bulk-bar">
        <button type="button" className="admin-small-button" onClick={toggleAllVisible} disabled={!visible.length}><CheckSquare size={15} />{allVisibleSelected ? "Clear visible" : "Select visible"}</button>
        {selected.length > 0 && <><button type="button" className="admin-small-button" onClick={() => bulkAction("archive")} disabled={bulkBusy}><Archive size={15} />Archive</button><button type="button" className="admin-small-button" onClick={() => bulkAction("restore")} disabled={bulkBusy}><RotateCcw size={15} />Restore</button><button type="button" className="admin-small-button" onClick={() => bulkAction("duplicate")} disabled={bulkBusy || selected.length !== 1}><Copy size={15} />Duplicate</button></>}
      </div>

      <section className="admin-product-catalog">
        {visible.map((product) => (
          <div className="admin-product-card" key={product.id}>
            <label className="admin-product-select"><input type="checkbox" checked={selected.includes(product.id)} onChange={() => toggleSelected(product.id)} aria-label={`Select ${product.name}`} /></label>
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
                {product.lowStock && product.status === "active" && <span className="admin-product-low-stock"><Bell size={12} />Low stock</span>}
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
                    {product.inventory > 0 ? `${product.inventory} in stock${product.lowStock ? " · Low" : ""}` : "Out of stock"}
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
