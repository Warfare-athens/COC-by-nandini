import { notFound } from "next/navigation";
import AdminShell from "@/app/components/AdminShell";
import { AdminCreateForm, AdminRecordAction } from "@/app/components/AdminModuleActions";
import AdminLiveRefresh from "@/app/components/AdminLiveRefresh";
import { requireAdmin } from "@/lib/admin-auth";
import { commerceConfigured, getSupabaseAdmin } from "@/db";
import { BLOG_POSTS } from "@/lib/blogs";
import { COLLECTIONS } from "@/lib/collections";

const modules = ["ai-visibility", "content", "images", "reviews", "templates", "partnerships", "invoices", "tracking", "stock-requests", "checkouts", "cart-leads", "coupon-leads", "feedback", "customers", "login-activity", "data-export"];
type Row = Record<string, unknown>;
const text = (value: unknown) => String(value ?? "—");
const date = (value: unknown) => value ? new Date(String(value)).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—";
const money = (value: unknown) => `₹${Number(value || 0).toLocaleString("en-IN")}`;
const statusClass = (value: unknown) => ["active", "approved", "published", "paid", "delivered", "resolved", "notified", "recovered", "converted"].includes(String(value)) ? "good" : ["rejected", "failed", "cancelled", "archived", "closed"].includes(String(value)) ? "bad" : "warn";

function Head({ title, action }: { title: string; action?: React.ReactNode }) { const live = ["Checkouts", "Cart Leads"].includes(title); return <div className="admin-head"><h1>{title}</h1>{action || (live ? <AdminLiveRefresh/> : null)}</div>; }
function Kpis({ items }: { items: [string, React.ReactNode][] }) { return <div className="admin-kpis">{items.map(([label, value]) => <div className="admin-kpi" key={label}><small>{label}</small><strong>{value}</strong></div>)}</div>; }
function Empty({ label = "No records yet." }: { label?: string }) { return <div className="admin-empty">{label}</div>; }
function Panel({ title, children }: { title: string; children: React.ReactNode }) { return <section className="admin-panel"><div className="admin-panel-head"><h2>{title}</h2></div>{children}</section>; }

async function rows(table: string, select = "*", order = "created_at", limit = 200): Promise<Row[]> {
  if (!commerceConfigured()) return [];
  const { data } = await getSupabaseAdmin().from(table).select(select).order(order, { ascending: false }).limit(limit);
  return (data || []) as unknown as Row[];
}

