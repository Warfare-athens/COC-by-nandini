import { showGlobalStatus } from "./global-status";
import { trackCommerceEvent } from "./analytics-helper";

export interface CartItem {
  productId?: string;
  name: string;
  price: string;
  img: string;
  size: string;
  color?: string;
  quantity: number;
}

export function getCartToken() {
  if (typeof window === "undefined") return "";
  let token = localStorage.getItem("coc-cart-token");
  if (!token) { token = crypto.randomUUID(); localStorage.setItem("coc-cart-token", token); }
  return token;
}

function syncCart(items: CartItem[]) {
  const anonymousToken = getCartToken(); if (!anonymousToken) return;
  fetch("/api/cart/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      anonymousToken,
      items: items.map(({ productId, name, size, color, quantity }) => ({ productId, name, size, color, quantity }))
    }),
    keepalive: true
  }).catch(() => undefined);
}

export function getCartItems(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("coc-cart-items");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCartItems(items: CartItem[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("coc-cart-items", JSON.stringify(items));
    window.dispatchEvent(new Event("coc-cart-updated"));
    syncCart(items);
  } catch (e) {
    console.error(e);
  }
}

export function clearCartAfterCheckout() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("coc-cart-items");
  localStorage.removeItem("coc-applied-coupon");
  window.dispatchEvent(new Event("coc-cart-updated"));
}

export function addToCart(item: Omit<CartItem, "quantity">) {
  const items = getCartItems();
  const existing = items.find(
    (i) => i.name === item.name && i.size === item.size && (i.color || "") === (item.color || "")
  );
  if (existing) {
    existing.quantity += 1;
  } else {
    items.push({ ...item, quantity: 1 });
  }
  saveCartItems(items);
  const cartQuantity = items.reduce((sum, cartItem) => sum + cartItem.quantity, 0);
  trackCommerceEvent("add_to_cart", { product: item.name, size: item.size, color: item.color || "", quantity: 1, valueInr: Number.parseInt(item.price.replace(/[^\d]/g, ""), 10) || 0, cartQuantity }, item.productId);
  showGlobalStatus(`${item.name} added to bag`, "success");
}

export function removeFromCart(name: string, size: string, color?: string) {
  const items = getCartItems();
  const match = (i: CartItem) => i.name === name && i.size === size && (!color || (i.color || "") === color);
  const removed = items.find(match);
  const filtered = items.filter((i) => !match(i));
  saveCartItems(filtered);
  if (removed) trackCommerceEvent("remove_from_cart", { product: name, size, color: color || "", quantity: removed.quantity, valueInr: (Number.parseInt(removed.price.replace(/[^\d]/g, ""), 10) || 0) * removed.quantity, cartQuantity: filtered.reduce((sum, item) => sum + item.quantity, 0) }, removed.productId);
  showGlobalStatus(`${name} removed from bag`, "info");
}

export function updateQuantity(name: string, size: string, delta: number, color?: string) {
  const items = getCartItems();
  const match = (i: CartItem) => i.name === name && i.size === size && (!color || (i.color || "") === color);
  const existing = items.find(match);
  if (existing) {
    existing.quantity += delta;
    if (existing.quantity <= 0) {
      removeFromCart(name, size, color);
      return;
    }
  }
  saveCartItems(items);
  if (existing) trackCommerceEvent("cart_quantity_changed", { product: name, size, color: color || "", delta, quantity: existing.quantity, cartQuantity: items.reduce((sum, item) => sum + item.quantity, 0) }, existing.productId);
  showGlobalStatus("Bag quantity updated", "success", 1500);
}

export function getCartCount(): number {
  return getCartItems().reduce((sum, item) => sum + item.quantity, 0);
}
