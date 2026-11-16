"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { showGlobalStatus } from "@/app/global-status";
import UniversalSelect from "./UniversalSelect";

export default function AdminOrderControl({ id, current }: { id: string; current: string }) {
  const [status, setStatus] = useState(current);
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const save = async () => {
    setBusy(true);
    try {
      const response = await fetch(`/api/admin/orders/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fulfillmentStatus: status }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      showGlobalStatus("Fulfillment updated", "success");
      router.refresh();
    } catch (error) {
      showGlobalStatus(error instanceof Error ? error.message : "Unable to update fulfillment", "error");
    } finally {
      setBusy(false);
    }
  };

  return <div className="admin-commerce-actions">
    <UniversalSelect controlSize="compact" fluid={false} value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Fulfillment status">
      {["unfulfilled","processing","packed","shipped","out_for_delivery","delivered","cancelled","returned"].map((value) => <option key={value} value={value}>{value.replaceAll("_", " ")}</option>)}
    </UniversalSelect>
    <button className="admin-small-button primary" type="button" disabled={busy || status === current} onClick={() => void save()}>{busy ? "Saving…" : "Save"}</button>
  </div>;
}
