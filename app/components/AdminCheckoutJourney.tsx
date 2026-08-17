import { notFound } from "next/navigation";
import AdminShell from "./AdminShell";
import { AdminRecordAction } from "./AdminModuleActions";
import AdminLiveRefresh from "./AdminLiveRefresh";
import { getSupabaseAdmin } from "@/db";

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
    .filter(([key, item]) => !["cartId"].includes(key) && item !== null && item !== "")
    .map(([key, item]) => {
      const label = fieldLabels[key] || key.replaceAll(/([A-Z])/g, " $1").replaceAll("_", " ");
      const displayed = Array.isArray(item) ? item.map((entry) => fieldLabels[String(entry)] || String(entry)).join(", ") : typeof item === "object" ? JSON.stringify(item) : String(item);
      return `${label}: ${displayed}`;
    });
}

export default async function AdminCheckoutJourney({ cartId, backHref, backLabel }: { cartId: string; backHref: string; backLabel: string }) {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase.from("carts").select("*,cart_items(id,quantity,products(id,name,slug,price_inr,hero_image_url),product_variants(id,size,title,sku))").eq("id", cartId).maybeSingle();
  if (!data) notFound();
  const cart = data as unknown as Row;
  const items = (cart.cart_items || []) as Row[];
  const { data: eventData } = await supabase.from("commerce_events").select("id,event_name,path,product_id,order_id,metadata,created_at").eq("anonymous_id", String(cart.anonymous_token)).order("created_at", { ascending: false }).limit(1000);
  const events = (eventData || []) as unknown as Row[];
  const purchase = events.find((event) => event.event_name === "purchase" && event.order_id);
  const totalValue = items.reduce((sum, item) => {
    const relation = item.products as Row | Row[] | null;
    const product = Array.isArray(relation) ? relation[0] : relation;
    return sum + Number(item.quantity || 0) * Number(product?.price_inr || 0);
  }, 0);
  const required = [cart.full_name, cart.email, cart.phone, cart.line1, cart.city, cart.state, cart.postal_code, cart.country];
  const completion = Math.round(required.filter(Boolean).length / required.length * 100);
  const firstEvent = events.at(-1);
  const pageViews = events.filter((event) => event.event_name === "page_view");
  const productViews = events.filter((event) => event.event_name === "product_view");
  const adds = events.filter((event) => event.event_name === "add_to_cart");
  const failures = events.filter((event) => event.event_name === "checkout_failed");
  const checkoutFields: [string, unknown][] = [["Full name",cart.full_name],["Email",cart.email],["Phone",cart.phone],["Address",cart.line1],["Apartment",cart.line2],["City",cart.city],["State",cart.state],["PIN code",cart.postal_code],["Country",cart.country],["Payment",cart.payment_method]];
  const phone = value(cart.phone, "");
  const email = value(cart.email, "");

  return <AdminShell>
    <div className="admin-head"><div><a className="admin-back-link" href={backHref}>← {backLabel}</a><h1>{value(cart.full_name, "Anonymous checkout")}</h1><p>{value(cart.email)} · {value(cart.phone)}</p></div><div className="admin-journey-head-actions"><AdminLiveRefresh/>{purchase&&<a className="admin-button" href={`/admin/orders/${value(purchase.order_id)}`}>Open order</a>}<AdminRecordAction module="carts" id={cartId} current={value(cart.status)} options={["active","contacted","recovered","abandoned","closed"]}/></div></div>
    <div className="admin-kpis"><div className="admin-kpi"><small>Checkout completion</small><strong>{completion}%</strong></div><div className="admin-kpi"><small>Cart value</small><strong>{money(totalValue)}</strong></div><div className="admin-kpi"><small>Journey events</small><strong>{events.length}</strong></div><div className="admin-kpi"><small>Current stage</small><strong>{value(cart.checkout_step, "cart")}</strong></div></div>
    <div className="admin-detail-grid admin-journey-grid">
      <section>
        <div className="admin-panel" style={{margin:0}}><div className="admin-panel-head"><h2>Customer and checkout draft</h2><span className={`admin-status ${statusClass(cart.status)}`}>{value(cart.status)}</span></div><div className="admin-checkout-fields">
          {checkoutFields.map(([label,item])=><div className={item?"is-filled":"is-missing"} key={label}><small>{label}</small><b>{value(item,"Not entered")}</b><i>{item?"✓":"×"}</i></div>)}
        </div></div>
        <div className="admin-panel"><div className="admin-panel-head"><h2>Cart contents</h2><b>{items.reduce((sum,item)=>sum+Number(item.quantity||0),0)} items</b></div>{items.length?<div className="admin-journey-products">{items.map((item)=>{const productRelation=item.products as Row|Row[]|null;const product=Array.isArray(productRelation)?productRelation[0]:productRelation;const variantRelation=item.product_variants as Row|Row[]|null;const variant=Array.isArray(variantRelation)?variantRelation[0]:variantRelation;return <a href={`/product/${value(product?.slug,"")}`} target="_blank" key={value(item.id)}><img src={value(product?.hero_image_url, "/images/logo-mark.png")} alt=""/><span><b>{value(product?.name)}</b><small>{value(variant?.size || variant?.title)} · Qty {value(item.quantity)}</small></span><strong>{money(Number(product?.price_inr||0)*Number(item.quantity||0))}</strong></a>})}</div>:<div className="admin-empty">This visitor has no current cart items.</div>}</div>
        <div className="admin-panel"><div className="admin-panel-head"><h2>Complete behavior timeline</h2><b>{events.length} events</b></div>{events.length?<div className="admin-journey-timeline">{events.map((event)=>{const details=metadataText(event.metadata);return <article key={value(event.id)}><i/><div><div><b>{eventLabels[value(event.event_name)]||value(event.event_name)}</b><time>{date(event.created_at)}</time></div><small>{value(event.path,"Site activity")}</small>{details.length>0&&<div className="admin-event-metadata">{details.map((detail)=><span key={detail}>{detail}</span>)}</div>}</div></article>})}</div>:<div className="admin-empty">No journey events recorded.</div>}</div>
      </section>
      <aside>
        <div className="admin-panel" style={{margin:0}}><div className="admin-panel-head"><h2>Acquisition source</h2></div><div className="admin-summary-list"><div><span>Source</span><b>{value(cart.source,"direct")}</b></div><div><span>Medium</span><b>{value(cart.medium,"none")}</b></div><div><span>Campaign</span><b>{value(cart.campaign,"none")}</b></div><div><span>Device</span><b>{value(cart.device)}</b></div><div><span>Landing page</span><b>{value(cart.landing_page || firstEvent?.path)}</b></div><div><span>Referrer</span><b className="admin-break-value">{value(cart.referrer,"Direct visit")}</b></div></div></div>
        <div className="admin-panel"><div className="admin-panel-head"><h2>Journey summary</h2></div><div className="admin-summary-list"><div><span>First seen</span><b>{date(firstEvent?.created_at || cart.created_at)}</b></div><div><span>Last active</span><b>{date(cart.last_activity_at)}</b></div><div><span>Page views</span><b>{pageViews.length}</b></div><div><span>Product views</span><b>{productViews.length}</b></div><div><span>Add-to-cart actions</span><b>{adds.length}</b></div><div><span>Checkout errors</span><b>{failures.length}</b></div></div></div>
        <div className="admin-panel"><div className="admin-panel-head"><h2>Contact customer</h2></div><div className="admin-contact-actions">{phone&&<a href={`https://wa.me/91${phone.replace(/\D/g,"").slice(-10)}`} target="_blank">WhatsApp</a>}{phone&&<a href={`tel:${phone.replace(/[^\d+]/g,"")}`}>Call</a>}{email&&<a href={`mailto:${email}`}>Email</a>}</div></div>
      </aside>
    </div>
  </AdminShell>;
}
