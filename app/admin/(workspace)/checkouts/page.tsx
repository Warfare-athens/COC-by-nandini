import { AdminCheckouts } from "@/app/components/AdminCommercePanels";
import { getAdminDays } from "@/lib/admin-time-server";

export default async function Page({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  return <AdminCheckouts days={await getAdminDays((await searchParams).days)} />;
}
