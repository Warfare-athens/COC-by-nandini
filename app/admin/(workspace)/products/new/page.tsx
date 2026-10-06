import AdminProductForm from "@/app/components/AdminProductForm";
import { AdminPageHeader } from "@/app/components/AdminUI";
export default async function NewProductPage() {
  return (
    <>
      <AdminPageHeader title="Add product">Create, generate, and publish a complete storefront product.</AdminPageHeader>
      <AdminProductForm />
    </>
  );
}
