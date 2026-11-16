import AdminProductForm from "@/app/components/AdminProductForm";
import { AdminPageHeader } from "@/app/components/AdminUI";
export default async function NewProductPage() {
  return (
    <>
      <AdminPageHeader title="Add product" />
      <AdminProductForm />
    </>
  );
}
