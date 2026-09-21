export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/db";

const exports: Record<string, { table: string; select: string; order: string }> = {
  products: { table: "products", select: "id,name,slug,sku,status,price_inr,compare_at_price_inr,cost_inr,tax_rate,hsn_code,hero_image_url,created_at,updated_at", order: "updated_at" },
  inventory: { table: "product_variants", select: "id,product_id,sku,title,size,color,inventory_quantity,low_stock_threshold,is_active,updated_at,products(name)", order: "updated_at" },
  orders: { table: "orders", select: "id,order_number,email,phone,status,payment_status,payment_method,fulfillment_status,subtotal_inr,discount_inr,shipping_inr,tax_inr,total_inr,coupon_code,placed_at", order: "placed_at" },
  customers: { table: "addresses", select: "id,full_name,email,phone,line1,line2,city,state,postal_code,country,created_at", order: "created_at" },
  reviews: { table: "product_reviews", select: "id,product_id,customer_name,email,rating,title,body,is_verified,status,created_at", order: "created_at" },
  coupons: { table: "promotions", select: "id,name,code,type,value,minimum_subtotal_inr,usage_limit,usage_count,is_active,starts_at,ends_at", order: "created_at" },
  newsletter: { table: "newsletter_subscribers", select: "id,email,status,source,subscribed_at,unsubscribed_at,created_at", order: "subscribed_at" },
  analytics: { table: "commerce_events", select: "id,anonymous_id,event_name,path,product_id,order_id,metadata,created_at", order: "created_at" },
  audit: { table: "audit_logs", select: "id,actor,action,entity_type,entity_id,created_at", order: "created_at" },
};
const scalar = (value: unknown) => typeof value === "object" && value !== null ? JSON.stringify(value) : String(value ?? "");
const escape = (value: unknown) => `"${scalar(value).replaceAll('"', '""')}"`;

export async function GET(_request: Request, { params }: { params: Promise<{ type: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { type } = await params; const config = exports[type]; if (!config) return NextResponse.json({ error: "Unknown export" }, { status: 404 });
  const { data, error } = await getSupabaseAdmin().from(config.table).select(config.select).order(config.order, { ascending: false }).limit(10000);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  const rows = (data || []) as unknown as Record<string, unknown>[]; const headers = rows.length ? Object.keys(rows[0]) : config.select.split(",").map(item=>item.replace(/\(.*/, ""));
  const csv = [headers.map(escape).join(","), ...rows.map(row=>headers.map(key=>escape(row[key])).join(","))].join("\r\n");
  return new Response(`\uFEFF${csv}`, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="carnival-${type}-${new Date().toISOString().slice(0,10)}.csv"`, "Cache-Control": "private, no-store" } });
}
