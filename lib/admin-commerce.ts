export type CommerceRow = Record<string, unknown>;

export function relatedRow(value: unknown): CommerceRow | undefined {
  return (Array.isArray(value) ? value[0] : value) as CommerceRow | undefined;
}

export function cartItemValue(item: CommerceRow) {
  const variant = relatedRow(item.product_variants);
  const product = relatedRow(item.products);
  return Number(item.quantity || 0) * Number(variant?.price_inr ?? product?.price_inr ?? 0);
}

export function cartValue(cart: CommerceRow) {
  return ((cart.cart_items || []) as CommerceRow[]).reduce((sum, item) => sum + cartItemValue(item), 0);
}

export function hasCartContact(cart: CommerceRow) {
  const phone = String(cart.phone || "").replace(/\D/g, "");
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(cart.email || "")) || (phone.length >= 10 && phone.length <= 15);
}

export function cartIsOpen(cart: CommerceRow) {
  return !["converted", "closed", "empty"].includes(String(cart.status));
}

export function cartDisplayStatus(cart: CommerceRow, now: number) {
  const status = String(cart.status || "active");
  if (["active", "checkout"].includes(status) && Date.parse(String(cart.last_activity_at)) <= now - 3_600_000) return "inactive";
  return status;
}

export function isRecoverableCart(cart: CommerceRow, now: number) {
  return cartIsOpen(cart) && hasCartContact(cart) && cartValue(cart) > 0 &&
    ["inactive", "abandoned", "contacted"].includes(cartDisplayStatus(cart, now));
}

export function isPlacedOrder(order: CommerceRow) {
  return ["confirmed", "completed"].includes(String(order.status)) && order.payment_status !== "refunded" &&
    (order.payment_method !== "razorpay" || order.payment_status === "paid");
}

export function orderPaymentLabel(status: unknown, method: unknown) {
  if (status === "paid") return "Paid";
  if (status === "refunded") return "Refunded";
  if (status === "failed" || status === "payment_failed") return "Payment failed";
  if (status === "authorized") return "Authorized · awaiting capture";
  if (method === "cod") return "Cash on delivery";
  return "Awaiting payment";
}

export function orderPaymentTone(status: unknown) {
  return status === "paid" ? "good" : ["failed", "payment_failed", "refunded"].includes(String(status)) ? "bad" : "warn";
}
