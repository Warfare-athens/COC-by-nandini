"use client";

import { useEffect, useState } from "react";
import Header from "@/app/components/Header";
import { addToCart } from "@/app/cart-helper";
import { showGlobalStatus } from "@/app/global-status";

interface OrderItem {
  id: string;
  product_id?: string;
  product_name: string;
  variant_title?: string;
  sku?: string;
  image_url?: string;
  quantity: number;
  unit_price_inr: number;
  total_inr: number;
}

interface Address {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

interface Fulfillment {
  id: string;
  carrier?: string;
  tracking_number?: string;
  tracking_url?: string;
  status: string;
  estimated_delivery_at?: string;
  shipped_at?: string;
  delivered_at?: string;
}

interface Order {
  id: string;
  order_number: string;
  email: string;
  phone: string;
  status: string;
  payment_status: string;
  payment_method: string;
  fulfillment_status: string;
  subtotal_inr: number;
  discount_inr: number;
  shipping_inr: number;
  tax_inr: number;
  total_inr: number;
  coupon_code?: string;
  placed_at: string;
  invoice_url?: string;
  track_url: string;
  addresses?: Address;
  order_items: OrderItem[];
  fulfillments: Fulfillment[];
}

export default function AccountClient() {
  const [identifier, setIdentifier] = useState("");
  const [activeCustomer, setActiveCustomer] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [activeTab, setActiveTab] = useState<"orders" | "addresses" | "benefits">("orders");

  const lookupAccount = async (queryVal: string) => {
    const q = queryVal.trim();
    if (!q || q.length < 3) return;

    setLoading(true);
    try {
      const res = await fetch("/api/account/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      const data = await res.json();
      if (!res.ok) {
        showGlobalStatus(data.error || "Unable to look up account", "error");
        return;
      }

      setOrders(data.orders || []);
      setAddresses(data.addresses || []);
      setActiveCustomer(q);
      setHasSearched(true);
      try {
        localStorage.setItem("coc-account-id", q);
      } catch {
        // ignore localStorage errors
      }
    } catch {
      showGlobalStatus("Connection error while retrieving orders.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem("coc-account-id");
      if (saved) {
        setIdentifier(saved);
        lookupAccount(saved);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleLogout = () => {
    try {
      localStorage.removeItem("coc-account-id");
    } catch {
      // ignore
    }
    setActiveCustomer(null);
    setOrders([]);
    setAddresses([]);
    setHasSearched(false);
    setIdentifier("");
  };

  const handleReorder = (item: OrderItem) => {
    addToCart({
      productId: item.product_id,
      name: item.product_name,
      price: `₹${Number(item.unit_price_inr).toLocaleString("en-IN")}`,
      img: item.image_url || "/party-wear-red-dress.png",
      size: item.variant_title || "Standard",
    });
  };

  const getStatusBadge = (order: Order) => {
    const s = (order.fulfillment_status || order.status || "").toLowerCase();
    if (s === "delivered") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e8f5e9] px-3 py-1 text-xs font-semibold text-[#2e7d32]">
          <span className="h-2 w-2 rounded-full bg-[#2e7d32]" />
          Delivered
        </span>
      );
    }
    if (s === "shipped" || s === "in_transit") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e3f2fd] px-3 py-1 text-xs font-semibold text-[#1565c0]">
          <span className="h-2 w-2 rounded-full bg-[#1565c0]" />
          In Transit
        </span>
      );
    }
    if (s === "confirmed" || order.status === "confirmed") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fbf0eb] px-3 py-1 text-xs font-semibold text-[#bb7068]">
          <span className="h-2 w-2 rounded-full bg-[#bb7068]" />
          Confirmed
        </span>
      );
    }
    if (s === "cancelled") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f5f5f5] px-3 py-1 text-xs font-semibold text-[#757575]">
          <span className="h-2 w-2 rounded-full bg-[#757575]" />
          Cancelled
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fff8e1] px-3 py-1 text-xs font-semibold text-[#f57f17]">
        <span className="h-2 w-2 rounded-full bg-[#f57f17]" />
        Processing
      </span>
    );
  };

  return (
    <main className="min-h-screen bg-[#fbf4ee] text-[#3a2926]">
      <Header />

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-xs uppercase tracking-widest text-[#8b625a]">
          <a href="/" className="hover:underline">Home</a>
          <span>›</span>
          <span className="font-semibold text-[#3a2926]">Customer Account Hub</span>
        </div>

        {/* Hero Header */}
        <div className="mb-10 text-center sm:text-left">
          <span className="inline-block text-[11px] font-bold uppercase tracking-[0.25em] text-[#bb7068]">
            WARDROBE &amp; PURCHASES
          </span>
          <h1 className="mt-1 font-serif text-3xl sm:text-4xl text-[#3a2926]">
            My Account &amp; <i>Orders</i>
          </h1>
          <p className="mt-2 text-sm text-[#73524b]">
            Track delivery status, download official tax invoices, and re-order your favorite pieces.
          </p>
        </div>

        {/* Not Logged In / Search Form */}
        {!activeCustomer ? (
          <div className="mx-auto max-w-xl rounded-2xl border border-[#ebdcd0] bg-[#fffaf7] p-6 sm:p-8 shadow-[0_12px_40px_rgba(58,41,38,0.06)]">
            <div className="mb-5 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#fbf0eb] text-[#bb7068]">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <h2 className="font-serif text-2xl text-[#3a2926]">Instant Order Access</h2>
              <p className="mt-1 text-xs text-[#73524b]">
                No password required. Enter the email address or 10-digit mobile number used during checkout.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                lookupAccount(identifier);
              }}
              className="space-y-4"
            >
              <div>
                <label htmlFor="lookup-input" className="block text-xs font-semibold uppercase tracking-wider text-[#733b36] mb-1.5">
                  Email Address or Mobile Number
                </label>
                <input
                  id="lookup-input"
                  type="text"
                  required
                  placeholder="e.g. nandini@gmail.com or 9876543210"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full rounded-xl border border-[#e8cdbc] bg-white px-4 py-3 text-sm text-[#3a2926] placeholder-[#b59e95] focus:border-[#bb7068] focus:outline-none focus:ring-1 focus:ring-[#bb7068]"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !identifier.trim()}
                className="w-full rounded-xl bg-[#bb7068] py-3 text-center text-xs font-bold uppercase tracking-widest text-white shadow-md transition hover:bg-[#a35d56] disabled:opacity-50"
              >
                {loading ? "Searching Wardrobe…" : "View My Orders & Invoices →"}
              </button>
            </form>

            {/* Quick trust badges */}
            <div className="mt-8 grid grid-cols-3 gap-2 border-t border-[#f0e2d8] pt-6 text-center text-[11px] text-[#8b625a]">
              <div>
                <span className="block text-base mb-0.5">📄</span>
                <span className="font-semibold text-[#3a2926]">Signed Invoices</span>
                <p className="text-[10px] text-[#9c7870]">1-Click PDF Download</p>
              </div>
              <div>
                <span className="block text-base mb-0.5">🚚</span>
                <span className="font-semibold text-[#3a2926]">Live Tracking</span>
                <p className="text-[10px] text-[#9c7870]">Realtime Courier Status</p>
              </div>
              <div>
                <span className="block text-base mb-0.5">💬</span>
                <span className="font-semibold text-[#3a2926]">Priority Help</span>
                <p className="text-[10px] text-[#9c7870]">Direct WhatsApp Concierge</p>
              </div>
            </div>
          </div>
        ) : (
          <div>
            {/* Logged in status banner */}
            <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#ebdcd0] bg-[#fffaf7] p-4 sm:p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fbf0eb] text-[#bb7068] font-bold">
                  {activeCustomer.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-xs text-[#8b625a]">Logged in as</div>
                  <div className="text-sm font-semibold text-[#3a2926]">{activeCustomer}</div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="rounded-lg border border-[#ebdcd0] bg-white px-3 py-1.5 text-xs font-semibold text-[#733b36] hover:bg-[#fbf0eb]"
              >
                Switch Account / Sign Out
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="mb-6 flex border-b border-[#ebdcd0]">
              <button
                onClick={() => setActiveTab("orders")}
                className={`border-b-2 px-5 py-3 text-xs font-bold uppercase tracking-wider transition ${
                  activeTab === "orders"
                    ? "border-[#bb7068] text-[#bb7068]"
                    : "border-transparent text-[#8b625a] hover:text-[#3a2926]"
                }`}
              >
                Orders ({orders.length})
              </button>
              <button
                onClick={() => setActiveTab("addresses")}
                className={`border-b-2 px-5 py-3 text-xs font-bold uppercase tracking-wider transition ${
                  activeTab === "addresses"
                    ? "border-[#bb7068] text-[#bb7068]"
                    : "border-transparent text-[#8b625a] hover:text-[#3a2926]"
                }`}
              >
                Saved Addresses ({addresses.length})
              </button>
              <button
                onClick={() => setActiveTab("benefits")}
                className={`border-b-2 px-5 py-3 text-xs font-bold uppercase tracking-wider transition ${
                  activeTab === "benefits"
                    ? "border-[#bb7068] text-[#bb7068]"
                    : "border-transparent text-[#8b625a] hover:text-[#3a2926]"
                }`}
              >
                Carnival VIP Benefits
              </button>
            </div>

            {/* Tab 1: Orders */}
            {activeTab === "orders" && (
              <div>
                {orders.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[#ebdcd0] bg-[#fffaf7] p-12 text-center">
                    <span className="text-4xl">🛍️</span>
                    <h3 className="mt-3 font-serif text-xl text-[#3a2926]">No Orders Found</h3>
                    <p className="mt-1 text-sm text-[#73524b]">
                      We could not find any previous orders for <span className="font-semibold">{activeCustomer}</span>.
                    </p>
                    <a
                      href="/shop"
                      className="mt-6 inline-block rounded-xl bg-[#bb7068] px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-white shadow hover:bg-[#a35d56]"
                    >
                      Explore Carnival Collections
                    </a>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {orders.map((order) => (
                      <div
                        key={order.id}
                        className="overflow-hidden rounded-2xl border border-[#ebdcd0] bg-[#fffaf7] shadow-sm transition hover:shadow-md"
                      >
                        {/* Order Header */}
                        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#ebdcd0] bg-[#fbf0eb]/50 p-4 sm:p-5">
                          <div className="space-y-1">
                            <div className="flex items-center gap-3">
                              <span className="font-serif text-lg font-bold text-[#3a2926]">
                                #{order.order_number}
                              </span>
                              {getStatusBadge(order)}
                            </div>
                            <div className="text-xs text-[#8b625a]">
                              Placed on {new Date(order.placed_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                              {" • "}
                              Payment: {order.payment_method?.toUpperCase() || "COD"} ({order.payment_status || "confirmed"})
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {order.invoice_url && (
                              <a
                                href={order.invoice_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-lg border border-[#bb7068] bg-white px-3 py-1.5 text-xs font-bold text-[#bb7068] hover:bg-[#fbf0eb]"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                  <polyline points="14 2 14 8 20 8"></polyline>
                                </svg>
                                Tax Invoice
                              </a>
                            )}
                            <a
                              href={order.track_url}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-[#bb7068] px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm hover:bg-[#a35d56]"
                            >
                              Track Order
                            </a>
                          </div>
                        </div>

                        {/* Order Items */}
                        <div className="divide-y divide-[#ebdcd0] p-4 sm:p-5">
                          {order.order_items.map((item) => (
                            <div key={item.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                              <div className="flex items-center gap-3">
                                <img
                                  src={item.image_url || "/party-wear-red-dress.png"}
                                  alt={item.product_name}
                                  className="h-16 w-14 rounded-lg object-cover border border-[#e8cdbc]"
                                />
                                <div>
                                  <h4 className="text-sm font-semibold text-[#3a2926]">{item.product_name}</h4>
                                  <p className="text-xs text-[#8b625a]">
                                    Size: <span className="font-semibold text-[#3a2926]">{item.variant_title || "Standard"}</span> • Qty: {item.quantity}
                                  </p>
                                  <p className="text-xs font-medium text-[#73524b] mt-0.5">
                                    ₹{Number(item.unit_price_inr).toLocaleString("en-IN")} each
                                  </p>
                                </div>
                              </div>

                              <div className="text-right">
                                <div className="text-sm font-bold text-[#3a2926]">
                                  ₹{Number(item.total_inr).toLocaleString("en-IN")}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleReorder(item)}
                                  className="mt-1 text-[11px] font-bold text-[#bb7068] hover:underline"
                                >
                                  + Buy Again
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Financial Breakdown & Support */}
                        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#ebdcd0] bg-[#fff8f5] px-4 py-3 sm:px-5">
                          <div className="text-xs text-[#8b625a]">
                            <a
                              href={`https://wa.me/919910762908?text=Hi%20Carnival%20of%20Clothes%2C%20I%20have%20an%20inquiry%20regarding%20my%20Order%20%23${order.order_number}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 font-semibold text-[#2e7d32] hover:underline"
                            >
                              <span>💬 Need help with this order? WhatsApp us</span>
                            </a>
                          </div>

                          <div className="flex items-center gap-4 text-xs">
                            {order.discount_inr > 0 && (
                              <span className="text-[#2e7d32]">Discount: -₹{order.discount_inr}</span>
                            )}
                            <span className="text-[#8b625a]">
                              Shipping: {order.shipping_inr === 0 ? "FREE" : `₹${order.shipping_inr}`}
                            </span>
                            <span className="text-sm font-bold text-[#3a2926]">
                              Total: ₹{Number(order.total_inr).toLocaleString("en-IN")}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Saved Addresses */}
            {activeTab === "addresses" && (
              <div>
                {addresses.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[#ebdcd0] bg-[#fffaf7] p-12 text-center text-sm text-[#73524b]">
                    No addresses stored yet. Addresses are automatically saved when you place an order.
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {addresses.map((addr, idx) => (
                      <div
                        key={idx}
                        className="rounded-2xl border border-[#ebdcd0] bg-[#fffaf7] p-5 shadow-sm"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-[#bb7068]">
                            Address {idx + 1}
                          </span>
                          <span className="rounded-full bg-[#fbf0eb] px-2.5 py-0.5 text-[10px] font-semibold text-[#733b36]">
                            Verified Delivery
                          </span>
                        </div>
                        <h4 className="font-semibold text-sm text-[#3a2926]">{addr.full_name}</h4>
                        <p className="mt-1 text-xs leading-relaxed text-[#73524b]">
                          {addr.line1}
                          {addr.line2 ? `, ${addr.line2}` : ""}
                          <br />
                          {addr.city}, {addr.state} - {addr.postal_code}
                          <br />
                          {addr.country}
                        </p>
                        <p className="mt-2 text-xs text-[#8b625a]">Phone: {addr.phone}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Benefits */}
            {activeTab === "benefits" && (
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-[#ebdcd0] bg-[#fffaf7] p-5">
                  <span className="text-2xl">✨</span>
                  <h4 className="mt-2 font-serif text-base text-[#3a2926]">Free Express Shipping</h4>
                  <p className="mt-1 text-xs text-[#73524b]">
                    All orders above ₹2,999 automatically qualify for priority courier dispatch across India.
                  </p>
                </div>
                <div className="rounded-2xl border border-[#ebdcd0] bg-[#fffaf7] p-5">
                  <span className="text-2xl">🔄</span>
                  <h4 className="mt-2 font-serif text-base text-[#3a2926]">7-Day Size Exchanges</h4>
                  <p className="mt-1 text-xs text-[#73524b]">
                    Garment didn't fit as expected? Contact our WhatsApp concierge within 7 days for a doorstep exchange.
                  </p>
                </div>
                <div className="rounded-2xl border border-[#ebdcd0] bg-[#fffaf7] p-5">
                  <span className="text-2xl">👑</span>
                  <h4 className="mt-2 font-serif text-base text-[#3a2926]">Private Edit Previews</h4>
                  <p className="mt-1 text-xs text-[#73524b]">
                    Returning clients receive early 24-hour access to high-demand Korean and Party Wear drops before public launch.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
