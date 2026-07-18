import AdminShell from "@/app/components/AdminShell";
import AdminProductForm from "@/app/components/AdminProductForm";
import { requireAdmin } from "@/lib/admin-auth";
export default async function NewProductPage() {
  await requireAdmin();
  return (
    <AdminShell>
      <div className="admin-head">
        <h1>Add product</h1>
      </div>
      <AdminProductForm />
    </AdminShell>
  );
}
