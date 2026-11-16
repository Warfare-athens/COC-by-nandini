import { redirect } from "next/navigation";
import { parseAdminDays } from "@/lib/admin-time";

export default async function Page({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const days = parseAdminDays((await searchParams).days);
  redirect(days ? `/admin/analytics?days=${days}` : "/admin/analytics");
}
