import { NextResponse } from "next/server";
import { z } from "zod";
import { cartApiError } from "@/lib/commerce-cart";
import { loadPaymentOrder, recordShopPayment } from "@/lib/commerce";
import { razorpayGateway } from "@/lib/razorpay-gateway";

const schema = z.object({
  orderNumber: z.string().min(5).max(40),
  customerEmail: z.string().trim().email().toLowerCase(),
});

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    const order = await loadPaymentOrder(input.orderNumber);
    if (!order || order.email !== input.customerEmail || order.payment_method !== "razorpay") {
      return NextResponse.json({ error: "Checkout order not found." }, { status: 404 });
    }
    if (order.status !== "pending_payment" || order.payment_status === "paid") {
      return NextResponse.json({ error: "This order no longer accepts a payment." }, { status: 409 });
    }
    const { client, keyId } = razorpayGateway();
    const amountPaise = Number(order.total_inr) * 100;
    let providerOrderId = order.payment_provider_order_id;
    if (!providerOrderId) {
      let providerOrder;
      try {
        providerOrder = await client.orders.create({ amount: amountPaise, currency: "INR", receipt: order.order_number });
      } catch (error) {
        // Recover a gateway order created before an interrupted database write or by a concurrent retry.
        const previous = await client.orders.all({ receipt: order.order_number, count: 2 });
        if (previous.items.length !== 1) throw error;
        providerOrder = previous.items[0];
      }
      if (Number(providerOrder.amount) !== amountPaise || providerOrder.currency !== "INR") {
        throw new Error("The gateway order amount does not match checkout.");
      }
      const saved = await recordShopPayment(order.id, providerOrder.id, "pending");
      providerOrderId = saved.payment_provider_order_id;
    }
    return NextResponse.json({ razorpayOrderId: providerOrderId, amountInr: order.total_inr, currency: "INR", keyId, orderNumber: order.order_number });
  } catch (error) {
    console.error("Razorpay order could not be prepared:", cartApiError(error, "Gateway error"));
    return NextResponse.json({ error: "Unable to start online payment. Please try again." }, { status: error instanceof z.ZodError ? 400 : 503 });
  }
}
