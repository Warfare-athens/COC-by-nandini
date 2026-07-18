import AdminShell from "@/app/components/AdminShell";
import AdminSettingsForm from "@/app/components/AdminSettingsForm";
import { requireAdmin } from "@/lib/admin-auth";
export default async function AdminSettingsPage() {
  await requireAdmin();
  return (
    <AdminShell>
      <div className="admin-head">
        <h1>Store settings</h1>
      </div>
      <AdminSettingsForm />
    </AdminShell>
  );
}
