"use client";

import { ArrowLeft, Printer } from "lucide-react";
import styles from "./InvoiceDocument.module.css";

export default function InvoiceActions({ backHref, backLabel = "Back" }: { backHref: string; backLabel?: string }) {
  return (
    <div className={`${styles.actions} invoice-print-hide`}>
      <a href={backHref}><ArrowLeft size={15} aria-hidden="true" />{backLabel}</a>
      <button type="button" onClick={() => window.print()} title="Save or Print as PDF">
        <Printer size={15} aria-hidden="true" />Download / Save as PDF
      </button>
    </div>
  );
}
