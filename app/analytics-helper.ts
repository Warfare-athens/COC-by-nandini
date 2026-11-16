export type CommerceEventName =
  | "page_view"
  | "product_view"
  | "add_to_cart"
  | "remove_from_cart"
  | "cart_quantity_changed"
  | "cart_viewed"
  | "coupon_applied"
  | "coupon_rejected"
  | "coupon_removed"
  | "checkout_started"
  | "checkout_submitted"
  | "button_clicked"
  | "checkout_failed"
  | "checkout_contact_captured"
  | "whatsapp_started";

export function getAnonymousId() {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("coc-cart-token");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("coc-cart-token", id);
  }
  return id;
}

export function getVisitorId() {
  let id = localStorage.getItem("coc-visitor-id");
  if (!id) {
    id = getAnonymousId();
    localStorage.setItem("coc-visitor-id", id);
  }
  return id;
}

export function getCommerceAttribution() {
  const query = new URLSearchParams(window.location.search);
  const referrer = sessionStorage.getItem("coc-referrer") ?? document.referrer;
  const external = referrer && !referrer.startsWith(`${window.location.origin}/`) ? referrer : "";
  let referringHost = "direct";
  try { if (external) referringHost = new URL(external).hostname; } catch { /* A referrer is optional. */ }
  const source = sessionStorage.getItem("coc-source") || query.get("utm_source") || referringHost;
  const medium = sessionStorage.getItem("coc-medium") || query.get("utm_medium") || (source === "direct" ? "none" : "referral");
  const campaign = sessionStorage.getItem("coc-campaign") || query.get("utm_campaign") || "none";
  const landingPage = sessionStorage.getItem("coc-landing") || window.location.pathname;
  sessionStorage.setItem("coc-source", source.slice(0, 200));
  sessionStorage.setItem("coc-medium", medium.slice(0, 100));
  sessionStorage.setItem("coc-campaign", campaign.slice(0, 200));
  sessionStorage.setItem("coc-landing", landingPage.split("?")[0].slice(0, 500));
  sessionStorage.setItem("coc-referrer", external.split(/[?#]/)[0].slice(0, 500));
  return {
    source: source.slice(0, 200), medium: medium.slice(0, 100), campaign: campaign.slice(0, 200),
    landing_page: landingPage.split("?")[0].slice(0, 500), referrer: external.split(/[?#]/)[0].slice(0, 500),
    device: window.innerWidth < 768 ? "mobile" : window.innerWidth < 1100 ? "tablet" : "desktop",
  };
}

export function trackCommerceEvent(eventName: CommerceEventName, metadata?: Record<string, string | number | boolean>, productId?: string) {
  if (typeof window === "undefined") return;
  const payload = JSON.stringify({
    eventName,
    anonymousId: getAnonymousId(),
    visitorId: getVisitorId(),
    path: window.location.pathname,
    productId,
    metadata,
  });
  if (navigator.sendBeacon?.("/api/analytics", new Blob([payload], { type: "application/json" }))) return;
  fetch("/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    keepalive: true,
  }).catch(() => undefined);
}
