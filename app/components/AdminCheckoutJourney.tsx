import { notFound } from "next/navigation";
import { AdminRecordAction } from "./AdminModuleActions";
import AdminLiveRefresh from "./AdminLiveRefresh";
import { AdminCustomerLines } from "./AdminUI";
import WhatsAppRecoveryAction from "./WhatsAppRecoveryAction";
import { getSupabaseAdmin } from "@/db";
import { cartIsOpen, cartItemValue, cartValue, orderPaymentLabel } from "@/lib/admin-commerce";
import { commerceActionLabels } from "@/lib/commerce-actions";

type Row = Record<string, unknown>;
const value = (input: unknown, fallback = "—") => input === null || input === undefined || input === "" ? fallback : String(input);
const money = (input: unknown) => `₹${Number(input || 0).toLocaleString("en-IN")}`;
const date = (input: unknown) => input ? new Date(String(input)).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—";
const statusClass = (input: unknown) => ["active", "recovered", "converted"].includes(String(input)) ? "good" : ["closed", "failed", "abandoned"].includes(String(input)) ? "bad" : "warn";

const eventLabels: Record<string, string> = {
  page_view: "Viewed a page",
  product_view: "Viewed a product",
  add_to_cart: "Added a product to cart",
  remove_from_cart: "Removed a product from cart",
  cart_quantity_changed: "Changed cart quantity",
  cart_viewed: "Opened the cart",
  coupon_applied: "Applied a coupon",
  coupon_rejected: "Coupon was rejected",
  coupon_removed: "Removed a coupon",
  checkout_started: "Started checkout",
  checkout_field_updated: "Updated checkout details",
  checkout_contact_captured: "Entered contact details",
  checkout_submitted: "Submitted checkout",
  checkout_failed: "Checkout failed",
  order_created: "Created order",
  payment_failed: "Payment failed",
  payment_authorized: "Payment authorized",
  payment_requires_review: "Payment needs review",
  button_clicked: "Clicked storefront control",
  cart_status_updated: "Admin updated cart status",
  whatsapp_started: "Started WhatsApp",
  purchase: "Completed the order",
};

const fieldLabels: Record<string, string> = {
  fullName: "Name", email: "Email", phone: "Phone", line1: "Address", line2: "Apartment",
  city: "City", state: "State", postalCode: "PIN code", country: "Country", paymentMethod: "Payment method",
};

function metadataText(input: unknown) {
  if (!input || typeof input !== "object") return [];
  return Object.entries(input as Record<string, unknown>)
    .filter(([key, item]) => !["cartId", "visitorId"].includes(key) && item !== null && item !== "")
    .map(([key, item]) => {
      const label = fieldLabels[key] || key.replaceAll(/([A-Z])/g, " $1").replaceAll("_", " ");
      const action = key === "action" ? commerceActionLabels[item as keyof typeof commerceActionLabels] : undefined;
      const displayed = action || (Array.isArray(item) ? item.map((entry) => fieldLabels[String(entry)] || String(entry)).join(", ") : typeof item === "object" ? JSON.stringify(item) : String(item));
      return `${label}: ${displayed}`;
    });
}

