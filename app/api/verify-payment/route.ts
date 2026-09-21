import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { getSupabaseAdmin, commerceConfigured } from "@/db";
import { invoicePath } from "@/lib/invoice";
import { sendOrderConfirmation } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const key_secret = process.env.RAZORPAY_KEY_SECRET?.trim();
    if (!key_secret) {
      return NextResponse.json(
        { success: false, error: "Razorpay secret key is not configured." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const order_id = body.order_id || body.razorpay_order_id;
    const payment_id = body.payment_id || body.razorpay_payment_id;
    const signature = body.signature || body.razorpay_signature;
    const orderNumber = body.orderNumber || body.order_number;

    // Validate required fields
    if (!order_id || !payment_id || !signature) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required payment verification fields (order_id, payment_id, signature).",
        },
        { status: 400 }
      );
    }

    // Generate expected HMAC-SHA256 signature
    const expectedSignature = createHmac("sha256", key_secret)
      .update(`${order_id}|${payment_id}`)
      .digest("hex");

    const expectedBuffer = Buffer.from(expectedSignature);
    const signatureBuffer = Buffer.from(signature);

    const isMatch =
      expectedBuffer.length === signatureBuffer.length &&
      timingSafeEqual(expectedBuffer, signatureBuffer);

    if (!isMatch) {
      return NextResponse.json(
        {
          success: false,
          error: "Signature verification failed. Payment cannot be marked as paid.",
        },
        { status: 400 }
      );
    }

    let invoiceUrl = "";

    // If commerce database is configured, update order and payments
    if (commerceConfigured()) {
      const supabase = getSupabaseAdmin();

      // Find order by orderNumber or by payment_provider_order_id
      let query = supabase.from("orders").select("id, order_number, email, total_inr");
      if (orderNumber) {
        query = query.eq("order_number", orderNumber);
      } else {
        query = query.eq("payment_provider_order_id", order_id);
      }

      const { data: order } = await query.maybeSingle();

      if (order) {
        // Mark order as paid
        await supabase
          .from("orders")
          .update({
            payment_status: "paid",
            status: "confirmed",
            payment_provider_order_id: order_id,
            updated_at: new Date().toISOString(),
          })
          .eq("id", order.id);

        // Update payment transaction
        await supabase
          .from("payments")
          .update({
            status: "paid",
            provider_payment_id: payment_id,
            raw_payload: {
              order_id,
              payment_id,
              signature,
              verified_at: new Date().toISOString(),
            },
            updated_at: new Date().toISOString(),
          })
          .eq("provider_order_id", order_id);

        // Add tracking event
        const { data: fulfillment } = await supabase
          .from("fulfillments")
          .select("id")
          .eq("order_id", order.id)
          .maybeSingle();

        if (fulfillment) {
          await supabase.from("tracking_events").insert({
            fulfillment_id: fulfillment.id,
            status: "confirmed",
            message: `Razorpay payment verified (${payment_id}). Order confirmed.`,
          });
        }

        // Send confirmation email
        await sendOrderConfirmation(order).catch(console.error);

        invoiceUrl = invoicePath(order.order_number, order.email);
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: "Payment verified successfully",
        order_id,
        payment_id,
        invoiceUrl: invoiceUrl || undefined,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Razorpay verify-payment error:", error);
    const message =
      error instanceof Error ? error.message : "Payment verification failed.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