export default async function AdminModulePage({ params }: { params: Promise<{ module: string }> }) {
  await requireAdmin(); const { module } = await params; if (!modules.includes(module)) notFound();

  if (module === "ai-visibility") {
    const products = await rows("products", "id,status,seo_title,seo_description,hero_image_url,short_description,search_keywords", "updated_at");
    const active = products.filter((item) => item.status === "active");
    const complete = active.filter((item) => item.seo_title && item.seo_description && item.hero_image_url && item.short_description && item.search_keywords).length;
    const score = active.length ? Math.round(complete / active.length * 100) : 0;
    return <AdminShell><Head title="AI Visibility"/><Kpis items={[["Visibility score", `${score}%`], ["Indexable products", active.length], ["Journal guides", BLOG_POSTS.length], ["Collections", COLLECTIONS.length]]}/><div className="admin-detail-grid"><Panel title="Search readiness"><div className="admin-summary-list"><div><span>Product metadata complete</span><b>{complete}/{active.length}</b></div><div><span>Product sitemap</span><b>Automatic</b></div><div><span>Structured product data</span><b>Enabled</b></div><div><span>Brand entity schema</span><b>Enabled</b></div><div><span>AI crawler guide</span><a href="/llms.txt" target="_blank">Open ↗</a></div><div><span>RSS feed</span><a href="/blog/rss.xml" target="_blank">Open ↗</a></div></div></Panel><Panel title="Coverage"><div style={{padding:22,display:"grid",placeItems:"center",gap:16}}><div className="admin-score">{score}</div><div className="admin-progress" style={{width:"100%"}}><span style={{width:`${score}%`}}/></div><a className="admin-small-button" href="/sitemap.xml" target="_blank">Open sitemap</a></div></Panel></div></AdminShell>;
  }

  if (module === "content") {
    const [entries, subscribers] = await Promise.all([
      rows("content_entries"),
      rows("newsletter_subscribers", "id,email,status,source,subscribed_at", "subscribed_at", 500),
    ]);
    return <AdminShell><Head title="Content"/><Kpis items={[["Managed content", entries.length], ["Published", entries.filter(r=>r.status==="published").length], ["Built-in guides", BLOG_POSTS.length], ["Subscribers", subscribers.filter(r=>r.status==="subscribed").length]]}/><Panel title="Add content"><AdminCreateForm module="content"/></Panel><Panel title="Content library">{entries.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Title</th><th>Type</th><th>Status</th><th>Updated</th><th>Action</th></tr></thead><tbody>{entries.map(row=><tr key={text(row.id)}><td><b>{text(row.title)}</b><small className="admin-row-sub">/{text(row.slug)}</small></td><td>{text(row.type)}</td><td><span className={`admin-status ${statusClass(row.status)}`}>{text(row.status)}</span></td><td>{date(row.updated_at)}</td><td><AdminRecordAction module="content" id={text(row.id)} current={text(row.status)} options={["draft","published","archived"]}/></td></tr>)}</tbody></table></div>:<Empty/>}</Panel><Panel title="Newsletter subscribers">{subscribers.length?<div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Email</th><th>Source</th><th>Status</th><th>Subscribed</th></tr></thead><tbody>{subscribers.map(row=><tr key={text(row.id)}><td><b>{text(row.email)}</b></td><td>{text(row.source)}</td><td><span className={`admin-status ${statusClass(row.status)}`}>{text(row.status)}</span></td><td>{date(row.subscribed_at)}</td></tr>)}</tbody></table></div>:<Empty label="No newsletter subscribers yet."/>}</Panel></AdminShell>;
  }

  if (module === "images") {
    const [assets, productImages] = await Promise.all([rows("media_assets"), rows("product_images", "id,url,alt_text,is_hero,created_at,products(name)")]);
    const all: Row[] = [...assets.map(item=>({...item,source:"Library"})), ...productImages.map(item=>({...item,source:"Product"}))];
    return <AdminShell><Head title="Images"/><Kpis items={[["Library", assets.length], ["Product images", productImages.length], ["Total assets", all.length], ["Missing alt text", all.filter(r=>!r.alt_text).length]]}/><Panel title="Upload"><AdminCreateForm module="media"/></Panel><Panel title="Image library">{all.length?<div className="admin-media-grid">{all.map((row,index)=><article className="admin-media-tile" key={`${text(row.id)}-${index}`}><img src={text(row.url)} alt={text(row.alt_text || "Carnival of Clothes image")}/><div><small>{text(row.alt_text || row.filename || "No alt text")}</small><small>{text(row.source)} · {text(row.folder || "products")}</small></div></article>)}</div>:<Empty/>}</Panel></AdminShell>;
  }

  if (module === "reviews") {
    const reviews = await rows("product_reviews", "id,customer_name,email,rating,title,body,status,is_verified,created_at,products(name)");
    return <AdminShell><Head title="Reviews"/><Kpis items={[["All reviews",reviews.length],["Pending",reviews.filter(r=>r.status==="pending").length],["Approved",reviews.filter(r=>r.status==="approved").length],["Average rating",reviews.length?(reviews.reduce((sum,r)=>sum+Number(r.rating||0),0)/reviews.length).toFixed(1):"—"]]}/><Panel title="Review moderation">{reviews.length?<div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Customer</th><th>Review</th><th>Rating</th><th>Status</th><th>Moderate</th></tr></thead><tbody>{reviews.map(row=><tr key={text(row.id)}><td><b>{text(row.customer_name)}</b><small className="admin-row-sub">{text(row.email)}</small></td><td><b>{text(row.title)}</b><small className="admin-row-sub">{text(row.body)}</small></td><td>{"★".repeat(Number(row.rating||0))}</td><td><span className={`admin-status ${statusClass(row.status)}`}>{text(row.status)}</span></td><td><AdminRecordAction module="reviews" id={text(row.id)} current={text(row.status)} options={["pending","approved","rejected"]}/></td></tr>)}</tbody></table></div>:<Empty/>}</Panel></AdminShell>;
  }

  if (module === "templates") {
    const templates = await rows("admin_templates");
    return <AdminShell><Head title="Templates"/><Kpis items={[["Templates",templates.length],["Active",templates.filter(r=>r.is_active).length],["Email",templates.filter(r=>r.type==="email").length],["Content",templates.filter(r=>r.type==="content").length]]}/><Panel title="New template"><AdminCreateForm module="templates"/></Panel><Panel title="Saved templates">{templates.length?<div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Name</th><th>Type</th><th>Subject</th><th>Status</th><th>Action</th></tr></thead><tbody>{templates.map(row=><tr key={text(row.id)}><td><b>{text(row.name)}</b></td><td>{text(row.type)}</td><td>{text(row.subject)}</td><td><span className={`admin-status ${row.is_active?"good":"bad"}`}>{row.is_active?"active":"inactive"}</span></td><td><AdminRecordAction module="templates" id={text(row.id)} current={row.is_active?"active":"inactive"} options={["active","inactive"]}/></td></tr>)}</tbody></table></div>:<Empty/>}</Panel></AdminShell>;
  }

  if (module === "partnerships") {
    const partnerships = await rows("partnerships");
    return <AdminShell><Head title="Partnerships"/><Kpis items={[["Contacts",partnerships.length],["Leads",partnerships.filter(r=>r.status==="lead").length],["Active",partnerships.filter(r=>r.status==="active").length],["Pipeline",money(partnerships.reduce((sum,r)=>sum+Number(r.value_inr||0),0))]]}/><Panel title="Add partnership"><AdminCreateForm module="partnerships"/></Panel><Panel title="Pipeline">{partnerships.length?<div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Contact</th><th>Type</th><th>Value</th><th>Status</th><th>Update</th></tr></thead><tbody>{partnerships.map(row=><tr key={text(row.id)}><td><b>{text(row.name)}</b><small className="admin-row-sub">{text(row.company)} · {text(row.email)}</small></td><td>{text(row.type)}</td><td>{money(row.value_inr)}</td><td><span className={`admin-status ${statusClass(row.status)}`}>{text(row.status)}</span></td><td><AdminRecordAction module="partnerships" id={text(row.id)} current={text(row.status)} options={["lead","contacted","negotiating","active","closed"]}/></td></tr>)}</tbody></table></div>:<Empty/>}</Panel></AdminShell>;
  }

  if (module === "invoices") {
    const invoices = await rows("orders", "id,order_number,email,total_inr,payment_status,fulfillment_status,placed_at", "placed_at");
    return <AdminShell><Head title="Invoice Engine"/><Kpis items={[["Invoices",invoices.length],["Paid",invoices.filter(r=>r.payment_status==="paid").length],["COD pending",invoices.filter(r=>r.payment_status==="pending").length],["Total billed",money(invoices.reduce((sum,r)=>sum+Number(r.total_inr||0),0))]]}/><Panel title="Invoices">{invoices.length?<div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Invoice</th><th>Customer</th><th>Total</th><th>Payment</th><th>Document</th></tr></thead><tbody>{invoices.map(row=><tr key={text(row.id)}><td><b>INV-{text(row.order_number)}</b><small className="admin-row-sub">{date(row.placed_at)}</small></td><td>{text(row.email)}</td><td>{money(row.total_inr)}</td><td><span className={`admin-status ${statusClass(row.payment_status)}`}>{text(row.payment_status)}</span></td><td><a className="admin-small-button" href={`/admin/invoices/${text(row.id)}`} target="_blank">View / Print</a></td></tr>)}</tbody></table></div>:<Empty/>}</Panel></AdminShell>;
  }

  if (module === "tracking") {
    const tracking = await rows("fulfillments", "id,order_id,status,carrier,tracking_number,tracking_url,estimated_delivery_at,updated_at,orders(order_number,email)", "updated_at");
    return <AdminShell><Head title="Tracking"/><Kpis items={[["Shipments",tracking.length],["Processing",tracking.filter(r=>r.status==="processing").length],["In transit",tracking.filter(r=>["shipped","out_for_delivery"].includes(text(r.status))).length],["Delivered",tracking.filter(r=>r.status==="delivered").length]]}/><Panel title="Shipment tracking">{tracking.length?<div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Order</th><th>Carrier</th><th>Tracking</th><th>Status</th><th>Open</th></tr></thead><tbody>{tracking.map(row=>{const order=(row.orders||{}) as Row;return <tr key={text(row.id)}><td><b>{text(order.order_number)}</b><small className="admin-row-sub">{text(order.email)}</small></td><td>{text(row.carrier)}</td><td>{text(row.tracking_number)}</td><td><span className={`admin-status ${statusClass(row.status)}`}>{text(row.status)}</span></td><td><a className="admin-small-button" href={`/admin/orders/${text(row.order_id)}`}>Manage</a></td></tr>})}</tbody></table></div>:<Empty/>}</Panel></AdminShell>;
  }

  if (module === "stock-requests") {
    const requests = await rows("stock_requests", "id,customer_name,email,phone,requested_size,status,created_at,products(name)");
    return <AdminShell><Head title="Stock Requests"/><Kpis items={[["Requests",requests.length],["Waiting",requests.filter(r=>r.status==="requested").length],["Notified",requests.filter(r=>r.status==="notified").length],["Converted",requests.filter(r=>r.status==="converted").length]]}/><Panel title="Add request"><AdminCreateForm module="stock-requests"/></Panel><Panel title="Requests">{requests.length?<div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Customer</th><th>Product / size</th><th>Date</th><th>Status</th><th>Update</th></tr></thead><tbody>{requests.map(row=><tr key={text(row.id)}><td><b>{text(row.customer_name)}</b><small className="admin-row-sub">{text(row.email)} · {text(row.phone)}</small></td><td>{text(row.requested_size)}</td><td>{date(row.created_at)}</td><td><span className={`admin-status ${statusClass(row.status)}`}>{text(row.status)}</span></td><td><AdminRecordAction module="stock-requests" id={text(row.id)} current={text(row.status)} options={["requested","contacted","notified","converted","closed"]}/></td></tr>)}</tbody></table></div>:<Empty/>}</Panel></AdminShell>;
  }

  if (module === "checkouts") {
    const [orders,carts,purchases] = await Promise.all([
      rows("orders", "id,order_number,email,total_inr,status,payment_status,fulfillment_status,placed_at", "placed_at", 1000),
      rows("carts", "id,anonymous_token,full_name,email,phone,status,checkout_step,source,medium,campaign,device,last_activity_at,created_at,cart_items(id,quantity,products(name,price_inr))", "last_activity_at", 1000),
      rows("commerce_events", "anonymous_id,order_id,event_name,created_at", "created_at", 2000),
    ]);
    const cartByToken = new Map(carts.map((cart)=>[text(cart.anonymous_token),cart]));
    const cartForOrder = new Map(purchases.filter((event)=>event.event_name==="purchase"&&event.order_id).map((event)=>[text(event.order_id),cartByToken.get(text(event.anonymous_id))]));
    const live = carts.filter((cart)=>!["converted","closed","empty"].includes(text(cart.status)) && (cart.full_name || cart.email || cart.phone || cart.checkout_step));
    return <AdminShell><Head title="Checkouts"/><Kpis items={[["Completed",orders.length],["Live checkout drafts",live.length],["Dropped at payment",live.filter(r=>r.checkout_step==="payment").length],["Revenue",money(orders.reduce((sum,r)=>sum+Number(r.total_inr||0),0))]]}/><Panel title="Live checkout journeys">{live.length?<div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Customer</th><th>Progress</th><th>Source</th><th>Status</th><th>Last activity</th><th>Journey</th></tr></thead><tbody>{live.map(row=><tr key={text(row.id)}><td><a className="admin-table-link" href={`/admin/checkouts/${text(row.id)}`}>{text(row.full_name)}</a><small className="admin-row-sub">{text(row.email)} · {text(row.phone)}</small></td><td><span className="admin-status warn">{text(row.checkout_step || "cart")}</span></td><td><b>{text(row.source || "direct")}</b><small className="admin-row-sub">{text(row.medium)} · {text(row.device)}</small></td><td><span className={`admin-status ${statusClass(row.status)}`}>{text(row.status)}</span></td><td>{date(row.last_activity_at)}</td><td><a className="admin-small-button" href={`/admin/checkouts/${text(row.id)}`}>View journey</a></td></tr>)}</tbody></table></div>:<Empty label="No checkout drafts yet."/>}</Panel><Panel title="Recent completed checkouts">{orders.length?<div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Payment</th><th>Open</th></tr></thead><tbody>{orders.map(row=>{const linkedCart=cartForOrder.get(text(row.id));return <tr key={text(row.id)}><td><b>{text(row.order_number)}</b><small className="admin-row-sub">{date(row.placed_at)}</small></td><td>{text(row.email)}</td><td>{money(row.total_inr)}</td><td><span className={`admin-status ${statusClass(row.payment_status)}`}>{text(row.payment_status)}</span></td><td><a className="admin-small-button" href={linkedCart?`/admin/checkouts/${text(linkedCart.id)}`:`/admin/orders/${text(row.id)}`}>{linkedCart?"View journey":"Order details"}</a></td></tr>})}</tbody></table></div>:<Empty/>}</Panel></AdminShell>;
  }

  if (module === "cart-leads") {
    const [carts, cartEvents] = await Promise.all([
      rows("carts", "id,anonymous_token,full_name,email,phone,status,checkout_step,source,medium,campaign,device,last_activity_at,created_at,cart_items(id,quantity,products(name,price_inr))", "last_activity_at", 1000),
      rows("commerce_events", "id,anonymous_id,event_name,path,metadata,created_at", "created_at", 1000),
    ]);
    // Server-rendered operational cutoff; it must reflect the request time.
    // eslint-disable-next-line react-hooks/purity
    const staleBoundary = Date.now() - 60 * 60 * 1000;
    const isStale = (row: Row) => !["converted","recovered","closed","empty"].includes(String(row.status)) && new Date(String(row.last_activity_at)).getTime() <= staleBoundary;
    const value = (row: Row) => ((row.cart_items || []) as Row[]).reduce((sum,item) => {
      const relation = item.products as Row | Row[] | null;
      const product = Array.isArray(relation) ? relation[0] : relation;
      return sum + Number(item.quantity || 0) * Number(product?.price_inr || 0);
    }, 0);
    const identified = carts.filter(row => row.full_name || row.email || row.phone);
    const contactable = carts.filter(row => row.email || row.phone);
    const recoverableValue = carts.filter(row => (row.email || row.phone) && !["converted","recovered","closed","empty"].includes(String(row.status)) && (isStale(row) || ["checkout","abandoned","contacted"].includes(String(row.status)))).reduce((sum,row)=>sum+value(row),0);
    return <AdminShell><Head title="Cart Leads"/><Kpis items={[["Tracked carts",carts.length],["Identified",identified.length],["Contactable",contactable.length],["Recoverable value",money(recoverableValue)]]}/><Panel title="Cart activity">{carts.length?<div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Lead</th><th>Contact</th><th>Source</th><th>Items</th><th>Value</th><th>Status</th><th>Journey</th><th>Follow up</th></tr></thead><tbody>{carts.map(row=>{const items=(row.cart_items||[]) as Row[];const displayStatus=isStale(row)?"stale":text(row.status);return <tr key={text(row.id)}><td><a className="admin-table-link" href={`/admin/cart-leads/${text(row.id)}`}>{text(row.full_name || text(row.anonymous_token).slice(0,12))}</a><small className="admin-row-sub">{items.map(item=>{const relation=item.products as Row|Row[]|null;const product=Array.isArray(relation)?relation[0]:relation;return text(product?.name)}).filter(name=>name!=="—").join(", ")||"No items"}</small></td><td><b>{text(row.email)}</b><small className="admin-row-sub">{text(row.phone)}</small></td><td><b>{text(row.source || "direct")}</b><small className="admin-row-sub">{text(row.medium)} · {text(row.device)}</small></td><td>{items.reduce((sum,item)=>sum+Number(item.quantity||0),0)}</td><td><b>{money(value(row))}</b></td><td><span className={`admin-status ${displayStatus==="stale"?"warn":statusClass(displayStatus)}`}>{displayStatus}</span><small className="admin-row-sub">{text(row.checkout_step || "cart")}</small></td><td><a className="admin-small-button" href={`/admin/cart-leads/${text(row.id)}`}>View journey</a></td><td><AdminRecordAction module="carts" id={text(row.id)} current={text(row.status)} options={["active","contacted","recovered","abandoned","closed"]}/></td></tr>})}</tbody></table></div>:<Empty label="No server-side carts yet."/>}</Panel><Panel title="Tracking health"><div className="admin-summary-list"><div><span>Add-to-cart events</span><b>{cartEvents.filter(row=>row.event_name==="add_to_cart").length}</b></div><div><span>Cart views</span><b>{cartEvents.filter(row=>row.event_name==="cart_viewed").length}</b></div><div><span>Checkout field updates</span><b>{cartEvents.filter(row=>row.event_name==="checkout_field_updated").length}</b></div><div><span>Checkout starts</span><b>{new Set(cartEvents.filter(row=>row.event_name==="checkout_started").map(row=>row.anonymous_id)).size}</b></div><div><span>Captured checkout contacts</span><b>{new Set(cartEvents.filter(row=>row.event_name==="checkout_contact_captured").map(row=>row.anonymous_id)).size}</b></div><div><span>Checkout errors</span><b>{cartEvents.filter(row=>row.event_name==="checkout_failed").length}</b></div></div></Panel></AdminShell>;
  }

  if (module === "coupon-leads") {
    const [promotions,uses] = await Promise.all([rows("promotions"),rows("orders", "id,coupon_code,total_inr,email,placed_at", "placed_at")]); const couponUses=uses.filter(r=>r.coupon_code);
    return <AdminShell><Head title="Coupon Leads"/><Kpis items={[["Coupons",promotions.length],["Active",promotions.filter(r=>r.is_active).length],["Redemptions",couponUses.length],["Coupon revenue",money(couponUses.reduce((sum,r)=>sum+Number(r.total_inr||0),0))]]}/><Panel title="Create coupon"><AdminCreateForm module="coupons"/></Panel><Panel title="Coupons">{promotions.length?<div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Coupon</th><th>Offer</th><th>Usage</th><th>Status</th><th>Action</th></tr></thead><tbody>{promotions.map(row=><tr key={text(row.id)}><td><b>{text(row.code)}</b><small className="admin-row-sub">{text(row.name)}</small></td><td>{text(row.type)} · {text(row.value)}</td><td>{text(row.usage_count)} / {text(row.usage_limit)}</td><td><span className={`admin-status ${row.is_active?"good":"bad"}`}>{row.is_active?"active":"inactive"}</span></td><td><AdminRecordAction module="coupons" id={text(row.id)} current={row.is_active?"active":"inactive"} options={["active","inactive"]}/></td></tr>)}</tbody></table></div>:<Empty/>}</Panel></AdminShell>;
  }

  if (module === "feedback") {
    const feedback = await rows("customer_feedback");
    return <AdminShell><Head title="Feedback"/><Kpis items={[["All feedback",feedback.length],["New",feedback.filter(r=>r.status==="new").length],["Resolved",feedback.filter(r=>r.status==="resolved").length],["Average rating",feedback.filter(r=>r.rating).length?(feedback.reduce((s,r)=>s+Number(r.rating||0),0)/feedback.filter(r=>r.rating).length).toFixed(1):"—"]]}/><Panel title="Customer feedback">{feedback.length?<div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Customer</th><th>Message</th><th>Rating</th><th>Status</th><th>Update</th></tr></thead><tbody>{feedback.map(row=><tr key={text(row.id)}><td><b>{text(row.name)}</b><small className="admin-row-sub">{text(row.email)}</small></td><td>{text(row.message)}</td><td>{row.rating?`${text(row.rating)}/5`:"—"}</td><td><span className={`admin-status ${statusClass(row.status)}`}>{text(row.status)}</span></td><td><AdminRecordAction module="feedback" id={text(row.id)} current={text(row.status)} options={["new","in_progress","resolved","archived"]}/></td></tr>)}</tbody></table></div>:<Empty/>}</Panel></AdminShell>;
  }

  if (module === "customers") {
    const orders = await rows("orders", "id,email,phone,total_inr,placed_at,status", "placed_at", 1000); const customerMap=new Map<string,{email:string;phone:string;orders:number;spent:number;last:string}>(); for(const row of orders){const email=text(row.email);const current=customerMap.get(email)||{email,phone:text(row.phone),orders:0,spent:0,last:text(row.placed_at)};current.orders++;current.spent+=Number(row.total_inr||0);if(String(row.placed_at)>current.last)current.last=text(row.placed_at);customerMap.set(email,current)} const customers=[...customerMap.values()].sort((a,b)=>b.spent-a.spent);
    return <AdminShell><Head title="Customers"/><Kpis items={[["Customers",customers.length],["Repeat",customers.filter(c=>c.orders>1).length],["Orders",orders.length],["Lifetime revenue",money(customers.reduce((s,c)=>s+c.spent,0))]]}/><Panel title="Customer directory">{customers.length?<div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Customer</th><th>Phone</th><th>Orders</th><th>Lifetime value</th><th>Last order</th></tr></thead><tbody>{customers.map(customer=><tr key={customer.email}><td><b>{customer.email}</b></td><td>{customer.phone}</td><td>{customer.orders}</td><td>{money(customer.spent)}</td><td>{date(customer.last)}</td></tr>)}</tbody></table></div>:<Empty/>}</Panel></AdminShell>;
  }

  if (module === "login-activity") {
    const activity = await rows("audit_logs", "id,actor,action,entity_type,metadata,created_at", "created_at", 300); const sessions=activity.filter(row=>String(row.action).startsWith("session."));
    return <AdminShell><Head title="Login Activity"/><Kpis items={[["Sessions logged",sessions.length],["Logins",sessions.filter(r=>r.action==="session.login").length],["Logouts",sessions.filter(r=>r.action==="session.logout").length],["All admin actions",activity.length]]}/><Panel title="Security activity">{activity.length?<div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Action</th><th>Actor</th><th>Record</th><th>Date</th></tr></thead><tbody>{activity.map(row=><tr key={text(row.id)}><td><b>{text(row.action)}</b></td><td>{text(row.actor)}</td><td>{text(row.entity_type)}<small className="admin-row-sub">{text(row.entity_id)}</small></td><td>{date(row.created_at)}</td></tr>)}</tbody></table></div>:<Empty/>}</Panel></AdminShell>;
  }

  const exports = [["Products","products"],["Inventory","inventory"],["Orders","orders"],["Customers","customers"],["Reviews","reviews"],["Coupons","coupons"],["Newsletter","newsletter"],["Analytics events","analytics"],["Audit log","audit"]];
  return <AdminShell><Head title="Data Export"/><Kpis items={[["Export sets",exports.length],["Format","CSV"],["Access","Admin only"],["Generated","On demand"]]}/><Panel title="Download data"><div className="admin-media-grid">{exports.map(([label,type])=><a className="admin-card" href={`/api/admin/export/${type}`} key={type}><span>{label}</span><strong style={{fontSize:22}}>Download CSV ↓</strong></a>)}</div></Panel></AdminShell>;
}
