"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { showGlobalStatus } from "@/app/global-status";

type ModuleName = "content" | "media" | "templates" | "partnerships" | "stock-requests" | "coupons";

export function AdminCreateForm({ module }: { module: ModuleName }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setBusy(true);
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    const response = await fetch("/api/admin/modules", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ module, data }) });
    const payload = await response.json(); setBusy(false);
    if (!response.ok) return showGlobalStatus(payload.error || "Unable to save", "error");
    form.reset(); showGlobalStatus("Saved", "success"); router.refresh();
  };

  if (module === "media") return <form className="admin-inline-form" onSubmit={async (event) => {
    event.preventDefault(); setBusy(true); const form = event.currentTarget; const formData = new FormData(form);
    const upload = await fetch("/api/admin/upload", { method: "POST", body: formData }); const image = await upload.json();
    if (!upload.ok) { setBusy(false); return showGlobalStatus(image.error || "Upload failed", "error"); }
    const save = await fetch("/api/admin/modules", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ module, data: { ...image, filename: (formData.get("file") as File)?.name, altText: formData.get("altText"), folder: formData.get("folder") } }) });
    const payload = await save.json(); setBusy(false); if (!save.ok) return showGlobalStatus(payload.error || "Unable to save image", "error");
    form.reset(); showGlobalStatus("Image added to library", "success"); router.refresh();
  }}><input className="admin-input wide" name="file" type="file" accept="image/png,image/jpeg,image/webp" required/><input className="admin-input" name="altText" placeholder="Alt text"/><select className="admin-select" name="folder"><option>general</option><option>products</option><option>content</option><option>campaigns</option></select><button className="admin-small-button primary" disabled={busy}>{busy ? "Uploading…" : "Upload image"}</button></form>;

  const fields = module === "content" ? <><input className="admin-input" name="title" placeholder="Title" required/><input className="admin-input" name="slug" placeholder="slug" required/><select className="admin-select" name="type"><option>page</option><option>blog</option><option>banner</option><option>FAQ</option></select><select className="admin-select" name="status"><option>draft</option><option>published</option></select><input className="admin-input wide" name="summary" placeholder="Summary"/><textarea className="admin-textarea wide" name="body" placeholder="Content" required/></>
    : module === "templates" ? <><input className="admin-input" name="name" placeholder="Template name" required/><select className="admin-select" name="type"><option>content</option><option>email</option><option>invoice</option><option>WhatsApp</option></select><input className="admin-input wide" name="subject" placeholder="Subject or heading"/><textarea className="admin-textarea full" name="body" placeholder="Template body" required/></>
    : module === "partnerships" ? <><input className="admin-input" name="name" placeholder="Contact name" required/><input className="admin-input" name="company" placeholder="Brand / company"/><input className="admin-input" name="email" type="email" placeholder="Email"/><input className="admin-input" name="phone" placeholder="Phone"/><select className="admin-select" name="type"><option>creator</option><option>brand</option><option>supplier</option><option>affiliate</option></select><select className="admin-select" name="status"><option>lead</option><option>contacted</option><option>negotiating</option><option>active</option><option>closed</option></select><input className="admin-input" name="valueInr" type="number" min="0" placeholder="Value ₹"/><input className="admin-input" name="notes" placeholder="Notes"/></>
    : module === "stock-requests" ? <><input className="admin-input" name="customerName" placeholder="Customer"/><input className="admin-input" name="email" type="email" placeholder="Email" required/><input className="admin-input" name="phone" placeholder="Phone"/><input className="admin-input" name="requestedSize" placeholder="Product / size" required/></>
    : <><input className="admin-input" name="name" placeholder="Offer name" required/><input className="admin-input" name="code" placeholder="Coupon code" required/><select className="admin-select" name="type"><option value="fixed">Fixed ₹</option><option value="percentage">Percentage</option></select><input className="admin-input" name="value" type="number" min="1" placeholder="Value" required/><input className="admin-input" name="minimumSubtotalInr" type="number" min="0" placeholder="Minimum subtotal"/><input className="admin-input" name="usageLimit" type="number" min="1" placeholder="Usage limit"/></>;
  return <form className="admin-inline-form" onSubmit={submit}>{fields}<button className="admin-small-button primary" disabled={busy}>{busy ? "Saving…" : "Add"}</button></form>;
}

export function AdminRecordAction({ module, id, options, current }: { module: string; id: string; options: string[]; current: string }) {
  const router = useRouter(); const [value, setValue] = useState(current); const [busy, setBusy] = useState(false);
  return <div className="admin-record-action"><select className="admin-select" value={value} onChange={(event) => setValue(event.target.value)}>{options.map((option) => <option key={option}>{option}</option>)}</select><button className="admin-small-button" disabled={busy || value === current} onClick={async () => { setBusy(true); const response = await fetch("/api/admin/modules", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ module, id, status: value }) }); setBusy(false); if (response.ok) { showGlobalStatus("Updated", "success"); router.refresh(); } else showGlobalStatus("Update failed", "error"); }}>{busy ? "…" : "Save"}</button></div>;
}
