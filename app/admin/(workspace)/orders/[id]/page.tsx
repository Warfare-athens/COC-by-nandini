import { notFound } from "next/navigation";
import AdminOrderDetailForm, { WhatsAppOrderButton } from "@/app/components/AdminOrderDetailForm";
import AdminLiveRefresh from "@/app/components/AdminLiveRefresh";
import WhatsAppRecoveryAction from "@/app/components/WhatsAppRecoveryAction";
import { getSupabaseAdmin } from "@/db";

type Row = Record<string, unknown>;
const value = (v: unknown, fallback = "—") => v === null || v === undefined || v === "" ? fallback : String(v);
const money = (v: unknown) => `₹${Number(v || 0).toLocaleString("en-IN")}`;
const date = (v: unknown) => v ? new Date(String(v)).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—";
const statusClass = (v: unknown) => ["active", "confirmed", "paid", "processing", "shipped", "delivered", "resolved"].includes(String(v)) ? "good" : ["failed", "cancelled", "payment_failed", "refunded"].includes(String(v)) ? "bad" : "warn";
const eventLabel = (name: unknown) => ({ purchase: "Order completed", checkout_started: "Checkout started", checkout_field_updated: "Checkout details updated", checkout_contact_captured: "Contact details captured", checkout_submitted: "Checkout submitted", checkout_failed: "Checkout failed", add_to_cart: "Product added to cart", product_view: "Product viewed", page_view: "Page viewed", whatsapp_started: "WhatsApp opened" }[String(name)] || String(name || "Activity"));
const fieldLabel = (key: string) => ({ full_name: "Full name", email: "Email", phone: "Phone", line1: "Address", line2: "Apartment", city: "City", state: "State", postal_code: "PIN code", country: "Country", payment_method: "Payment method" }[key] || key.replaceAll("_", " "));

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = getSupabaseAdmin();
  const [{ data, error }, { data: commerceEventData }] = await Promise.all([
    supabase.from("orders").select("*,addresses:shipping_address_id(*),order_items(*),fulfillments(*,tracking_events(*)),payments(*)").eq("id", id).maybeSingle(),
    supabase.from("commerce_events").select("id,anonymous_id,event_name,path,metadata,created_at").eq("order_id", id).order("created_at", { ascending: false }).limit(500),
  ]);
  if (error || !data) notFound();
  const order = data as unknown as Row;
  const address = (order.addresses || {}) as Row;
  const items = (order.order_items || []) as Row[];
  const fulfillments = (order.fulfillments || []) as Row[];
  const fulfillment = fulfillments[0] || {};
  const trackingEvents = (fulfillment.tracking_events || []) as Row[];
  const commerceEvents = (commerceEventData || []) as unknown as Row[];
  const anonymousId = String(commerceEvents[0]?.anonymous_id || "");
  const { data: cartData } = anonymousId ? await supabase.from("carts").select("id,anonymous_token,full_name,email,phone,line1,line2,city,state,postal_code,country,payment_method,checkout_step,status,source,medium,campaign,device,landing_page,referrer,created_at,last_activity_at,cart_items(id,quantity,products(name,price_inr),product_variants(size,title,sku))").eq("anonymous_token", anonymousId).maybeSingle() : { data: null };
  const cart = (cartData || {}) as unknown as Row;
  const cartItems = (cart.cart_items || []) as Row[];
  const trackingActivity: Array<{ label: string; detail: string; at: unknown; metadata?: unknown }> = trackingEvents.map((event) => ({ label: value(event.status, "Tracking update"), detail: value(event.message), at: event.occurred_at }));
  const commerceActivity: Array<{ label: string; detail: string; at: unknown; metadata?: unknown }> = commerceEvents.map((event) => ({ label: eventLabel(event.event_name), detail: value(event.path, "Storefront activity"), at: event.created_at, metadata: event.metadata }));
  const activity = [...trackingActivity, ...commerceActivity].sort((a, b) => new Date(String(b.at || 0)).getTime() - new Date(String(a.at || 0)).getTime());
  const recoveryItems = cartItems.map((item) => { const relation = item.products as Row | Row[] | null; const product = Array.isArray(relation) ? relation[0] : relation; return { name: value(product?.name, "Item"), quantity: Number(item.quantity || 1) }; });
  const checkoutFields = ["full_name", "email", "phone", "line1", "line2", "city", "state", "postal_code", "country", "payment_method"];

  return <>
    <div className="admin-head"><div><a className="admin-back-link" href="/admin/orders">← Orders</a><h1>{value(order.order_number)}</h1><p>{value(order.email)} · {value(order.phone)}</p></div><div className="admin-journey-head-actions"><AdminLiveRefresh />{cart.id ? <a className="admin-small-button" href={`/admin/cart-leads/${value(cart.id)}`}>Customer journey</a> : null}{cart.phone ? <WhatsAppRecoveryAction cartId={value(cart.id)} phone={value(cart.phone)} customerName={value(cart.full_name, "")} items={recoveryItems} currentStatus={value(cart.status)} variant="compact" /> : null}<WhatsAppOrderButton phone={value(order.phone)} orderNumber={value(order.order_number)} customerName={value(address.full_name)} totalInr={value(order.total_inr)} /><a className="admin-button" href={`/admin/invoices/${id}`} target="_blank">Invoice</a></div></div>
    <div className="admin-kpis"><div className="admin-kpi"><small>Order total</small><strong>{money(order.total_inr)}</strong></div><div className="admin-kpi"><small>Payment</small><strong>{value(order.payment_status)}</strong></div><div className="admin-kpi"><small>Fulfillment</small><strong>{value(order.fulfillment_status)}</strong></div><div className="admin-kpi"><small>Activity events</small><strong>{activity.length}</strong></div></div>
    <div className="admin-detail-grid admin-journey-grid"><section>
      <div className="admin-panel" style={{ margin: 0 }}><div className="admin-panel-head"><h2>Items</h2><b>{items.length} lines</b></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Product</th><th>SKU</th><th>Qty</th><th>Total</th></tr></thead><tbody>{items.map((item) => <tr key={value(item.id)}><td><b>{value(item.product_name)}</b><small className="admin-row-sub">{value(item.variant_title)}</small></td><td>{value(item.sku)}</td><td>{value(item.quantity)}</td><td>{money(item.total_inr)}</td></tr>)}</tbody></table></div></div>
      <div className="admin-panel"><div className="admin-panel-head"><h2>Update order & tracking</h2></div><AdminOrderDetailForm order={{ id, status: value(order.status), fulfillment_status: value(order.fulfillment_status), carrier: value(fulfillment.carrier) === "—" ? null : value(fulfillment.carrier), tracking_number: value(fulfillment.tracking_number) === "—" ? null : value(fulfillment.tracking_number), tracking_url: value(fulfillment.tracking_url) === "—" ? null : value(fulfillment.tracking_url) }} /></div>
      <div className="admin-panel"><div className="admin-panel-head"><h2>Full activity timeline</h2><b>{activity.length} events</b></div>{activity.length ? <div className="admin-journey-timeline">{activity.map((event, index) => <article key={`${String(event.at)}-${index}`}><i /><div><div><b>{event.label}</b><time>{date(event.at)}</time></div><small>{event.detail}</small>{event.metadata ? <div className="admin-event-metadata">{Object.entries(event.metadata as Row).filter(([, item]) => item !== null && item !== "").map(([key, item]) => <span key={key}>{fieldLabel(key)}: {typeof item === "object" ? JSON.stringify(item) : String(item)}</span>)}</div> : null}</div></article>)}</div> : <div className="admin-empty">No activity events recorded for this order.</div>}</div>
    </section><aside>
      <div className="admin-panel" style={{ margin: 0 }}><div className="admin-panel-head"><h2>Customer & checkout</h2><span className={`admin-status ${statusClass(order.status)}`}>{value(order.status)}</span></div><div className="admin-checkout-fields">{checkoutFields.map((key) => { const item = cart[key] ?? (key === "full_name" ? address.full_name : key === "email" ? order.email : key === "phone" ? order.phone : undefined); return <div className={item ? "is-filled" : "is-missing"} key={key}><small>{fieldLabel(key)}</small><b>{value(item, "Not captured")}</b><i>{item ? "✓" : "×"}</i></div>; })}</div></div>
      <div className="admin-panel"><div className="admin-panel-head"><h2>Acquisition</h2></div><div className="admin-summary-list"><div><span>Source</span><b>{value(cart.source, "Direct")}</b></div><div><span>Medium</span><b>{value(cart.medium, "None")}</b></div><div><span>Campaign</span><b>{value(cart.campaign, "None")}</b></div><div><span>Device</span><b>{value(cart.device, "Unknown")}</b></div><div><span>Landing page</span><b className="admin-break-value">{value(cart.landing_page, "Not captured")}</b></div><div><span>Referrer</span><b className="admin-break-value">{value(cart.referrer, "Direct visit")}</b></div></div></div>
      <div className="admin-panel"><div className="admin-panel-head"><h2>Order summary</h2></div><div className="admin-summary-list"><div><span>Subtotal</span><b>{money(order.subtotal_inr)}</b></div><div><span>Discount</span><b>{money(order.discount_inr)}</b></div><div><span>Shipping</span><b>{money(order.shipping_inr)}</b></div><div><span>Tax</span><b>{money(order.tax_inr)}</b></div><div><span>Total</span><b>{money(order.total_inr)}</b></div><div><span>Method</span><b>{value(order.payment_method)}</b></div></div></div>
      <div className="admin-panel"><div className="admin-panel-head"><h2>Delivery address</h2></div><div className="admin-summary-list"><p>{value(address.full_name)}<br />{value(address.line1)} {value(address.line2) === "—" ? "" : value(address.line2)}<br />{value(address.city)}, {value(address.state)} {value(address.postal_code)}<br />{value(address.country)}</p></div></div>
    </aside></div>
  </>;
}
