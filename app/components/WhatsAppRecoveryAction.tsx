"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { showGlobalStatus } from "@/app/global-status";
import {
  CartRecoveryItem,
  buildCartRecoveryMessage,
  buildWhatsAppRecoveryUrl,
  normalizeWhatsAppPhone,
} from "@/lib/whatsapp-recovery";

function WhatsAppIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M20.5 11.6a8.5 8.5 0 0 1-12.6 7.5L3 20.5l1.4-4.7a8.5 8.5 0 1 1 16.1-4.2Z" />
      <path d="M8.2 7.6c.3-.3.6-.3.8 0l1 2c.1.3.1.5-.1.7l-.7.7c.7 1.5 1.8 2.6 3.4 3.3l.7-.8c.2-.2.5-.3.7-.1l2 1c.3.1.3.5.1.8-.5.8-1.4 1.3-2.3 1.2-3.4-.4-6.4-3.3-6.9-6.7-.1-.8.5-1.6 1.3-2.1Z" />
    </svg>
  );
}

export interface WhatsAppRecoveryActionProps {
  cartId?: string;
  phone?: string | null;
  customerName?: string | null;
  items?: CartRecoveryItem[];
  currentStatus?: string;
  variant?: "compact" | "journey";
}

export default function WhatsAppRecoveryAction({
  cartId,
  phone,
  customerName,
  items = [],
  currentStatus,
  variant = "compact",
}: WhatsAppRecoveryActionProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  const normalizedPhone = normalizeWhatsAppPhone(phone);
  const waUrl = buildWhatsAppRecoveryUrl({ phone, customerName, items });
  const previewText = buildCartRecoveryMessage({ customerName, items });

  const handleLaunchWhatsApp = async () => {
    if (!waUrl) {
      showGlobalStatus("No valid phone number for WhatsApp", "error");
      return;
    }

    // Open WhatsApp Click-to-Chat in new tab
    window.open(waUrl, "_blank", "noopener,noreferrer");

    // Automatically advance cart status to 'contacted' if currently active or abandoned
    const advanceable = !currentStatus || ["active", "abandoned", "stale"].includes(currentStatus);
    if (cartId && advanceable) {
      setBusy(true);
      try {
        const res = await fetch("/api/admin/modules", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ module: "carts", id: cartId, status: "contacted" }),
        });
        if (res.ok) {
          showGlobalStatus("WhatsApp opened · Cart marked as 'contacted'", "success", 3000);
          router.refresh();
        } else {
          showGlobalStatus("WhatsApp opened", "info");
        }
      } catch {
        showGlobalStatus("WhatsApp opened", "info");
      } finally {
        setBusy(false);
      }
    } else {
      showGlobalStatus("WhatsApp chat opened", "success");
    }
  };

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(previewText);
      setCopied(true);
      showGlobalStatus("Recovery message copied to clipboard", "success");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showGlobalStatus("Failed to copy message", "error");
    }
  };

  if (variant === "compact") {
    if (!normalizedPhone) {
      return (
        <span
          className="admin-wa-button disabled"
          title="No phone number provided for WhatsApp recovery"
        >
          <WhatsAppIcon />
          <span>WhatsApp</span>
        </span>
      );
    }

    return (
      <button
        type="button"
        className="admin-wa-button"
        onClick={handleLaunchWhatsApp}
        disabled={busy}
        title="1-Click WhatsApp Recovery: Opens chat with personalized bag items"
      >
        <WhatsAppIcon />
        <span>{busy ? "Opening…" : "WhatsApp"}</span>
      </button>
    );
  }

  // "journey" detailed view
  return (
    <div className="admin-wa-card">
      <div className="admin-wa-card-head">
        <b>
          <WhatsAppIcon />
          1-Click WhatsApp Recovery
        </b>
        {normalizedPhone ? (
          <span className="admin-status good">+{normalizedPhone}</span>
        ) : (
          <span className="admin-status bad">No phone</span>
        )}
      </div>

      <div className="admin-wa-preview-wrap">
        <small style={{ display: "block", marginBottom: "6px", color: "#065f46", fontWeight: 600 }}>
          Pre-composed customer message:
        </small>
        <div className="admin-wa-preview">{previewText}</div>
      </div>

      <div className="admin-wa-actions">
        {normalizedPhone ? (
          <button
            type="button"
            className="admin-wa-button"
            style={{ padding: "9px 16px", fontSize: "11px" }}
            onClick={handleLaunchWhatsApp}
            disabled={busy}
          >
            <WhatsAppIcon />
            <span>{busy ? "Opening…" : "Send WhatsApp Recovery ↗"}</span>
          </button>
        ) : (
          <span className="admin-wa-button disabled" style={{ padding: "9px 16px", fontSize: "11px" }}>
            <WhatsAppIcon />
            <span>Missing Phone Number</span>
          </span>
        )}

        <button
          type="button"
          className="admin-small-button"
          style={{ padding: "9px 14px", fontSize: "10px" }}
          onClick={handleCopyMessage}
        >
          {copied ? "✓ Copied" : "Copy text"}
        </button>

        {currentStatus === "contacted" && (
          <small style={{ color: "#047857", fontWeight: 600, fontSize: "10px", marginLeft: "auto" }}>
            ✓ Contacted
          </small>
        )}
        {currentStatus === "recovered" && (
          <small style={{ color: "#047857", fontWeight: 600, fontSize: "10px", marginLeft: "auto" }}>
            ✓ Recovered
          </small>
        )}
      </div>
    </div>
  );
}
