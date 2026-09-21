import { NextResponse } from "next/server";
import { checkoutSchema, createGuestOrder } from "@/lib/commerce";
import { sendOrderConfirmation } from "@/lib/email";
import { sendWhatsAppOrderConfirmationByOrderId } from "@/lib/whatsapp";
import { invoicePath } from "@/lib/invoice";

export async function POST(request: Request) {
  try {
    const input = checkoutSchema.parse(await request.json());
    const order = await createGuestOrder(input);
    const invoiceUrl = invoicePath(order.order_number, order.email);
    // Send confirmation email and WhatsApp immediately if order is confirmed (e.g. COD).
    // For Razorpay prepaid orders, confirmations are dispatched upon payment verification.
    if (order.status === "confirmed") {
      await Promise.allSettled([
        sendOrderConfirmation(order),
        sendWhatsAppOrderConfirmationByOrderId(order.id),
      ]);
    }
    return NextResponse.json({ orderNumber: order.order_number, status: order.status, totalInr: order.total_inr, invoiceUrl }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to place your order.";
    return NextResponse.json({ error: message }, { status: message.includes("configured") ? 503 : 400 });
  }
}
