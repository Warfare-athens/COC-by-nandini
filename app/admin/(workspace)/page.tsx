import AdminDashboardControls from "@/app/components/AdminDashboardControls";
import { adminDashboardData } from "@/lib/commerce";

type OrderRow = {
  id: string;
  order_number: string;
  email: string;
  fulfillment_status: string;
  payment_status: string;
  total_inr: number;
};

const money = (value: number) => `₹${value.toLocaleString("en-IN")}`;
const percent = (value: number) => `${value.toFixed(1)}%`;

function MetricCard({ label, value, note, tone = "default", icon }: { label: string; value: string; note: string; tone?: "default" | "warning" | "success"; icon: string }) {
  return <article className={`command-metric is-${tone}`}><div><span>{label}</span><i aria-hidden="true">{icon}</i></div><strong>{value}</strong><small>{note}</small></article>;
}

function RunItem({ href, title, note, value, tone = "default" }: { href: string; title: string; note: string; value: string; tone?: "default" | "warning" | "success" }) {
  return <a className={`command-run-item is-${tone}`} href={href}><span><b>{title}</b><small>{note}</small></span><strong>{value}</strong><i aria-hidden="true">→</i></a>;
}

function FunnelRow({ label, value, width }: { label: string; value: number; width: number }) {
  return <div className="command-funnel-row"><span>{label}</span><div><i style={{ width: `${Math.max(value ? 3 : 0, width)}%` }} /></div><b>{value.toLocaleString("en-IN")}</b></div>;
}

export default async function AdminDashboard({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const query = await searchParams;
  const requestedDays = Number(query.days || 30);
  const days = [1, 7, 30, 90].includes(requestedDays) ? requestedDays : 30;
  const data = await adminDashboardData(days);
  const funnelValues = [data.visitors, data.cartVisitors, data.addToCarts, data.checkoutDrafts, data.whatsappStarted, data.orderCount];
  const funnelMax = Math.max(...funnelValues, 1);

  return (
    <>
      <section className="admin-command-center">
        <header className="command-header">
          <div>
            <span>Daily operating view</span>
            <h1>Command Center</h1>
            <p>Revenue, funnel leakage, source quality, demand, and customer signals in one working view.</p>
          </div>
          <AdminDashboardControls days={days} />
        </header>

        {!data.configured && <div className="command-alert">Supabase is not connected. Add the database environment variables to activate live reporting.</div>}

        <div className="command-metrics">
          <MetricCard label="Revenue" value={money(data.revenue)} note={`${data.orderCount} non-cancelled orders`} icon="↗︎" />
          <MetricCard label="Average order" value={money(data.averageOrder)} note={`${data.deliveredOrders} delivered orders`} icon="▣" />
          <MetricCard label="Abandoned value" value={money(data.abandonedValue)} note={`${data.recoverableCarts} recoverable cart leads`} tone="warning" icon="△" />
          <MetricCard label="Conversion" value={percent(data.conversion)} note={`${data.visitors} visitors to ${data.orderCount} orders`} tone="success" icon="◎" />
        </div>

        <div className="command-work-grid">
          <section className="command-panel">
            <div className="command-panel-head"><div><h2>Morning Run List</h2><p>The jobs that move money today.</p></div><span aria-hidden="true">◇</span></div>
            <div className="command-run-list">
              <RunItem href="/admin/cart-leads" title="Recover checkout leads" note={`${money(data.abandonedValue)} recoverable value`} value={String(data.recoverableCarts)} tone="warning" />
              <RunItem href="/admin/orders" title="Move open orders" note="Confirmed, processing, or shipped orders still active" value={String(data.openOrders)} tone="success" />
              <RunItem href="/admin/checkouts" title="Fix funnel leaks" note="Checkout draft to order conversion" value={percent(data.checkoutToOrder)} />
              <RunItem href="/admin/products" title="Restock inventory" note="Active variants at or below the low-stock threshold" value={String(data.lowStockCount)} tone="warning" />
            </div>
          </section>

          <section className="command-panel">
            <div className="command-panel-head"><div><h2>Conversion Funnel</h2><p>Where demand turns into orders.</p></div><span aria-hidden="true">⌁</span></div>
            <div className="command-funnel">
              <FunnelRow label="Visitors" value={data.visitors} width={data.visitors / funnelMax * 100} />
              <FunnelRow label="Cart visitors" value={data.cartVisitors} width={data.cartVisitors / funnelMax * 100} />
              <FunnelRow label="Add to carts" value={data.addToCarts} width={data.addToCarts / funnelMax * 100} />
              <FunnelRow label="Checkout drafts" value={data.checkoutDrafts} width={data.checkoutDrafts / funnelMax * 100} />
              <FunnelRow label="WhatsApp started" value={data.whatsappStarted} width={data.whatsappStarted / funnelMax * 100} />
              <FunnelRow label="Orders" value={data.orderCount} width={data.orderCount / funnelMax * 100} />
            </div>
            <div className="command-ratios">
              <div><span>Visitor to cart</span><strong>{percent(data.visitorToCart)}</strong></div>
              <div><span>Cart to draft</span><strong>{percent(data.cartToCheckout)}</strong></div>
              <div><span>Draft to order</span><strong>{percent(data.checkoutToOrder)}</strong></div>
              <div><span>Visitor to order</span><strong>{percent(data.conversion)}</strong></div>
            </div>
          </section>
        </div>

        <section className="command-panel command-orders">
          <div className="command-panel-head"><div><h2>Live Order Queue</h2><p>The newest orders inside this reporting window.</p></div><a href="/admin/orders">View all →</a></div>
          <div className="command-table-wrap">
            <table>
              <thead><tr><th>Order</th><th>Customer</th><th>Payment</th><th>Fulfillment</th><th>Total</th><th /></tr></thead>
              <tbody>
                {(data.orders as OrderRow[]).map((order) => <tr key={order.id}><td><b>{order.order_number}</b></td><td>{order.email}</td><td><span>{order.payment_status}</span></td><td><span>{order.fulfillment_status}</span></td><td><b>{money(Number(order.total_inr))}</b></td><td><a href={`/admin/orders/${order.id}`}>Open →</a></td></tr>)}
                {!data.orders.length && <tr><td colSpan={6}><div className="command-empty">No orders in this window yet. Visitor and cart activity will appear automatically as shoppers use the site.</div></td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </>
  );
}
