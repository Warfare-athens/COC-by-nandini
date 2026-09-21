import AdminOrderControl from "@/app/components/AdminOrderControl";
import { WhatsAppOrderButton } from "@/app/components/AdminOrderDetailForm";
import { AdminDataTable } from "@/app/components/AdminUI";
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
    const { data } = await getSupabaseAdmin()
      .from("orders")
      .select(
        "id,order_number,email,phone,status,payment_status,fulfillment_status,total_inr,placed_at",
      )
      .order("placed_at", { ascending: false })
      .limit(100);
    orders = (data || []) as OrderRow[];
  }
  return (
    <>
      <div className="admin-head">
        <div><h1>Orders</h1><p>Review payments, fulfillment, customer details, and delivery progress.</p></div>
      </div>
      <section className="admin-panel">
        <AdminDataTable columns={["Order", "Customer", "Payment", "Total", "Fulfillment", "Open"]}>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>
                  <strong>{order.order_number}</strong>
                  <br />
                  <small>
                    {new Date(order.placed_at).toLocaleString("en-IN")}
                  </small>
                </td>
                <td>
                  {order.email}
                  <br />
                  <small>{order.phone}</small>
                </td>
                <td>
                  <span className={`admin-status ${order.payment_status === "paid" ? "good" : order.payment_status === "failed" ? "bad" : "warn"}`}>
                    {order.payment_status === "paid" ? "Paid" : order.payment_status === "failed" ? "Failed" : "Awaiting Payment"}
                  </span>
                  {order.status === "pending_payment" && (
                    <small className="admin-row-sub" style={{ display: "block", color: "#b76e00", fontWeight: 600 }}>
                      Unpaid Draft
                    </small>
                  )}
                </td>
                <td>₹{Number(order.total_inr).toLocaleString("en-IN")}</td>
                <td>
                  <AdminOrderControl
                    id={order.id}
                    current={order.fulfillment_status}
                  />
                </td>
                <td>
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
                <td colSpan={6}>No orders yet.</td>
              </tr>
            )}
        </AdminDataTable>
      </section>
    </>
  );
}
