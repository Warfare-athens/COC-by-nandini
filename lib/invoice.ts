import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { getSupabaseAdmin } from "@/db";

export type InvoiceRow = Record<string, unknown>;

const invoiceSecret = () => {
  const secret = process.env.ADMIN_COOKIE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret || secret.length < 32) throw new Error("Invoice signing is not configured.");
  return secret;
};

const normalizeOrderNumber = (value: string) => value.trim().toUpperCase();
const normalizeEmail = (value: string) => value.trim().toLowerCase();

export function createInvoiceToken(orderNumber: string, email: string) {
  return createHmac("sha256", invoiceSecret())
    .update(`invoice:v1:${normalizeOrderNumber(orderNumber)}:${normalizeEmail(email)}`)
    .digest("base64url");
}

export function verifyInvoiceToken(token: string, orderNumber: string, email: string) {
  if (!token) return false;
  const expected = Buffer.from(createInvoiceToken(orderNumber, email));
  const supplied = Buffer.from(token);
  return expected.length === supplied.length && timingSafeEqual(expected, supplied);
}

export function invoicePath(orderNumber: string, email: string) {
  const number = normalizeOrderNumber(orderNumber);
  const token = createInvoiceToken(number, email);
  return `/invoice/${encodeURIComponent(number)}?token=${encodeURIComponent(token)}`;
}

export function absoluteInvoiceUrl(orderNumber: string, email: string) {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || process.env.CF_PAGES_URL || "https://www.carnivalofclothes.com").replace(/\/$/, "");
  return `${siteUrl}${invoicePath(orderNumber, email)}`;
}

const invoiceSelection = "*,addresses:shipping_address_id(*),order_items(*)";

export async function getAdminInvoice(orderId: string) {
  const { data } = await getSupabaseAdmin().from("orders").select(invoiceSelection).eq("id", orderId).maybeSingle();
  return data as InvoiceRow | null;
}

export async function getPublicInvoice(orderNumber: string, token: string) {
  const normalized = normalizeOrderNumber(orderNumber);
  const { data } = await getSupabaseAdmin().from("orders").select(invoiceSelection).eq("order_number", normalized).maybeSingle();
  if (!data || !verifyInvoiceToken(token, normalized, String(data.email || ""))) return null;
  return data as InvoiceRow;
}
