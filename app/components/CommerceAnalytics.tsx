"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { commerceActionLabels } from "@/lib/commerce-actions";
import { getCommerceAttribution, trackCommerceEvent } from "../analytics-helper";

export default function CommerceAnalytics() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;
    const timer = window.setTimeout(() => {
      const attribution = getCommerceAttribution();
      trackCommerceEvent("page_view", attribution);
      if (pathname.startsWith("/product/")) {
        const slug = pathname.split("/").filter(Boolean).at(-1) || "";
        const productId = document.querySelector<HTMLElement>("[data-commerce-product]")?.dataset.commerceProduct;
        trackCommerceEvent("product_view", { ...attribution, slug }, productId);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;
    const onClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      const control = event.target.closest<HTMLElement>("button, a, [role=button]");
      if (!control || control.matches(":disabled, [aria-disabled=true]")) return;
      const whatsapp = control instanceof HTMLAnchorElement && /(^|\.)wa\.me$/.test(control.hostname);
      const action = control.dataset.commerceAction || (whatsapp ? "whatsapp" : "");
      if (Object.hasOwn(commerceActionLabels, action)) trackCommerceEvent("button_clicked", { action });
      if (whatsapp) trackCommerceEvent("whatsapp_started");
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [pathname]);

  return null;
}
