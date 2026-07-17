"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminAccessPage() {
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false); const router = useRouter();
  const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setBusy(true); setError(""); const form = new FormData(event.currentTarget); const response = await fetch("/api/admin/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: form.get("key") }) }); const data = await response.json(); setBusy(false); if (!response.ok) return setError(data.error); router.push("/admin"); router.refresh(); };
  return <main className="admin-access"><form className="admin-access-card" onSubmit={submit}><span className="eyebrow">PRIVATE STORE CONTROL</span><h1>Admin access</h1><p>Enter the private access key configured for the store. Customer accounts are not required.</p><input name="key" type="password" required autoFocus placeholder="Admin access key"/><button disabled={busy}>{busy ? "Checking…" : "Enter dashboard"}</button>{error && <div className="admin-error">{error}</div>}</form></main>;
}
