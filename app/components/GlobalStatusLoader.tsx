"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type StatusType = "loading" | "success" | "error" | "info";
type LoaderEvent = CustomEvent<{ message?: string; type?: StatusType; duration?: number }>;

export default function GlobalStatusLoader() {
  const pathname = usePathname();
  const [status, setStatus] = useState<{ message: string; type: StatusType }>({ message: "", type: "loading" });
  const timerRef = useRef<number | null>(null);

  const hide = () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = null;
    setStatus((current) => ({ ...current, message: "" }));
  };
  const hideLoading = () =>
    setStatus((current) => current.type === "loading" ? { ...current, message: "" } : current);

  const show = (nextMessage: string, type: StatusType = "loading", duration = 20_000) => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    setStatus({ message: nextMessage, type });
    timerRef.current = window.setTimeout(hide, duration);
  };

  useEffect(() => {
    const onShow = (event: Event) => show((event as LoaderEvent).detail?.message || "Please wait");
    const onStatus = (event: Event) => {
      const detail = (event as LoaderEvent).detail;
      show(detail?.message || "Done", detail?.type || "success", detail?.duration || 2400);
    };
    const onHide = () => hideLoading();
    const onClick = (event: MouseEvent) => {
      const anchor = (event.target as Element | null)?.closest("a");
      if (!anchor || event.defaultPrevented || event.button !== 0) return;
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const destination = new URL(anchor.href, window.location.href);
      if (destination.origin !== window.location.origin) return;
      if (destination.pathname === window.location.pathname && destination.search === window.location.search) return;
      if (anchor.getAttribute("href")?.startsWith("#")) return;
      show("Opening page");
    };
    const onSubmit = (event: SubmitEvent) => {
      const submitter = event.submitter as HTMLButtonElement | null;
      const label = submitter?.textContent?.trim().toLowerCase() || "";
      if (label.includes("save")) show("Saving changes");
      else if (label.includes("checkout") || label.includes("order")) show("Processing order");
      else if (label.includes("login") || label.includes("dashboard")) show("Signing in");
      else show("Working on it");
    };

    window.addEventListener("coc-loader-show", onShow);
    window.addEventListener("coc-status", onStatus);
    window.addEventListener("coc-loader-hide", onHide);
    document.addEventListener("click", onClick, true);
    document.addEventListener("submit", onSubmit, true);
    return () => {
      window.removeEventListener("coc-loader-show", onShow);
      window.removeEventListener("coc-status", onStatus);
      window.removeEventListener("coc-loader-hide", onHide);
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("submit", onSubmit, true);
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(hide, 180);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  return (
    <div className={`global-status-loader is-${status.type} ${status.message ? "is-visible" : ""}`} role="status" aria-live="polite" aria-hidden={!status.message}>
      <span className="global-status-sparkles" aria-hidden="true">· · ·</span>
      <strong>{status.message || "Please wait"}</strong>
      {status.type === "loading" ? <span className="global-status-spinner" aria-hidden="true" /> : <span className="global-status-result" aria-hidden="true">{status.type === "success" ? "✓" : status.type === "error" ? "!" : "i"}</span>}
    </div>
  );
}
