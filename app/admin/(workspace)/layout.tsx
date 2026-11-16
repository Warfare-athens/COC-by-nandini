import AdminShell from "@/app/components/AdminShell";
import { requireAdmin } from "@/lib/admin-auth";
import { getAdminDays } from "@/lib/admin-time-server";

export default async function AdminWorkspaceLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return <AdminShell days={await getAdminDays()}>{children}</AdminShell>;
}
