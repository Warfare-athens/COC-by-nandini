"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function AdminResponsiveTables() {
  const pathname = usePathname();

  useEffect(() => {
    const cleanups: Array<() => void> = [];
    const enhance = () => Array.from(document.querySelectorAll<HTMLTableElement>(".admin-main table.admin-table")).forEach((table) => {
      if (table.dataset.adminTools === "true") return;
      const body = table.tBodies[0];
      if (!body) return;
      const rows = Array.from(body.rows);
      const headerLabels = Array.from(table.tHead?.rows[0]?.cells || []).map((cell) => (cell.textContent || "").trim());
      rows.forEach((row) => Array.from(row.cells).forEach((cell, index) => {
        if (!cell.dataset.label && headerLabels[index]) {
          cell.dataset.label = headerLabels[index];
          cell.dataset.adminGeneratedLabel = "true";
        }
      }));

      const host = table.parentElement;
      if (!host) return;
      const toolbar = document.createElement("div");
      toolbar.className = "admin-table-tools";
      const headers = Array.from(table.tHead?.rows[0]?.cells || []).map((cell) => (cell.textContent || "").trim().toLowerCase());
      const dateColumn = headers.findIndex((header) => /date|time|updated|subscribed|activity|placed|delivery|created|issued/.test(header));
      const dataDateColumn = dateColumn >= 0 ? dateColumn : Array.from(rows[0]?.cells || []).findIndex((cell) => cell.dataset.date);
      toolbar.innerHTML = `
        <label class="admin-table-search">
          <span class="admin-table-search-label">Search table</span>
          <input type="search" placeholder="Search records…" aria-label="Search table records">
        </label>
        ${dataDateColumn >= 0 ? `<label class="admin-table-range"><span class="admin-table-search-label">Date range</span><select aria-label="Filter by date range"><option value="1" selected>Last 24 hours</option><option value="2">Last 2 days</option><option value="3">Last 3 days</option><option value="5">Last 5 days</option><option value="7">Last 7 days</option><option value="10">Last 10 days</option><option value="15">Last 15 days</option><option value="30">Last 30 days</option><option value="all">All time</option></select></label>` : ""}
        <span class="admin-table-count" aria-live="polite"></span>
        <div class="admin-table-pagination">
          <button type="button" data-page="previous" aria-label="Previous page">Previous</button>
          <span data-page-label></span>
          <button type="button" data-page="next" aria-label="Next page">Next</button>
        </div>`;
      const panel = table.closest<HTMLElement>(".admin-panel");
      (panel || host).insertBefore(toolbar, panel ? panel.firstElementChild : table);
      table.dataset.adminTools = "true";

      const input = toolbar.querySelector<HTMLInputElement>("input");
      const range = toolbar.querySelector<HTMLSelectElement>("select");
      const count = toolbar.querySelector<HTMLElement>(".admin-table-count");
      const pageLabel = toolbar.querySelector<HTMLElement>("[data-page-label]");
      const previous = toolbar.querySelector<HTMLButtonElement>("[data-page=previous]");
      const next = toolbar.querySelector<HTMLButtonElement>("[data-page=next]");
      let page = 0;
      const pageSize = 25;

      const render = () => {
        const needle = input?.value.trim().toLowerCase() || "";
        const rangeValue = range?.value || "1";
        const now = Date.now();
        const matches = rows.filter((row) => {
          const matchesSearch = !needle || (row.textContent || "").toLowerCase().includes(needle);
          if (!matchesSearch || rangeValue === "all" || dataDateColumn < 0) return matchesSearch;
          const dateCell = row.cells[dataDateColumn];
          const dateText = dateCell?.dataset.date || dateCell?.textContent?.trim() || "";
          const parsed = Date.parse(dateText);
          if (Number.isNaN(parsed)) return false;
          if (rangeValue === "today") return new Date(parsed).toDateString() === new Date(now).toDateString();
          return parsed >= now - Number(rangeValue) * 24 * 60 * 60 * 1000;
        });
        const pages = Math.max(1, Math.ceil(matches.length / pageSize));
        page = Math.min(page, pages - 1);
        rows.forEach((row) => { row.style.display = "none"; });
        matches.slice(page * pageSize, (page + 1) * pageSize).forEach((row) => { row.style.display = ""; });
        if (count) count.textContent = `Showing ${matches.length ? page * pageSize + 1 : 0}–${Math.min((page + 1) * pageSize, matches.length)} of ${matches.length}`;
        if (pageLabel) pageLabel.textContent = `Page ${page + 1} of ${pages}`;
        if (previous) previous.disabled = page === 0;
        if (next) next.disabled = page >= pages - 1;
      };
      const onInput = () => { page = 0; render(); };
      const onPrevious = () => { page -= 1; render(); };
      const onNext = () => { page += 1; render(); };
      input?.addEventListener("input", onInput);
      range?.addEventListener("change", onInput);
      previous?.addEventListener("click", onPrevious);
      next?.addEventListener("click", onNext);
      render();
      cleanups.push(() => {
        input?.removeEventListener("input", onInput);
        range?.removeEventListener("change", onInput);
        previous?.removeEventListener("click", onPrevious);
        next?.removeEventListener("click", onNext);
        rows.forEach((row) => { row.style.display = ""; });
        rows.forEach((row) => Array.from(row.cells).forEach((cell) => {
          if (cell.dataset.adminGeneratedLabel === "true") {
            delete cell.dataset.label;
            delete cell.dataset.adminGeneratedLabel;
          }
        }));
        toolbar.remove();
        delete table.dataset.adminTools;
      });
    });

    // The admin shell mounts before the streamed route content has hydrated.
    // Defer DOM enhancement until that first hydration pass is complete. A
    // cross-route observer would see the next route's server tree too early.
    // Route content can arrive after the shell (especially on a streamed
    // admin page), so make a few delayed passes instead of relying on one
    // timing window. The first pass remains delayed long enough to avoid
    // mutating markup while React is hydrating it.
    let attempts = 0;
    let poll: number | undefined;
    const timer = window.setTimeout(() => {
      const run = () => {
        attempts += 1;
        enhance();
        if (attempts >= 8 || document.querySelectorAll(".admin-main table.admin-table:not([data-admin-tools='true'])").length === 0) {
          if (poll) window.clearInterval(poll);
        }
      };
      run();
      poll = window.setInterval(run, 1000);
    }, 2500);

    return () => {
      window.clearTimeout(timer);
      if (poll) window.clearInterval(poll);
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [pathname]);

  return null;
}
