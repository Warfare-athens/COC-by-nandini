import "server-only";
import { commerceConfigured, getSupabaseAdmin } from "@/db";
import { adminRangeStart } from "./admin-time";

export type AnalyticsTrendDay = { day: string; visitors: number; adds: number; starts: number; orders: number };
type AnalyticsSource = { source: string; visitors: number; views: number };
type ShopAnalytics = {
  visitors: number; pageViews: number; cartVisitors: number; cartViews: number; addToCarts: number;
  checkoutStarts: number; checkoutSubmits: number; checkoutFailures: number; contacts: number; whatsapp: number;
  orders: number; linkedOrders: number; sales: number; deliveredOrders: number; trend: AnalyticsTrendDay[];
  visitorsWhoAdded: number; cartVisitorsWhoCheckedOut: number; visitorsWhoOrdered: number;
  products: { slug: string; name: string; views: number; visitors: number; adds: number }[];
  buttons: { action: string; clicks: number; visitors: number }[];
  sources: AnalyticsSource[]; aiSources: AnalyticsSource[];
  visibility: { indexable: number; complete: number };
};

const empty: ShopAnalytics = {
  visitors: 0, pageViews: 0, cartVisitors: 0, cartViews: 0, addToCarts: 0, checkoutStarts: 0,
  checkoutSubmits: 0, checkoutFailures: 0, contacts: 0, whatsapp: 0, orders: 0, linkedOrders: 0, sales: 0,
  deliveredOrders: 0, visitorsWhoAdded: 0, cartVisitorsWhoCheckedOut: 0, visitorsWhoOrdered: 0,
  trend: [], products: [], buttons: [], sources: [], aiSources: [], visibility: { indexable: 0, complete: 0 },
};

export async function getShopAnalytics(days: number) {
  if (!commerceConfigured()) return empty;
  const { data, error } = await getSupabaseAdmin().rpc("shop_analytics", { p_since: adminRangeStart(days) });
  if (error) throw new Error(`Unable to load storefront analytics: ${error.message}`);
  return data as ShopAnalytics;
}
