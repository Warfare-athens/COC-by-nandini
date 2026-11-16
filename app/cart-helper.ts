import { showGlobalStatus } from "./global-status";
import { getAnonymousId, getCommerceAttribution, getVisitorId, trackCommerceEvent } from "./analytics-helper";

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
  return getAnonymousId();
}

export function nextCartRevision() {
  const key = "coc-cart-revision";
  const revision = Math.max(Date.now(), Number(localStorage.getItem(key) || 0) + 1);
  localStorage.setItem(key, String(revision));
  return revision;
}

export async function syncCart(items: CartItem[]): Promise<boolean> {
  const anonymousToken = getCartToken();
  const response = await fetch("/api/cart/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      anonymousToken,
      revision: nextCartRevision(),
      attribution: getCommerceAttribution(),
      items: items.map(({ productId, name, size, color, quantity }) => ({ productId, name, size, color, quantity }))
    }),
    keepalive: true
  });
  if (!response.ok || !items.length) return false;
  const { legacy } = await response.json();
  if (!legacy || getCartToken() !== anonymousToken) return false;
  getVisitorId();
  localStorage.removeItem("coc-cart-token");
  await syncCart(getCartItems());
  return true;
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
    void syncCart(items).catch(() => undefined);
  } catch (e) {
    console.error(e);
  }
}

function sameCartItem(a: CartItem, b: CartItem) {
  return (a.productId && b.productId ? a.productId === b.productId : a.name === b.name) && a.size === b.size && (a.color || "") === (b.color || "");
}

export function clearCartAfterCheckout(completedToken: string, purchased: CartItem[]) {
  if (typeof window === "undefined") return;
  if (getCartToken() !== completedToken) return;
  getVisitorId();
  localStorage.removeItem("coc-cart-token");
  localStorage.removeItem("coc-applied-coupon");
  const remaining = getCartItems().map((item) => ({ ...item, quantity: item.quantity - (purchased.find((line) => sameCartItem(item, line))?.quantity || 0) }))
    .filter((item) => item.quantity > 0);
  if (remaining.length) saveCartItems(remaining);
  else {
    localStorage.removeItem("coc-cart-items");
    window.dispatchEvent(new Event("coc-cart-updated"));
  }
}

export function addToCart(item: Omit<CartItem, "quantity">) {
  const items = getCartItems();
  const existing = items.find((line) => sameCartItem(line, { ...item, quantity: 1 }));
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
  const match = (i: CartItem) => i.name === name && i.size === size && (i.color || "") === (color || "");
  const removed = items.find(match);
  const filtered = items.filter((i) => !match(i));
  saveCartItems(filtered);
  if (removed) trackCommerceEvent("remove_from_cart", { product: name, size, color: color || "", quantity: removed.quantity, valueInr: (Number.parseInt(removed.price.replace(/[^\d]/g, ""), 10) || 0) * removed.quantity, cartQuantity: filtered.reduce((sum, item) => sum + item.quantity, 0) }, removed.productId);
  showGlobalStatus(`${name} removed from bag`, "info");
}

export function updateQuantity(name: string, size: string, delta: number, color?: string) {
  const items = getCartItems();
  const match = (i: CartItem) => i.name === name && i.size === size && (i.color || "") === (color || "");
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
