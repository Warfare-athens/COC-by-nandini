import AdminShell from "@/app/components/AdminShell";
import { requireAdmin } from "@/lib/admin-auth";
import { adminDashboardData } from "@/lib/commerce";

type OrderRow = {
  id: string;
  order_number: string;
  email: string;
  fulfillment_status: string;
  total_inr: number;
};

export default async function AdminDashboard() {
  await requireAdmin();
  const data = await adminDashboardData();
  return (
    <AdminShell>
      <div className="admin-head">
        <h1>Store overview</h1>
        <a className="admin-button" href="/admin/products/new">
          Add product
        </a>
      </div>
      {!data.configured && (
        <div className="admin-error">Supabase is not connected.</div>
      )}
      <div className="admin-grid" style={{ marginTop: 22 }}>
        <div className="admin-card">
          <span>Recent revenue</span>
          <strong>₹{data.revenue.toLocaleString("en-IN")}</strong>
        </div>
        <div className="admin-card">
          <span>Recent orders</span>
          <strong>{data.orderCount}</strong>
        </div>
        <div className="admin-card">
          <span>Low stock variants</span>
          <strong>{data.lowStockCount}</strong>
        </div>
      </div>
      <section className="admin-panel">
        <div className="admin-panel-head">
          <h2>Latest orders</h2>
          <a href="/admin/orders">View all →</a>
        </div>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Status</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {data.orders.map((order: OrderRow) => (
              <tr key={order.id}>
                <td>{order.order_number}</td>
                <td>{order.email}</td>
                <td>
                  <span className="admin-status">
                    {order.fulfillment_status}
                  </span>
                </td>
                <td>₹{Number(order.total_inr).toLocaleString("en-IN")}</td>
              </tr>
            ))}
            {!data.orders.length && (
              <tr>
                <td colSpan={4}>No orders yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </AdminShell>
  );
}
