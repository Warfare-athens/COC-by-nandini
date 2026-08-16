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

export function trackCommerceEvent(eventName: CommerceEventName, metadata?: Record<string, string | number | boolean>, productId?: string) {
  if (typeof window === "undefined") return;
  const payload = JSON.stringify({
    eventName,
    anonymousId: getAnonymousId(),
    path: `${window.location.pathname}${window.location.search}`,
    productId,
    metadata,
  });
  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/analytics", new Blob([payload], { type: "application/json" }));
    return;
  }
  fetch("/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    keepalive: true,
  }).catch(() => undefined);
}
