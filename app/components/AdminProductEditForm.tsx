"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type ProductEdit = { id: string; name: string; status: string; price_inr: number; compare_at_price_inr?: number | null; hero_image_url?: string | null; is_best_seller?: boolean; is_new_arrival?: boolean; is_featured?: boolean };

export default function AdminProductEditForm({ product }: { product: ProductEdit }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setBusy(true); setError("");
    const form = new FormData(event.currentTarget);
    const body = { name: form.get("name"), status: form.get("status"), price_inr: Number(form.get("price_inr")), compare_at_price_inr: form.get("compare_at_price_inr") ? Number(form.get("compare_at_price_inr")) : null, hero_image_url: form.get("hero_image_url"), is_best_seller: form.get("is_best_seller") === "on", is_new_arrival: form.get("is_new_arrival") === "on", is_featured: form.get("is_featured") === "on" };
    const response = await fetch(`/api/admin/products/${product.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await response.json(); setBusy(false);
    if (!response.ok) return setError(data.error || "Unable to save product.");
    router.push("/admin/products"); router.refresh();
  };
  return <form className="admin-form" onSubmit={submit}><div className="admin-form-grid"><div className="admin-field full"><label>Product name</label><input name="name" defaultValue={product.name} required /></div><div className="admin-field"><label>Status</label><select name="status" defaultValue={product.status}><option>draft</option><option>active</option><option>archived</option></select></div><div className="admin-field"><label>Price (INR)</label><input name="price_inr" type="number" min="1" defaultValue={product.price_inr} required /></div><div className="admin-field"><label>Compare-at price</label><input name="compare_at_price_inr" type="number" min="1" defaultValue={product.compare_at_price_inr || ""} /></div><div className="admin-field full"><label>Hero image URL</label><input name="hero_image_url" defaultValue={product.hero_image_url || ""} required /></div></div><div className="admin-checks"><label><input name="is_best_seller" type="checkbox" defaultChecked={product.is_best_seller} /> Best Seller</label><label><input name="is_new_arrival" type="checkbox" defaultChecked={product.is_new_arrival} /> New Arrival</label><label><input name="is_featured" type="checkbox" defaultChecked={product.is_featured} /> Featured</label></div>{error && <div className="admin-error">{error}</div>}<button className="admin-button" disabled={busy}>{busy ? "Saving…" : "Save changes"}</button></form>;
}
