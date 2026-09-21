import type { Metadata } from "next";
import { notFound } from "next/navigation";
import InvoiceDocument from "@/app/components/InvoiceDocument";
import { getPublicInvoice } from "@/lib/invoice";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ orderNumber: string }> }): Promise<Metadata> {
  const { orderNumber } = await params;
  return {
    title: `Invoice-INV-${orderNumber.toUpperCase()}`,
    robots: { index: false, follow: false },
  };
}

export default async function CustomerInvoicePage({ params, searchParams }: { params: Promise<{ orderNumber: string }>; searchParams: Promise<{ token?: string }> }) {
  const [{ orderNumber }, query] = await Promise.all([params, searchParams]);
  const order = await getPublicInvoice(orderNumber, query.token || "");
  if (!order) notFound();
  return <InvoiceDocument order={order} backHref={`/track-order?order=${encodeURIComponent(String(order.order_number))}`} backLabel="Back to order" />;
}
