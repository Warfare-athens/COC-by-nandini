"use client";

import { FormEvent, useState } from "react";
import { showGlobalStatus } from "@/app/global-status";

export type AdminSettings = {
  announcementEnabled: boolean;
  announcementMessage: string;
  announcementLink: string;
  freeShippingThreshold: number;
  shippingCharge: number;
  codEnabled: boolean;
  maintenanceMode: boolean;
  razorpayEnabled: boolean;
};

export default function AdminSettingsForm({ initial }: { initial: AdminSettings }) {
  const [busy, setBusy] = useState(false);
  const [purging, setPurging] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        announcementEnabled: form.get("announcementEnabled") === "on",
        announcementMessage: form.get("announcementMessage"),
        announcementLink: form.get("announcementLink"),
        freeShippingThreshold: Number(form.get("freeShippingThreshold")),
        shippingCharge: Number(form.get("shippingCharge")),
        codEnabled: form.get("codEnabled") === "on",
        maintenanceMode: form.get("maintenanceMode") === "on",
        razorpayEnabled: form.get("razorpayEnabled") === "on",
      }),
    });
    const payload = await response.json();
    setBusy(false);
    showGlobalStatus(
      response.ok ? "Store settings saved" : payload.error || "Unable to save",
      response.ok ? "success" : "error",
    );
  };

  const handlePurgeTestData = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to clear all test orders, test carts, and analytics events?\n\nThis will reset your dashboard to clean state (₹0 revenue, 0 orders). Your products, images, categories, and settings will remain safe.\n\nThis action cannot be undone.",
    );
    if (!confirmed) return;

    setPurging(true);
    try {
      const res = await fetch("/api/admin/purge-test-data", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        showGlobalStatus("All test orders, carts, and events purged successfully!", "success");
        setTimeout(() => window.location.reload(), 1200);
      } else {
        showGlobalStatus(data.error || "Failed to purge test data", "error");
      }
    } catch {
      showGlobalStatus("Network error while purging data", "error");
    } finally {
      setPurging(false);
    }
  };

  return (
    <div className="admin-form-container" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <form className="admin-form" onSubmit={submit}>
        <div className="admin-panel" style={{ padding: 20, margin: 0 }}>
          <h2>Announcement</h2>
          <div className="admin-form-grid" style={{ marginTop: 18 }}>
            <div className="admin-field full">
              <label>Message</label>
              <input
                name="announcementMessage"
                maxLength={160}
                defaultValue={initial.announcementMessage}
              />
            </div>
            <div className="admin-field full">
              <label>Optional link</label>
              <input
                name="announcementLink"
                defaultValue={initial.announcementLink}
                placeholder="/shop"
              />
            </div>
          </div>
          <div className="admin-checks" style={{ marginTop: 15 }}>
            <label>
              <input
                name="announcementEnabled"
                type="checkbox"
                defaultChecked={initial.announcementEnabled}
              />{" "}
              Show announcement
            </label>
          </div>
        </div>

        <div className="admin-panel" style={{ padding: 20, margin: 0 }}>
          <h2>Checkout and delivery</h2>
          <div className="admin-form-grid" style={{ marginTop: 18 }}>
            <div className="admin-field">
              <label>Free shipping threshold</label>
              <input
                name="freeShippingThreshold"
                type="number"
                min="0"
                defaultValue={initial.freeShippingThreshold}
              />
            </div>
            <div className="admin-field">
              <label>Shipping charge</label>
              <input
                name="shippingCharge"
                type="number"
                min="0"
                defaultValue={initial.shippingCharge}
              />
            </div>
          </div>
          <div className="admin-checks" style={{ marginTop: 15 }}>
            <label>
              <input
                name="codEnabled"
                type="checkbox"
                defaultChecked={initial.codEnabled}
              />{" "}
              Cash on delivery
            </label>
            <label>
              <input
                name="maintenanceMode"
                type="checkbox"
                defaultChecked={initial.maintenanceMode}
              />{" "}
              Maintenance mode
            </label>
            <label>
              <input
                name="razorpayEnabled"
                type="checkbox"
                defaultChecked={initial.razorpayEnabled}
              />{" "}
              Razorpay (Online UPI, Cards & NetBanking)
            </label>
          </div>
        </div>

        <button className="admin-button" disabled={busy}>
          {busy ? "Saving…" : "Save settings"}
        </button>
      </form>

      {/* Data Maintenance Section */}
      <div className="admin-panel" style={{ padding: 20, margin: 0, borderLeft: "4px solid #ba6a64" }}>
        <h2>Store Data & Maintenance</h2>
        <p style={{ margin: "8px 0 16px", fontSize: 13, color: "#776860", lineHeight: 1.5 }}>
          Clear test orders, demo carts, and test visitor tracking events to reset store analytics to real zero.
          Your product catalog, images, categories, and store settings will not be affected.
        </p>
        <button
          type="button"
          onClick={handlePurgeTestData}
          disabled={purging}
          className="admin-button"
          style={{
            background: "#ba6a64",
            borderColor: "#ba6a64",
            color: "#ffffff",
            cursor: purging ? "not-allowed" : "pointer",
          }}
        >
          {purging ? "Purging test records…" : "Purge Test Data & Reset Analytics"}
        </button>
      </div>
    </div>
  );
}
