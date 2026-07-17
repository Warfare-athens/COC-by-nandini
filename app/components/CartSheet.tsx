"use client";

import { useEffect, useState } from "react";
import { getCartItems, removeFromCart, updateQuantity, CartItem } from "../cart-helper";

interface CartSheetProps {
  open: boolean;
  onClose: () => void;
}

export default function CartSheet({ open, onClose }: CartSheetProps) {
  const [items, setItems] = useState<CartItem[]>([]);

  const loadItems = () => {
    setItems(getCartItems());
  };

  useEffect(() => {
    loadItems();
    window.addEventListener("coc-cart-updated", loadItems);
    return () => window.removeEventListener("coc-cart-updated", loadItems);
  }, []);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const parsePrice = (priceStr: string) => {
    return parseInt(priceStr.replace(/[^\d]/g, ""), 10) || 0;
  };

  const subtotal = items.reduce((sum, item) => sum + parsePrice(item.price) * item.quantity, 0);
  const freeShippingThreshold = 2999;
  const isFreeShipping = subtotal >= freeShippingThreshold;
  const difference = freeShippingThreshold - subtotal;

  return (
    <div className={open ? "cart-layer visible" : "cart-layer"} onClick={onClose}>
      <aside className="cart-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="cart-header">
          <div>
            <span className="eyebrow">YOUR EDIT</span>
            <h2>Your bag <i>({totalItems})</i></h2>
          </div>
          <button className="cart-close" onClick={onClose}>×</button>
        </div>

        {items.length > 0 ? (
          <>
            {items.map((item) => (
              <div className="cart-item" key={`${item.name}-${item.size}`}>
                <img src={item.img} alt={item.name} />
                <div>
                  <b>{item.name}</b>
                  <small>Size {item.size}</small>
                  <strong>{item.price}</strong>
                  <div className="quantity">
                    <button onClick={() => updateQuantity(item.name, item.size, -1)}>−</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.name, item.size, 1)}>+</button>
                  </div>
                </div>
                <button className="remove" onClick={() => removeFromCart(item.name, item.size)}>×</button>
              </div>
            ))}

            <div className="cart-note">
              {isFreeShipping 
                ? "✦ You qualify for FREE shipping!" 
                : `✦ You’re close to free shipping! Add ₹${difference.toLocaleString()} more.`
              }
            </div>
            
            <div className="cart-total">
              <span>Subtotal</span>
              <b>₹{subtotal.toLocaleString()}</b>
            </div>
            
            <button className="checkout" onClick={() => alert("Proceeding to checkout mock!")}>
              Proceed to checkout <span>→</span>
            </button>
          </>
        ) : (
          <div className="empty-cart">
            <span>♧</span>
            <h3>Your bag is waiting</h3>
            <p>Beautiful pieces, carefully curated for your next occasion.</p>
            <button className="checkout" onClick={onClose}>Explore collection <span>→</span></button>
          </div>
        )}

        <div className="cart-trust">
          <span>♢ Premium quality</span>
          <span>↺ Easy returns</span>
          <span>♧ Secure checkout</span>
        </div>
      </aside>
    </div>
  );
}
