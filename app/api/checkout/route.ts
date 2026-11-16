import { NextResponse } from "next/server";
import { checkoutSchema, createGuestOrder } from "@/lib/commerce";
import { sendOrderConfirmation } from "@/lib/email";
import { sendWhatsAppOrderConfirmationByOrderId } from "@/lib/whatsapp";
import { invoicePath } from "@/lib/invoice";
import { cartApiError } from "@/lib/commerce-cart";

export async function POST(request: Request) {
  try {
    const input = checkoutSchema.parse(await request.json());
    const { order, created } = await createGuestOrder(input);
    const completed = order.status === "confirmed" || order.status === "completed";
    const invoiceUrl = completed ? invoicePath(order.order_number, order.email) : null;
    if (created && completed) {
      await Promise.allSettled([
        sendOrderConfirmation(order),
        sendWhatsAppOrderConfirmationByOrderId(order.id),
      ]);
    }
    return NextResponse.json({ orderNumber: order.order_number, status: order.status, totalInr: order.total_inr, invoiceUrl }, { status: created ? 201 : 200 });
  } catch (error) {
    const message = cartApiError(error, "Unable to place your order.");
    return NextResponse.json({ error: message }, { status: message.includes("configured") ? 503 : 400 });
  }
}
