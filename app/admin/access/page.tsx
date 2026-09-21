"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, KeyRound, ShieldCheck } from "lucide-react";

export default function AdminAccessPage() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const form = new FormData(event.currentTarget);
      const key = String(form.get("key") || "").trim();
      const response = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error || "Incorrect admin access key or server error.");
        return;
      }
      window.location.href = "/admin";
    } catch (err: any) {
      setError(err?.message || "Connection error. Please try again.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className="admin-access">
      <form className="admin-access-card" onSubmit={submit}>
        <input type="text" name="username" value="admin" readOnly autoComplete="username" hidden />
        <div className="admin-access-brand"><span>C</span><div><strong>Carnival of Clothes</strong><small>Store control</small></div></div>
        <span className="eyebrow"><ShieldCheck size={14} />Secure workspace</span>
        <h1>Welcome back</h1>
        <p>Enter your private access key to manage the store.</p>
        <label><span>Admin access key</span><div><KeyRound size={18} /><input name="key" type="password" required autoFocus autoComplete="current-password" placeholder="Enter your access key" /></div></label>
        <button disabled={busy}>{busy ? "Checking…" : <><span>Enter dashboard</span><ArrowRight size={17} /></>}</button>
        {error && <div className="admin-error">{error}</div>}
      </form>
    </main>
  );
}
