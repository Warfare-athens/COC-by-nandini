import { NextResponse } from "next/server";
import { z } from "zod";
import { createHmac, timingSafeEqual } from "node:crypto";
import { commerceConfigured } from "@/db";
import { invoicePath } from "@/lib/invoice";
import { confirmPaidOrder } from "@/lib/commerce";

const verifySchema = z.object({
  orderNumber: z.string().min(5),
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().optional(),
  isDemo: z.boolean().optional(),
});

function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string,
  secret: string
) {
  const expected = createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  return (
    actualBuffer.length === expectedBuffer.length &&
    timingSafeEqual(actualBuffer, expectedBuffer)
  );
}

export async function POST(request: Request) {
  try {
    const input = verifySchema.parse(await request.json());
    const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
    const isDemo = Boolean(input.isDemo || input.razorpay_order_id.startsWith("order_demo_"));

    if (!isDemo && keySecret) {
      if (
        !input.razorpay_signature ||
        !verifyRazorpaySignature(
          input.razorpay_order_id,
          input.razorpay_payment_id,
          input.razorpay_signature,
          keySecret
        )
      ) {
        return NextResponse.json(
          { error: "Payment verification failed. Invalid signature." },
          { status: 400 }
        );
      }
    }

    if (!commerceConfigured()) {
      return NextResponse.json({
        success: true,
        orderNumber: input.orderNumber,
        invoiceUrl: `/invoice/${input.orderNumber}`,
      });
    }

    const confirmedOrder = await confirmPaidOrder(
      { orderNumber: input.orderNumber },
      {
        provider: "razorpay",
        providerPaymentId: input.razorpay_payment_id,
        providerOrderId: input.razorpay_order_id,
        rawPayload: {
          razorpay_order_id: input.razorpay_order_id,
          razorpay_payment_id: input.razorpay_payment_id,
          razorpay_signature: input.razorpay_signature || null,
          isDemo,
        },
      }
    );

    const invoiceUrl = invoicePath(confirmedOrder.order_number, confirmedOrder.email);

    return NextResponse.json({
      success: true,
      orderNumber: confirmedOrder.order_number,
      invoiceUrl,
      paymentId: input.razorpay_payment_id,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Payment verification failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
