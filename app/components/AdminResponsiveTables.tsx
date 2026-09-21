"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function AdminResponsiveTables() {
  const pathname = usePathname();

  useEffect(() => {
    const update = () => {
      document.querySelectorAll<HTMLTableElement>(".admin-main table").forEach((table) => {
        const labels = Array.from(table.querySelectorAll<HTMLTableCellElement>("thead th")).map((cell) => cell.textContent?.trim() || "");
        table.classList.add("admin-responsive-table");
        table.querySelectorAll<HTMLTableRowElement>("tbody tr").forEach((row) => {
          Array.from(row.cells).forEach((cell, index) => {
            if (!cell.hasAttribute("colspan")) cell.dataset.label = labels[index] || "Details";
          });
        });
      });
    };
    // RSC navigation can insert server HTML before React hydrates it. Waiting for
    // that pass to settle avoids mutating attributes during hydration.
    const timer = window.setTimeout(update, 600);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  return null;
}
