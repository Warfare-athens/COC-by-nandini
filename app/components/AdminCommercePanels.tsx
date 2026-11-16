import AdminLiveRefresh from "./AdminLiveRefresh";
import { AdminRecordAction } from "./AdminModuleActions";
import { AdminDataTable, AdminEmptyState, AdminPageHeader, AdminPanel, AdminStatCard } from "./AdminUI";
import WhatsAppRecoveryAction from "./WhatsAppRecoveryAction";
import { commerceConfigured, getSupabaseAdmin } from "@/db";
import { adminRangeStart } from "@/lib/admin-time";
import {
  cartDisplayStatus, cartIsOpen, cartValue, hasCartContact, isPlacedOrder, isRecoverableCart,
  orderPaymentLabel, orderPaymentTone, relatedRow, type CommerceRow as Row,
} from "@/lib/admin-commerce";

const text = (value: unknown) => String(value || "—");
const money = (value: unknown) => `₹${Number(value || 0).toLocaleString("en-IN")}`;
const date = (value: unknown) => value ? new Date(String(value)).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }) : "—";
const readable = (value: unknown) => text(value).replaceAll("_", " ");
const cartOptions = ["active", "contacted", "recovered", "abandoned", "closed"];
const cartFields = "id,anonymous_token,full_name,email,phone,status,checkout_step,source,medium,device,last_activity_at,cart_items(id,quantity,products(name,price_inr),product_variants(price_inr)),orders(id,status,payment_status,payment_method,placed_at)";
const orderFields = "id,cart_id,order_number,email,total_inr,status,payment_status,payment_method,placed_at,confirmed_at";
const cartQuantity = (row: Row) => ((row.cart_items || []) as Row[]).reduce((sum, item) => sum + Number(item.quantity), 0);

async function listCarts(days: number, checkoutOnly = false) {
  if (!commerceConfigured()) return [];
  let query = getSupabaseAdmin().from("carts").select(cartFields).gte("last_activity_at", adminRangeStart(days));
  if (checkoutOnly) query = query.not("checkout_step", "is", null).not("status", "in", "(converted,closed,empty)");
  const { data, error } = await query.order("last_activity_at", { ascending: false }).limit(200);
  if (error) throw new Error(`Unable to load carts: ${error.message}`);
  return (data || []) as Row[];
}

async function listCheckoutOrders(days: number, pending: boolean) {
  if (!commerceConfigured()) return [];
  const supabase = getSupabaseAdmin();
  const dateField = pending ? "placed_at" : "confirmed_at";
  const query = supabase.from("orders").select(orderFields).gte(dateField, adminRangeStart(days));
  const { data, error } = await (pending ? query.eq("status", "pending_payment") :
    query.in("status", ["confirmed","completed"]).or("payment_method.neq.razorpay,payment_status.eq.paid").neq("payment_status", "refunded"))
    .order(dateField, { ascending: false }).limit(200);
  if (error) throw new Error(`Unable to load checkout orders: ${error.message}`);
  return (data || []) as Row[];
}

function CartFollowUp({ cart }: { cart: Row }) {
  if (!cartIsOpen(cart) || cartQuantity(cart) === 0) return null;
  const items = ((cart.cart_items || []) as Row[]).map((item) => ({ name: text(relatedRow(item.products)?.name), quantity: Number(item.quantity) }));
  return <div className="admin-commerce-actions">
    <WhatsAppRecoveryAction cartId={text(cart.id)} phone={text(cart.phone)} customerName={String(cart.full_name || "")} items={items} currentStatus={text(cart.status)} />
    <AdminRecordAction module="carts" id={text(cart.id)} current={text(cart.status)} options={cartOptions} />
  </div>;
}