export default async function AdminCheckoutJourney({ cartId, backHref, backLabel }: { cartId: string; backHref: string; backLabel: string }) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("carts").select("*,cart_items(id,quantity,products(id,name,slug,price_inr,hero_image_url),product_variants(id,size,title,sku,price_inr)),orders(id,order_number,status,payment_status,payment_method,placed_at)").eq("id", cartId).maybeSingle();
  if (error) throw new Error(`Unable to load checkout journey: ${error.message}`);
  if (!data) notFound();
  const cart = data as unknown as Row;
  const items = (cart.cart_items || []) as Row[];
  const { data: eventData } = await supabase.from("commerce_events").select("id,event_name,path,product_id,order_id,metadata,created_at").eq("anonymous_id", String(cart.anonymous_token)).order("created_at", { ascending: false }).limit(1000);
  const events = (eventData || []) as unknown as Row[];
  const orders = ((cart.orders || []) as Row[]).sort((a, b) => String(b.placed_at).localeCompare(String(a.placed_at)));
  const open = cartIsOpen(cart) && items.length > 0;
  const totalValue = cartValue(cart);
  const required = [cart.full_name, cart.email, cart.phone, cart.line1, cart.city, cart.state, cart.postal_code, cart.country];
  const completion = Math.round(required.filter(Boolean).length / required.length * 100);
  const firstEvent = events.at(-1);
  const pageViews = events.filter((event) => event.event_name === "page_view");
  const productViews = events.filter((event) => event.event_name === "product_view");
  const adds = events.filter((event) => event.event_name === "add_to_cart");
  const failures = events.filter((event) => event.event_name === "checkout_failed");
  const phone = value(cart.phone, "");
  const email = value(cart.email, "");
  const recoveryItems = items.map((item) => {
    const productRelation = item.products as Row | Row[] | null;
    const product = Array.isArray(productRelation) ? productRelation[0] : productRelation;
    return { name: value(product?.name, ""), quantity: Number(item.quantity || 1) };
  });

  return <>
    <div className="admin-head"><div><a className="admin-back-link" href={backHref}>← {backLabel}</a><h1>{value(cart.full_name, "Anonymous checkout")}</h1></div><div className="admin-journey-head-actions"><AdminLiveRefresh/>{open && phone && <WhatsAppRecoveryAction cartId={cartId} phone={phone} customerName={value(cart.full_name, "")} items={recoveryItems} currentStatus={value(cart.status)} variant="compact"/>}{orders[0] && <a className="admin-button" href={`/admin/orders/${value(orders[0].id)}`}>Open latest order</a>}{open && <AdminRecordAction module="carts" id={cartId} current={value(cart.status)} options={["active","contacted","recovered","abandoned","closed"]}/>}</div></div>
    <div className="admin-kpis"><div className="admin-kpi"><small>Checkout completion</small><strong>{completion}%</strong></div><div className="admin-kpi"><small>Cart value</small><strong>{money(totalValue)}</strong></div><div className="admin-kpi"><small>Journey events</small><strong>{events.length}</strong></div><div className="admin-kpi"><small>Current stage</small><strong>{value(cart.checkout_step, "cart")}</strong></div></div>
    <div className="admin-detail-grid admin-journey-grid">
      <section>
        <div className="admin-panel" style={{margin:0}}><AdminCustomerLines email={cart.email} phone={cart.phone} address={cart} status={<>
          <span className={`admin-status ${statusClass(cart.status)}`}>{value(cart.status)}</span>
          {Boolean(cart.payment_method) && <span>{cart.payment_method === "cod" ? "Cash on delivery" : value(cart.payment_method)}</span>}
        </>} /></div>
        <div className="admin-panel"><div className="admin-panel-head"><h2>Cart contents</h2><b>{items.reduce((sum,item)=>sum+Number(item.quantity||0),0)} items</b></div>{items.length?<div className="admin-journey-products">{items.map((item)=>{const productRelation=item.products as Row|Row[]|null;const product=Array.isArray(productRelation)?productRelation[0]:productRelation;const variantRelation=item.product_variants as Row|Row[]|null;const variant=Array.isArray(variantRelation)?variantRelation[0]:variantRelation;return <a href={`/product/${value(product?.slug,"")}`} target="_blank" key={value(item.id)}><img src={value(product?.hero_image_url, "/images/logo-mark.png")} alt=""/><span><b>{value(product?.name)}</b><small>{value(variant?.size || variant?.title)} · Qty {value(item.quantity)}</small></span><strong>{money(cartItemValue(item))}</strong></a>})}</div>:<div className="admin-empty">This visitor has no current cart items.</div>}</div>
        {orders.length > 0 && <div className="admin-panel"><div className="admin-panel-head"><h2>Linked orders</h2></div><div className="admin-summary-list">{orders.map((order) => <div key={value(order.id)}><a href={`/admin/orders/${value(order.id)}`}>{value(order.order_number)}</a><b>{order.status === "cancelled" ? "Cancelled · " : ""}{orderPaymentLabel(order.payment_status, order.payment_method)}</b></div>)}</div></div>}
        <div className="admin-panel"><div className="admin-panel-head"><h2>Complete behavior timeline</h2><b>{events.length} events</b></div>{events.length?<div className="admin-journey-timeline">{events.map((event)=>{const details=metadataText(event.metadata);return <article key={value(event.id)}><i/><div><div><b>{eventLabels[value(event.event_name)]||value(event.event_name)}</b><time>{date(event.created_at)}</time></div><small>{value(event.path,"Site activity")}</small>{details.length>0&&<div className="admin-event-metadata">{details.map((detail)=><span key={detail}>{detail}</span>)}</div>}</div></article>})}</div>:<div className="admin-empty">No journey events recorded.</div>}</div>
      </section>
      <aside>
        <div className="admin-panel" style={{margin:0}}><div className="admin-panel-head"><h2>Acquisition source</h2></div><div className="admin-summary-list"><div><span>Source</span><b>{value(cart.source,"direct")}</b></div><div><span>Medium</span><b>{value(cart.medium,"none")}</b></div><div><span>Campaign</span><b>{value(cart.campaign,"none")}</b></div><div><span>Device</span><b>{value(cart.device)}</b></div><div><span>Landing page</span><b>{value(cart.landing_page || firstEvent?.path)}</b></div><div><span>Referrer</span><b className="admin-break-value">{value(cart.referrer,"Direct visit")}</b></div></div></div>
        <div className="admin-panel"><div className="admin-panel-head"><h2>Journey summary</h2></div><div className="admin-summary-list"><div><span>First seen</span><b>{date(firstEvent?.created_at || cart.created_at)}</b></div><div><span>Last active</span><b>{date(cart.last_activity_at)}</b></div><div><span>Page views</span><b>{pageViews.length}</b></div><div><span>Product views</span><b>{productViews.length}</b></div><div><span>Add-to-cart actions</span><b>{adds.length}</b></div><div><span>Checkout errors</span><b>{failures.length}</b></div></div></div>
        <div className="admin-panel"><div className="admin-panel-head"><h2>Contact customer</h2></div><div style={{ padding: "18px" }}>{open && <WhatsAppRecoveryAction cartId={cartId} phone={phone} customerName={value(cart.full_name, "")} items={recoveryItems} currentStatus={value(cart.status)} variant="journey"/>}<div className="admin-contact-actions" style={{ padding: "12px 0 0", borderTop: "1px solid #efded5" }}>{phone&&<a href={`tel:${phone.replace(/[^\d+]/g,"")}`}>Call</a>}{email&&<a href={`mailto:${email}`}>Email</a>}</div></div></div>
      </aside>
    </div>
  </>;
}
