import AdminOrderControl from "@/app/components/AdminOrderControl";
import { WhatsAppOrderButton } from "@/app/components/AdminOrderDetailForm";
import { AdminDataTable, AdminPageHeader } from "@/app/components/AdminUI";
import { commerceConfigured, getSupabaseAdmin } from "@/db";

type OrderRow = {
  id: string;
  order_number: string;
  email: string;
  phone: string;
  status: string;
  payment_status: string;
  fulfillment_status: string;
  total_inr: number;
  placed_at: string;
};

export default async function AdminOrdersPage() {
  let orders: OrderRow[] = [];
  if (commerceConfigured()) {
    const { data, error } = await getSupabaseAdmin()
      .from("orders")
      .select(
        "id,order_number,email,phone,status,payment_status,fulfillment_status,total_inr,placed_at",
      )
      .order("placed_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(`Unable to load orders: ${error.message}`);
    orders = (data || []) as OrderRow[];
  }
  const paymentLabel = (status: string) => ({ paid: "Paid", failed: "Failed", payment_pending: "Awaiting payment", pending: "Awaiting payment" }[status] || status.replaceAll("_", " "));
  const isTestEmail = (email: string) => /(^|[_-])(test|cod)[_-]|@example\.com$/i.test(email);
  return (
    <>
      <AdminPageHeader title="Orders">Review payments, fulfillment, customer details, and delivery progress.</AdminPageHeader>
      <section className="admin-panel">
        <AdminDataTable columns={["Order", "Placed", "Customer", "Payment", "Total", "Fulfillment", "Open"]}>
            {orders.map((order) => (
              <tr key={order.id}>
                <td data-label="Order">
                  <strong>{order.order_number}</strong>
                </td>
                <td data-label="Placed" data-date={order.placed_at}><small>{new Date(order.placed_at).toLocaleString("en-IN")}</small></td>
                <td data-label="Customer">
                  {order.email}
                  {isTestEmail(order.email) && <span className="admin-status warn" style={{ display: "inline-flex", marginLeft: 6 }}>Test data</span>}
                  <br />
                  <small>{order.phone}</small>
                </td>
                <td data-label="Payment">
                  <span className={`admin-status ${order.payment_status === "paid" ? "good" : order.payment_status === "failed" ? "bad" : "warn"}`}>
                    {paymentLabel(order.payment_status)}
                  </span>
                  {order.status === "pending_payment" && (
                    <small className="admin-row-sub" style={{ display: "block", color: "#b76e00", fontWeight: 600 }}>
                      Unpaid Draft
                    </small>
                  )}
                </td>
                <td data-label="Total">₹{Number(order.total_inr).toLocaleString("en-IN")}</td>
                <td data-label="Fulfillment">
                  <AdminOrderControl
                    id={order.id}
                    current={order.fulfillment_status}
                  />
                </td>
                <td data-label="Open">
                  <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    <a className="admin-small-button" href={`/admin/orders/${order.id}`}>Details</a>
                    <WhatsAppOrderButton
                      phone={order.phone}
                      orderNumber={order.order_number}
                      totalInr={order.total_inr}
                    />
                  </div>
                </td>
              </tr>
            ))}
            {!orders.length && (
              <tr>
                <td colSpan={7}>No orders yet.</td>
              </tr>
            )}
        </AdminDataTable>
      </section>
    </>
  );
}
