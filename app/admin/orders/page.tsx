import AdminShell from "@/app/components/AdminShell";
import AdminOrderControl from "@/app/components/AdminOrderControl";
import { requireAdmin } from "@/lib/admin-auth";
import { commerceConfigured, getSupabaseAdmin } from "@/db";

type OrderRow = {
  id: string;
  order_number: string;
  email: string;
  phone: string;
  payment_status: string;
  fulfillment_status: string;
  total_inr: number;
  placed_at: string;
};

export default async function AdminOrdersPage() {
  await requireAdmin();
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
    <AdminShell>
      <div className="admin-head">
        <h1>Orders</h1>
      </div>
      <section className="admin-panel">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Payment</th>
              <th>Total</th>
              <th>Fulfillment</th>
            </tr>
          </thead>
          <tbody>
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
                  <span className="admin-status">{order.payment_status}</span>
                </td>
                <td>₹{Number(order.total_inr).toLocaleString("en-IN")}</td>
                <td>
                  <AdminOrderControl
                    id={order.id}
                    current={order.fulfillment_status}
                  />
                </td>
              </tr>
            ))}
            {!orders.length && (
              <tr>
                <td colSpan={5}>No orders yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </AdminShell>
  );
}