function CartRows({ carts, now, checkouts = false }: { carts: Row[]; now: number; checkouts?: boolean }) {
  if (!carts.length) return <AdminEmptyState title={checkouts ? "No checkout drafts in this date range." : "No carts in this date range."} />;
  const root = checkouts ? "/admin/checkouts" : "/admin/cart-leads";
  return <AdminDataTable dateFiltered columns={["Customer", "Source", "Bag", "Progress", "Last activity", "Follow up"]}>
    {carts.map((cart) => {
      const status = cartDisplayStatus(cart, now);
      const tone = status === "converted" || status === "recovered" ? "good" : status === "abandoned" ? "bad" : "warn";
      const linked = ((cart.orders || []) as Row[]).filter(isPlacedOrder).sort((a, b) => String(b.placed_at).localeCompare(String(a.placed_at)))[0];
      return <tr key={text(cart.id)}>
        <td><a className="admin-table-link" href={`${root}/${cart.id}`}>{String(cart.full_name || "Anonymous shopper")}</a>
          {Boolean(cart.email) && <small className="admin-row-sub">{text(cart.email)}</small>}
          {Boolean(cart.phone) && <small className="admin-row-sub">{text(cart.phone)}</small>}
          {linked && <small className="admin-row-sub"><a href={`/admin/orders/${linked.id}`}>Open order</a></small>}</td>
        <td>{String(cart.source || "Direct")}{Boolean(cart.device) && <small className="admin-row-sub">{text(cart.device)}</small>}</td>
        <td><b>{money(cartValue(cart))}</b><small className="admin-row-sub">{cartQuantity(cart)} items</small></td>
        <td><span className={`admin-status ${tone}`}>{readable(status)}</span><small className="admin-row-sub">{readable(cart.checkout_step || "cart")}</small></td>
        <td data-date={text(cart.last_activity_at)}>{date(cart.last_activity_at)}</td>
        <td><CartFollowUp cart={cart} /></td>
      </tr>;
    })}
  </AdminDataTable>;
}

function CheckoutOrders({ orders, empty, completed = false }: { orders: Row[]; empty: string; completed?: boolean }) {
  if (!orders.length) return <AdminEmptyState title={empty} />;
  return <AdminDataTable dateFiltered columns={["Order", "Customer", completed ? "Confirmed" : "Started", "Total", "Payment", "Journey"]}>
    {orders.map((order) => <tr key={text(order.id)}>
      <td><a className="admin-table-link" href={`/admin/orders/${order.id}`}>{text(order.order_number)}</a></td>
      <td>{text(order.email)}</td><td data-date={text(order.confirmed_at || order.placed_at)}>{date(order.confirmed_at || order.placed_at)}</td><td>{money(order.total_inr)}</td>
      <td><span className={`admin-status ${orderPaymentTone(order.payment_status)}`}>{orderPaymentLabel(order.payment_status, order.payment_method)}</span></td>
      <td>{order.cart_id ? <a className="admin-small-button" href={`/admin/checkouts/${order.cart_id}`}>View checkout</a> : null}</td>
    </tr>)}
  </AdminDataTable>;
}

export async function AdminCheckouts({ days }: { days: number }) {
  const [carts, pending, completed] = await Promise.all([listCarts(days, true), listCheckoutOrders(days, true), listCheckoutOrders(days, false)]);
  const drafts = carts.filter((cart) => !((cart.orders || []) as Row[]).some((order) => order.status === "pending_payment"));
  const now = new Date().getTime();
  return <>
    <AdminPageHeader title="Checkouts" actions={<AdminLiveRefresh />} />
    <div className="admin-kpis">
      <AdminStatCard label="Recent drafts" value={drafts.length} />
      <AdminStatCard label="Recent payment drafts" value={pending.length} />
      <AdminStatCard label="Recent payment failures" value={pending.filter((order) => order.payment_status === "failed").length} />
      <AdminStatCard label="Recent completed checkouts" value={completed.length} />
    </div>
    <AdminPanel title="Checkout drafts"><CartRows carts={drafts} now={now} checkouts /></AdminPanel>
    <AdminPanel title="Payment drafts"><CheckoutOrders orders={pending} empty="No unpaid checkout orders in this date range." /></AdminPanel>
    <AdminPanel title="Completed checkouts"><CheckoutOrders orders={completed} empty="No completed checkouts in this date range." completed /></AdminPanel>
  </>;
}

export async function AdminCartLeads({ days }: { days: number }) {
  const carts = await listCarts(days);
  const now = new Date().getTime();
  const recoverable = carts.filter((cart) => isRecoverableCart(cart, now));
  return <>
    <AdminPageHeader title="Cart Leads" actions={<AdminLiveRefresh />} />
    <div className="admin-kpis">
      <AdminStatCard label="Recent carts" value={carts.length} />
      <AdminStatCard label="Contactable open carts" value={carts.filter((cart) => cartIsOpen(cart) && cartQuantity(cart) > 0 && hasCartContact(cart)).length} />
      <AdminStatCard label="Recoverable carts" value={recoverable.length} />
      <AdminStatCard label="Recoverable value" value={money(recoverable.reduce((sum, cart) => sum + cartValue(cart), 0))} />
    </div>
    <AdminPanel title="Cart activity"><CartRows carts={carts} now={now} /></AdminPanel>
  </>;
}
