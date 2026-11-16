import { NextResponse } from "next/server";
import { z } from "zod";
import { createHmac, timingSafeEqual } from "node:crypto";
import { invoicePath } from "@/lib/invoice";
import { loadPaymentOrder, recordShopPayment } from "@/lib/commerce";
import { razorpayGateway } from "@/lib/razorpay-gateway";

const schema = z.object({
  orderNumber: z.string().min(5).max(40),
  razorpay_order_id: z.string().min(1).max(100),
  razorpay_payment_id: z.string().min(1).max(100),
  razorpay_signature: z.string().regex(/^[a-f0-9]{64}$/i),
});

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    const order = await loadPaymentOrder(input.orderNumber);
    const orderId = order?.payment_provider_order_id;
    if (!order || order.payment_method !== "razorpay" || !orderId || orderId !== input.razorpay_order_id) {
      return NextResponse.json({ error: "Payment does not match the checkout." }, { status: 400 });
    }
    const { client, secret } = razorpayGateway();
    const expected = createHmac("sha256", secret).update(orderId + "|" + input.razorpay_payment_id).digest();
    if (!timingSafeEqual(Buffer.from(input.razorpay_signature, "hex"), expected)) {
      return NextResponse.json({ error: "Payment verification failed." }, { status: 400 });
    }

    const payment = await client.payments.fetch(input.razorpay_payment_id);
    if (payment.order_id !== orderId || payment.currency !== "INR" || Number(payment.amount) !== Number(order.total_inr) * 100) {
      return NextResponse.json({ error: "Payment does not match the checkout amount." }, { status: 400 });
    }
    if (payment.status === "authorized") {
      await recordShopPayment(order.id, orderId, "authorized", payment.id, payment);
      return NextResponse.json({ status: "processing" }, { status: 202 });
    }
    if (payment.status !== "captured") return NextResponse.json({ error: "Payment has not been captured." }, { status: 409 });

    const confirmed = await recordShopPayment(order.id, orderId, "paid", payment.id, payment);
    if (confirmed.status === "cancelled") {
      return NextResponse.json({ error: "Payment received for a cancelled checkout. Contact support with your order reference." }, { status: 409 });
    }
    return NextResponse.json({ success: true, orderNumber: confirmed.order_number, invoiceUrl: invoicePath(confirmed.order_number, confirmed.email) });
  } catch (error) {
    return NextResponse.json({ error: "Unable to verify payment. Please try again." }, { status: error instanceof z.ZodError ? 400 : 503 });
  }
}
