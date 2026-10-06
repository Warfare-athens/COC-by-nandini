import AdminSettingsForm from "@/app/components/AdminSettingsForm";
import { AdminPageHeader } from "@/app/components/AdminUI";
import { getSupabaseAdmin } from "@/db";
export default async function AdminSettingsPage() {
  const supabase = getSupabaseAdmin();
  const [{ data: settings, error: settingsError }, { data: announcements, error: announcementsError }] = await Promise.all([
    supabase.from("store_settings").select("key,value"),
    supabase.from("announcements").select("message,link_url,is_enabled").order("updated_at", { ascending: false }).limit(1),
  ]);
  if (settingsError || announcementsError) throw new Error("Unable to load store settings. Please try again.");
  const values = Object.fromEntries((settings || []).map((item) => [item.key, item.value]));
  const announcement = announcements?.[0];
  const initial = { announcementEnabled: Boolean(announcement?.is_enabled), announcementMessage: announcement?.message || "", announcementLink: announcement?.link_url || "", freeShippingThreshold: Number(values.free_shipping_threshold ?? 2999), shippingCharge: Number(values.shipping_charge ?? 149), codEnabled: values.cod_enabled !== false, maintenanceMode: Boolean(values.maintenance_mode), razorpayEnabled: Boolean(values.razorpay_enabled) };
  return (
    <>
      <AdminPageHeader title="Store settings">Control announcements, delivery rules, payments, and storefront availability.</AdminPageHeader>
      <AdminSettingsForm initial={initial} />
    </>
  );
}
