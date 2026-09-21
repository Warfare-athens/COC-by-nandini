import type { Metadata } from "next";
import { notFound } from "next/navigation";
import InvoiceDocument from "@/app/components/InvoiceDocument";
import { requireAdmin } from "@/lib/admin-auth";
import { getAdminInvoice } from "@/lib/invoice";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const order = await getAdminInvoice(id);
  return {
    title: order ? `Invoice-INV-${order.order_number}` : "Invoice",
    robots: { index: false, follow: false },
  };
}

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const order = await getAdminInvoice(id);
  if (!order) notFound();
  return <InvoiceDocument order={order} backHref={`/admin/orders/${id}`} backLabel="Back to order" />;
}
