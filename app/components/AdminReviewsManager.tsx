"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { showGlobalStatus } from "@/app/global-status";
import UniversalSelect from "./UniversalSelect";

type Review = { id: string; product_id: string; customer_name: string; email: string | null; rating: number; title: string | null; body: string; image_url: string | null; status: string; is_verified: boolean; created_at: string; products?: { name?: string } | null };
type Product = { id: string; name: string };
type FormState = { productId: string; customerName: string; email: string; rating: string; title: string; body: string; imageUrl: string; status: string; isVerified: boolean };
const emptyForm: FormState = { productId: "", customerName: "", email: "", rating: "5", title: "", body: "", imageUrl: "", status: "pending", isVerified: false };

export default function AdminReviewsManager({ initialReviews, products }: { initialReviews: Review[]; products: Product[] }) {
  const router = useRouter();
  const reviews = initialReviews;
  const [editing, setEditing] = useState<Review | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [busy, setBusy] = useState(false);

  const openCreate = () => { setEditing(null); setForm({ ...emptyForm, productId: products[0]?.id || "" }); };
  const openEdit = (review: Review) => { setEditing(review); setForm({ productId: review.product_id, customerName: review.customer_name, email: review.email || "", rating: String(review.rating), title: review.title || "", body: review.body, imageUrl: review.image_url || "", status: review.status, isVerified: review.is_verified }); };
  const updateField = (key: keyof FormState, value: string | boolean) => setForm((current) => ({ ...current, [key]: value }));

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const endpoint = editing ? `/api/admin/reviews/${editing.id}` : "/api/admin/reviews";
      const response = await fetch(endpoint, {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, rating: Number(form.rating) }),
      });
      const payload = await response.json();
      if (!response.ok) return showGlobalStatus(payload.error || "Unable to save review", "error");
      showGlobalStatus(editing ? "Review updated" : "Review created", "success");
      setEditing(null);
      setForm(emptyForm);
      router.refresh();
    } catch {
      showGlobalStatus("Unable to save review", "error");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (review: Review) => {
    if (busy || !window.confirm(`Delete the review from ${review.customer_name}? This cannot be undone.`)) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/admin/reviews/${review.id}`, { method: "DELETE" });
      if (!response.ok) return showGlobalStatus("Unable to delete review", "error");
      if (editing?.id === review.id) {
        setEditing(null);
        setForm(emptyForm);
      }
      showGlobalStatus("Review deleted", "success");
      router.refresh();
    } catch {
      showGlobalStatus("Unable to delete review", "error");
    } finally {
      setBusy(false);
    }
  };

  return <>
    <div className="admin-review-actions"><button className="admin-small-button primary" type="button" onClick={openCreate}>Add review</button></div>
    {(editing || form.productId) && <form className="admin-review-editor" onSubmit={save}>
      <div className="admin-review-editor-head"><h3>{editing ? "Edit review" : "Add review"}</h3><button type="button" className="admin-small-button" onClick={() => { setEditing(null); setForm(emptyForm); }}>Cancel</button></div>
      <div className="admin-form-grid">
        <label className="admin-field"><span>Product</span><UniversalSelect value={form.productId} onChange={(event) => updateField("productId", event.target.value)} required>{products.map((product) => <option value={product.id} key={product.id}>{product.name}</option>)}</UniversalSelect></label>
        <label className="admin-field"><span>Reviewer name</span><input value={form.customerName} onChange={(event) => updateField("customerName", event.target.value)} required /></label>
        <label className="admin-field"><span>Email</span><input type="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} /></label>
        <label className="admin-field"><span>Rating</span><UniversalSelect value={form.rating} onChange={(event) => updateField("rating", event.target.value)}>{[5,4,3,2,1].map((value) => <option value={value} key={value}>{value} stars</option>)}</UniversalSelect></label>
        <label className="admin-field"><span>Status</span><UniversalSelect value={form.status} onChange={(event) => updateField("status", event.target.value)}><option>pending</option><option>approved</option><option>rejected</option></UniversalSelect></label>
        <label className="admin-field"><span>Image URL</span><input type="url" value={form.imageUrl} onChange={(event) => updateField("imageUrl", event.target.value)} /></label>
        <label className="admin-field full"><span>Title</span><input value={form.title} onChange={(event) => updateField("title", event.target.value)} /></label>
        <label className="admin-field full"><span>Review text <small>50 words max</small></span><textarea value={form.body} onChange={(event) => updateField("body", event.target.value)} required /></label>
        <label className="admin-checks"><span><input type="checkbox" checked={form.isVerified} onChange={(event) => updateField("isVerified", event.target.checked)} /> Verified buyer</span></label>
      </div>
      <button className="admin-button" disabled={busy}>{busy ? "Saving…" : editing ? "Save review" : "Create review"}</button>
    </form>}
    {reviews.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Customer</th><th>Product</th><th>Review</th><th>Rating</th><th>Status</th><th>Actions</th></tr></thead><tbody>{reviews.map((review) => <tr key={review.id}><td><b>{review.customer_name}</b><small className="admin-row-sub">{review.email || "No email"}</small></td><td>{review.products?.name || "—"}</td><td><b>{review.title || "Review"}</b><small className="admin-row-sub">{review.body}</small>{review.image_url && <img className="admin-review-thumb" src={review.image_url} alt="Review attachment" />}</td><td><span className="admin-review-stars">{"★".repeat(Number(review.rating || 0))}{"☆".repeat(5 - Number(review.rating || 0))}</span></td><td><span className={`admin-status ${review.status === "approved" ? "good" : review.status === "rejected" ? "bad" : "warn"}`}>{review.status}</span></td><td><div className="admin-review-row-actions"><button className="admin-small-button" type="button" onClick={() => openEdit(review)}>Edit</button><button className="admin-small-button danger" type="button" onClick={() => void remove(review)} disabled={busy}>Delete</button></div></td></tr>)}</tbody></table></div> : <p className="admin-muted">No reviews yet.</p>}
  </>;
}
