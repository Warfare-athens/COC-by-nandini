import AdminShell from "@/app/components/AdminShell";
import AdminSettingsForm from "@/app/components/AdminSettingsForm";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/db";
export default async function AdminSettingsPage() {
  await requireAdmin();
  const supabase = getSupabaseAdmin();
  const [{ data: settings }, { data: announcements }] = await Promise.all([
    supabase.from("store_settings").select("key,value"),
    supabase.from("announcements").select("message,link_url,is_enabled").order("updated_at", { ascending: false }).limit(1),
  ]);
  const values = Object.fromEntries((settings || []).map((item) => [item.key, item.value]));
  const announcement = announcements?.[0];
  const initial = { announcementEnabled: Boolean(announcement?.is_enabled), announcementMessage: announcement?.message || "", announcementLink: announcement?.link_url || "", freeShippingThreshold: Number(values.free_shipping_threshold ?? 2999), shippingCharge: Number(values.shipping_charge ?? 149), codEnabled: values.cod_enabled !== false, maintenanceMode: Boolean(values.maintenance_mode), razorpayEnabled: Boolean(values.razorpay_enabled) };
  return (
    <AdminShell>
      <div className="admin-head">
        <h1>Store settings</h1>
      </div>
      <AdminSettingsForm initial={initial} />
    </AdminShell>
  );
}
