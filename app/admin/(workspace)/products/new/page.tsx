import AdminProductForm from "@/app/components/AdminProductForm";
export default async function NewProductPage() {
  return (
    <>
      <div className="admin-head">
        <div><h1>Add product</h1><p>Create, generate, and publish a complete storefront product.</p></div>
      </div>
      <AdminProductForm />
    </>
  );
}
