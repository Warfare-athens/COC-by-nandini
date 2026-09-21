export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/db";

export async function POST() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = getSupabaseAdmin();
    // Delete in reverse foreign-key dependency order
    await supabase.from("tracking_events").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("fulfillments").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("payments").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("order_items").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("orders").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("addresses").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("cart_items").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("carts").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("commerce_events").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    await supabase.from("audit_logs").insert({
      actor: "admin",
      action: "test_data.purged",
      entity_type: "store_data",
      metadata: { timestamp: new Date().toISOString() },
    });

    return NextResponse.json({ ok: true, message: "Test data purged successfully" });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to purge test data." },
      { status: 500 },
    );
  }
}
