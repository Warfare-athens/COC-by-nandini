"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { trackCommerceEvent } from "../analytics-helper";

export default function CommerceAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;
    const key = `coc-view:${pathname}?${search}`;
    const timer = window.setTimeout(() => {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
      const params = new URLSearchParams(search);
      const source = params.get("utm_source") || sessionStorage.getItem("coc-source") || (document.referrer ? new URL(document.referrer).hostname : "direct");
      const medium = params.get("utm_medium") || sessionStorage.getItem("coc-medium") || (source === "direct" ? "none" : "referral");
      const campaign = params.get("utm_campaign") || sessionStorage.getItem("coc-campaign") || "none";
      sessionStorage.setItem("coc-source", source);
      sessionStorage.setItem("coc-medium", medium);
      sessionStorage.setItem("coc-campaign", campaign);
      const attribution = { source, medium, campaign, device: window.innerWidth < 768 ? "mobile" : window.innerWidth < 1100 ? "tablet" : "desktop" };
      trackCommerceEvent("page_view", attribution);
      if (pathname.startsWith("/product/")) trackCommerceEvent("product_view", { ...attribution, slug: pathname.split("/").filter(Boolean).pop() || "product" });
      if (pathname === "/checkout") trackCommerceEvent("checkout_started");
    }, 0);
    return () => window.clearTimeout(timer);
  }, [pathname, search]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const anchor = (event.target as Element | null)?.closest("a");
      if (anchor?.href.includes("wa.me/")) trackCommerceEvent("whatsapp_started");
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}
