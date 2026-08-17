import AdminCheckoutJourney from "@/app/components/AdminCheckoutJourney";
import { requireAdmin } from "@/lib/admin-auth";

export default async function CartLeadJourneyPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  return <AdminCheckoutJourney cartId={id} backHref="/admin/cart-leads" backLabel="Cart Leads" />;
}
