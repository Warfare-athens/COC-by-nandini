import AdminOrderControl from "@/app/components/AdminOrderControl";
import AdminLiveRefresh from "@/app/components/AdminLiveRefresh";
import { WhatsAppOrderButton } from "@/app/components/AdminOrderDetailForm";
import { AdminDataTable, AdminPageHeader } from "@/app/components/AdminUI";
import { commerceConfigured, getSupabaseAdmin } from "@/db";
import { adminRangeStart } from "@/lib/admin-time";
import { getAdminDays } from "@/lib/admin-time-server";
import { isPlacedOrder, orderPaymentLabel, orderPaymentTone } from "@/lib/admin-commerce";

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const days = await getAdminDays((await searchParams).days);
  const since = adminRangeStart(days);
  const { data, error } = commerceConfigured()
    ? await getSupabaseAdmin().from("orders")
      .select("id,cart_id,order_number,email,phone,status,payment_status,payment_method,fulfillment_status,total_inr,placed_at,confirmed_at")
      .or(`placed_at.gte.${since},confirmed_at.gte.${since}`).order("placed_at", { ascending: false }).limit(200)
    : { data: [], error: null };
  if (error) throw new Error(`Unable to load orders: ${error.message}`);
  const orders = data || [];

  return <>
    <AdminPageHeader title="Orders" actions={<AdminLiveRefresh />} />
    <section className="admin-panel">
      <AdminDataTable dateFiltered columns={["Order", "Placed", "Customer", "Status", "Payment", "Total", "Fulfillment", "Open"]}>
        {orders.map((order) => {
          const placed = isPlacedOrder(order);
          return <tr key={order.id}>
            <td><a className="admin-table-link" href={`/admin/orders/${order.id}`}>{order.order_number}</a></td>
            <td data-date={order.placed_at}>{new Date(order.placed_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</td>
            <td>{order.email}{/(^|[_-])(test|cod)[_-]|@example\.com$/i.test(order.email) && <small className="admin-status warn">Test data</small>}<small className="admin-row-sub">{order.phone}</small></td>
            <td>{order.status === "pending_payment" ? "Payment draft" : order.status.replaceAll("_", " ")}</td>
            <td><span className={`admin-status ${orderPaymentTone(order.payment_status)}`}>{orderPaymentLabel(order.payment_status, order.payment_method)}</span></td>
            <td>₹{Number(order.total_inr).toLocaleString("en-IN")}</td>
            <td>{placed ? <AdminOrderControl id={order.id} current={order.fulfillment_status} /> : order.fulfillment_status.replaceAll("_", " ")}</td>
            <td><div className="admin-commerce-actions">
              <a className="admin-small-button" href={`/admin/orders/${order.id}`}>Details</a>
              {order.cart_id && <a className="admin-small-button" href={`/admin/checkouts/${order.cart_id}`}>Journey</a>}
              {placed && <WhatsAppOrderButton phone={order.phone} orderNumber={order.order_number} totalInr={order.total_inr} />}
            </div></td>
          </tr>;
        })}
        {!orders.length && <tr><td colSpan={8}>No orders in this date range.</td></tr>}
      </AdminDataTable>
    </section>
  </>;
}
