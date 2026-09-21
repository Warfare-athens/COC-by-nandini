import AdminCheckoutJourney from "@/app/components/AdminCheckoutJourney";

export default async function CheckoutJourneyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AdminCheckoutJourney cartId={id} backHref="/admin/checkouts" backLabel="Checkouts" />;
}
