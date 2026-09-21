"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import UniversalSelect from "./UniversalSelect";

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
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const [stock, setStock] = useState("all");
  const categories = useMemo(() => [...new Set(products.map((product) => product.category))].sort(), [products]);
  const visible = useMemo(() => products.filter((product) => {
    if (query && !`${product.name} ${product.category}`.toLowerCase().includes(query.toLowerCase())) return false;
    if (status !== "all" && product.status !== status) return false;
    if (category !== "all" && product.category !== category) return false;
    if (stock === "in" && product.inventory <= 0) return false;
    if (stock === "out" && product.inventory > 0) return false;
    return true;
  }), [category, products, query, status, stock]);

  return <>
    <div className="admin-product-toolbar">
      <label className="admin-search-field"><Search size={18} /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products or categories" aria-label="Search products" /></label>
      <div className="admin-product-filters"><SlidersHorizontal size={17} aria-hidden="true" /><UniversalSelect controlSize="compact" value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter by status"><option value="all">All statuses</option><option value="active">Active</option><option value="draft">Draft</option><option value="archived">Archived</option></UniversalSelect><UniversalSelect controlSize="compact" value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Filter by category"><option value="all">All categories</option>{categories.map((item) => <option key={item}>{item}</option>)}</UniversalSelect><UniversalSelect controlSize="compact" value={stock} onChange={(event) => setStock(event.target.value)} aria-label="Filter by stock"><option value="all">All stock</option><option value="in">In stock</option><option value="out">Out of stock</option></UniversalSelect></div>
    </div>
    <div className="admin-product-count">Showing <b>{visible.length}</b> of {products.length} products</div>
    <section className="admin-product-catalog">
      {visible.map((product) => <a className="admin-product-card" href={`/admin/products/${product.id}`} key={product.id}>
        <span className="admin-product-card-image"><img src={product.heroImageUrl || "/images/logo-mark.png"} alt={product.name} /><span className="admin-product-edit-mark" aria-hidden="true">Edit</span>{product.status !== "active" && <span className="admin-product-draft">{product.status}</span>}</span>
        <span className="admin-product-card-copy">
          <span className="admin-product-card-badges"><em>{product.category}</em>{product.newArrival && <em>New</em>}{product.featured && <em>Featured</em>}{product.bestSeller && <em>Best seller</em>}</span>
          <strong className="admin-product-name">{product.name}</strong>
          <span className="admin-product-card-footer"><b>₹{product.price.toLocaleString("en-IN")}</b><small className={product.inventory > 0 ? "is-stocked" : "is-empty"}>{product.inventory > 0 ? `${product.inventory} in stock` : "Out of stock"}</small></span>
        </span>
      </a>)}
      {!visible.length && <div className="admin-product-empty">No products match these filters.</div>}
    </section>
  </>;
}
