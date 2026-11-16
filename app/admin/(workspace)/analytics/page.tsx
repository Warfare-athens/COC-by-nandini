import AdminAnalyticsTrend from "@/app/components/AdminAnalyticsTrend";
import { AdminDataTable, AdminEmptyState, AdminPageHeader, AdminPanel, AdminStatCard } from "@/app/components/AdminUI";
import { getShopAnalytics } from "@/lib/admin-analytics";
import { getAdminDays } from "@/lib/admin-time-server";
import { BLOG_POSTS } from "@/lib/blogs";
import { COLLECTIONS } from "@/lib/collections";
import { commerceActionLabels } from "@/lib/commerce-actions";

const count = (value: number) => value.toLocaleString("en-IN");
const inr = (value: number) => `₹${count(value)}`;
const rate = (part: number, total: number) => total ? `${(part / total * 100).toFixed(1)}%` : "—";

export default async function AdminAnalyticsPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const days = await getAdminDays((await searchParams).days);
  const data = await getShopAnalytics(days);
  const { indexable, complete } = data.visibility;
  const buttons = data.buttons.filter((entry) => Object.hasOwn(commerceActionLabels, entry.action));

  return <>
    <AdminPageHeader title="Analytics" />
    <div className="admin-kpis admin-analytics-kpis">
      <AdminStatCard label="Unique visitors" value={count(data.visitors)} note={`${count(data.pageViews)} page views`} />
      <AdminStatCard label="Add-to-cart actions" value={count(data.addToCarts)} note={`${count(data.cartVisitors)} shoppers added an item`} />
      <AdminStatCard label="Checkout starts" value={count(data.checkoutStarts)} note={`${count(data.checkoutSubmits)} submit attempts`} />
      <AdminStatCard label="Completed orders" value={count(data.orders)} note={`${inr(data.sales)} order value`} tone="success" />
    </div>

    <div className="admin-analytics-grid is-trend">
      <AdminPanel title="Daily activity"><AdminAnalyticsTrend days={data.trend} /></AdminPanel>
      <AdminPanel title="Checkout activity">
        <div className="admin-summary-list">
          <div><span>Shopping bag views</span><b>{count(data.cartViews)}</b></div>
          <div><span>Carts with contact details entered</span><b>{count(data.contacts)}</b></div>
          <div><span>Checkout submit attempts</span><b>{count(data.checkoutSubmits)}</b></div>
          <div><span>Checkout errors and exits</span><b>{count(data.checkoutFailures)}</b></div>
          <div><span>Checkout-to-order conversion</span><b>{rate(data.linkedOrders, data.checkoutStarts)}</b></div>
          <div><span>WhatsApp opens</span><b>{count(data.whatsapp)}</b></div>
        </div>
      </AdminPanel>
    </div>

    <div className="admin-analytics-grid">
      <AdminPanel title="Most viewed products">
        {data.products.length ? <AdminDataTable columns={["Product", "Views", "Unique viewers", "Adds to cart"]}>
          {data.products.map((product) => <tr key={product.slug}>
            <td><a className="admin-table-link" href={`/product/${encodeURIComponent(product.slug)}`} target="_blank" rel="noreferrer">{product.name}</a></td>
            <td>{count(product.views)}</td><td>{count(product.visitors)}</td><td>{count(product.adds)}</td>
          </tr>)}
        </AdminDataTable> : <AdminEmptyState title="No product views in this date range." />}
      </AdminPanel>
      <AdminPanel title="Storefront buttons">
        {buttons.length ? <AdminDataTable columns={["Action", "Clicks", "Unique visitors"]}>
          {buttons.map((entry) => <tr key={entry.action}>
            <td>{commerceActionLabels[entry.action as keyof typeof commerceActionLabels]}</td><td>{count(entry.clicks)}</td><td>{count(entry.visitors)}</td>
          </tr>)}
        </AdminDataTable> : <AdminEmptyState title="No tracked button clicks in this date range." />}
      </AdminPanel>
    </div>

    <div className="admin-analytics-grid">
      <AdminPanel title="Traffic sources">
        {data.sources.length ? <AdminDataTable columns={["Source", "Unique visitors", "Page views"]}>
          {data.sources.map((entry) => <tr key={entry.source}><td>{entry.source}</td><td>{count(entry.visitors)}</td><td>{count(entry.views)}</td></tr>)}
        </AdminDataTable> : <AdminEmptyState title="No storefront traffic in this date range." />}
      </AdminPanel>
      <AdminPanel title="AI visibility">
        <div className="admin-summary-list">
          <div><span>Current product search metadata</span><b>{count(complete)} of {count(indexable)} active products</b></div>
          <div><span>Published journal guides</span><b>{count(BLOG_POSTS.length)}</b></div>
          <div><span>Published collections</span><b>{count(COLLECTIONS.length)}</b></div>
          <div><span>Search and crawler resources</span><b className="admin-commerce-actions">
            <a className="admin-link" href="/sitemap.xml" target="_blank" rel="noreferrer">Sitemap</a>
            <a className="admin-link" href="/llms.txt" target="_blank" rel="noreferrer">Crawler guide</a>
            <a className="admin-link" href="/blog/rss.xml" target="_blank" rel="noreferrer">RSS feed</a>
          </b></div>
        </div>
        <div className="admin-analytics-subsection"><h3>Traffic from AI services</h3>
          {data.aiSources.length ? <AdminDataTable columns={["Source", "Unique visitors", "Page views"]}>
            {data.aiSources.map((entry) => <tr key={entry.source}><td>{entry.source}</td><td>{count(entry.visitors)}</td><td>{count(entry.views)}</td></tr>)}
          </AdminDataTable> : <p>No identified AI referrals in this date range.</p>}
        </div>
      </AdminPanel>
    </div>
  </>;
}
