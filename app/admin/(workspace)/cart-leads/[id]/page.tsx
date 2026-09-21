import AdminCheckoutJourney from "@/app/components/AdminCheckoutJourney";

export default async function CartLeadJourneyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AdminCheckoutJourney cartId={id} backHref="/admin/cart-leads" backLabel="Cart Leads" />;
}
