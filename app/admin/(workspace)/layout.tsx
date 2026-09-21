import AdminShell from "@/app/components/AdminShell";
import { requireAdmin } from "@/lib/admin-auth";

export default async function AdminWorkspaceLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return <AdminShell>{children}</AdminShell>;
}
