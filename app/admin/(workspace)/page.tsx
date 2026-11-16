import { adminDashboardData } from "@/lib/commerce";
import { getAdminDays } from "@/lib/admin-time-server";
import { ChartNoAxesCombined, CircleCheck, ShoppingBag, Target, TriangleAlert, TrendingUp } from "lucide-react";
import type { ReactNode } from "react";

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

function MetricCard({ label, value, note, tone = "default", icon }: { label: string; value: string; note: string; tone?: "default" | "warning" | "success"; icon: ReactNode }) {
  return <article className={`command-metric is-${tone}`}><div><span>{label}</span><i aria-hidden="true">{icon}</i></div><strong>{value}</strong><small>{note}</small></article>;
}

function RunItem({ href, title, note, value, tone = "default" }: { href: string; title: string; note: string; value: string; tone?: "default" | "warning" | "success" }) {
  return <a className={`command-run-item is-${tone}`} href={href}><span><b>{title}</b><small>{note}</small></span><strong>{value}</strong><i aria-hidden="true">→</i></a>;
}

function FunnelRow({ label, value, width }: { label: string; value: number; width: number }) {
  return <div className="command-funnel-row"><span>{label}</span><div><i style={{ width: `${Math.max(value ? 3 : 0, width)}%` }} /></div><b>{value.toLocaleString("en-IN")}</b></div>;
}

export default async function AdminDashboard({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const days = await getAdminDays((await searchParams).days);
  const data = await adminDashboardData(days);
  const funnelValues = [data.visitors, data.cartVisitors, data.addToCarts, data.checkoutDrafts, data.whatsappStarted, data.orderCount];
  const funnelMax = Math.max(...funnelValues, 1);

  return (
    <>
      <section className="admin-command-center">
        <h1 className="sr-only">Overview</h1>

        {!data.configured && <div className="command-alert">Supabase is not connected. Add the database environment variables to activate live reporting.</div>}

        <div className="command-metrics">
          <MetricCard label="Confirmed order value" value={money(data.revenue)} note={`${data.orderCount} confirmed orders`} icon={<TrendingUp size={18} />} />
          <MetricCard label="Average order" value={money(data.averageOrder)} note={`${data.deliveredOrders} delivered orders`} icon={<ShoppingBag size={18} />} />
          <MetricCard label="Abandoned value" value={money(data.abandonedValue)} note={`${data.recoverableCarts} recoverable cart lead${data.recoverableCarts === 1 ? "" : "s"}`} tone="warning" icon={<TriangleAlert size={18} />} />
          <MetricCard label="Conversion" value={percent(data.conversion)} note={`${data.visitors} visitors to ${data.orderCount} orders`} tone="success" icon={<Target size={18} />} />
        </div>

        <div className="command-work-grid">
          <section className="command-panel">
            <div className="command-panel-head"><h2>To do</h2><span aria-hidden="true"><CircleCheck size={18} /></span></div>
            <div className="command-run-list">
              <RunItem href="/admin/cart-leads" title="Recover checkout leads" note={`${money(data.abandonedValue)} recoverable value`} value={String(data.recoverableCarts)} tone="warning" />
              <RunItem href="/admin/orders" title="Move open orders" note="Confirmed, processing, or shipped orders still active" value={String(data.openOrders)} tone="success" />
              <RunItem href="/admin/checkouts" title="Review checkouts" note="Checkout-to-order conversion" value={percent(data.checkoutToOrder)} />
              <RunItem href="/admin/products" title="Restock inventory" note="Active variants at or below the low-stock threshold" value={String(data.lowStockCount)} tone="warning" />
            </div>
          </section>

          <section className="command-panel">
            <div className="command-panel-head"><h2>Conversion Funnel</h2><span aria-hidden="true"><ChartNoAxesCombined size={18} /></span></div>
            <div className="command-funnel">
              <FunnelRow label="Visitors" value={data.visitors} width={data.visitors / funnelMax * 100} />
              <FunnelRow label="Cart visitors" value={data.cartVisitors} width={data.cartVisitors / funnelMax * 100} />
              <FunnelRow label="Add to carts" value={data.addToCarts} width={data.addToCarts / funnelMax * 100} />
              <FunnelRow label="Checkout starts" value={data.checkoutDrafts} width={data.checkoutDrafts / funnelMax * 100} />
              <FunnelRow label="WhatsApp started" value={data.whatsappStarted} width={data.whatsappStarted / funnelMax * 100} />
              <FunnelRow label="Orders" value={data.orderCount} width={data.orderCount / funnelMax * 100} />
            </div>
            <div className="command-ratios">
              <div><span>Visitor to cart</span><strong>{percent(data.visitorToCart)}</strong></div>
              <div><span>Cart to draft</span><strong>{percent(data.cartToCheckout)}</strong></div>
              <div><span>Checkout to order</span><strong>{percent(data.checkoutToOrder)}</strong></div>
              <div><span>Visitor to order</span><strong>{percent(data.conversion)}</strong></div>
            </div>
          </section>
        </div>

        <section className="command-panel command-orders">
          <div className="command-panel-head"><h2>Recent orders</h2><a href="/admin/orders">View all →</a></div>
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
