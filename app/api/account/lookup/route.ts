import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/db";
import { invoicePath } from "@/lib/invoice";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const query = String(body.query || body.emailOrPhone || "").trim();

    if (!query || query.length < 3) {
      return NextResponse.json(
        { error: "Please enter a valid email address or 10-digit mobile number." },
        { status: 400 }
      );
    }

    const isEmail = query.includes("@");
    const supabase = getSupabaseAdmin();

    const orderQuery = supabase
      .from("orders")
      .select(`
        id,
        order_number,
        email,
        phone,
        status,
        payment_status,
        payment_method,
        fulfillment_status,
        subtotal_inr,
        discount_inr,
        shipping_inr,
        tax_inr,
        total_inr,
        coupon_code,
        customer_note,
        placed_at,
        shipping_address_id,
        addresses:shipping_address_id (
          id,
          full_name,
          email,
          phone,
          line1,
          line2,
          city,
          state,
          postal_code,
          country
        ),
        order_items (
          id,
          product_id,
          product_name,
          variant_title,
          sku,
          image_url,
          quantity,
          unit_price_inr,
          total_inr
        ),
        fulfillments (
          id,
          carrier,
          tracking_number,
          tracking_url,
          status,
          estimated_delivery_at,
          shipped_at,
          delivered_at,
          tracking_events (
            id,
            status,
            message,
            location,
            occurred_at
          )
        )
      `)
      .order("placed_at", { ascending: false });

    const digits = query.replace(/\D/g, "");
    let { data: orders, error } = isEmail
      ? await orderQuery.or(`email.ilike.%${query.toLowerCase()}%,order_number.ilike.%${query.toUpperCase()}%`)
      : digits.length >= 4
        ? await orderQuery.or(`phone.ilike.%${digits.slice(-10)}%,order_number.ilike.%${query.toUpperCase()}%`)
        : await orderQuery.or(`email.ilike.%${query.toLowerCase()}%,order_number.ilike.%${query.toUpperCase()}%`);

    if (error) {
      console.error("[Account Lookup Error]", error);
      return NextResponse.json(
        { error: "Could not retrieve order history. Please try again." },
        { status: 500 }
      );
    }

    const enrichedOrders = (orders || []).map((order: any) => {
      let invoiceUrl: string | null = null;
      try {
        invoiceUrl = invoicePath(order.order_number, order.email);
      } catch {
        invoiceUrl = null;
      }

      return {
        ...order,
        invoice_url: invoiceUrl,
        track_url: `/track-order?order=${encodeURIComponent(order.order_number)}`,
      };
    });

    const addresses: any[] = [];
    const seenAddress = new Set<string>();
    for (const ord of enrichedOrders) {
      const addr = ord.addresses as any;
      if (addr && addr.line1) {
        const key = `${addr.line1}_${addr.postal_code}`.toLowerCase().replace(/\s+/g, "");
        if (!seenAddress.has(key)) {
          seenAddress.add(key);
          addresses.push(addr);
        }
      }
    }

    return NextResponse.json({
      success: true,
      count: enrichedOrders.length,
      orders: enrichedOrders,
      addresses,
    });
  } catch (err: any) {
    console.error("[Account Lookup Exception]", err);
    return NextResponse.json(
      { error: err.message || "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
