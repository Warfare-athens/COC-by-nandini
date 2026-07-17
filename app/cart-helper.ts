export interface CartItem {
  name: string;
  price: string;
  img: string;
  size: string;
  quantity: number;
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
  } catch (e) {
    console.error(e);
  }
}

export function addToCart(item: Omit<CartItem, "quantity">) {
  const items = getCartItems();
  const existing = items.find((i) => i.name === item.name && i.size === item.size);
  if (existing) {
    existing.quantity += 1;
  } else {
    items.push({ ...item, quantity: 1 });
  }
  saveCartItems(items);
}

export function removeFromCart(name: string, size: string) {
  const items = getCartItems();
  const filtered = items.filter((i) => !(i.name === name && i.size === size));
  saveCartItems(filtered);
}

export function updateQuantity(name: string, size: string, delta: number) {
  const items = getCartItems();
  const existing = items.find((i) => i.name === name && i.size === size);
  if (existing) {
    existing.quantity += delta;
    if (existing.quantity <= 0) {
      removeFromCart(name, size);
      return;
    }
  }
  saveCartItems(items);
}

export function getCartCount(): number {
  return getCartItems().reduce((sum, item) => sum + item.quantity, 0);
}
