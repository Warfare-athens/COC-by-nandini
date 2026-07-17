import { NextResponse } from "next/server";
import { checkoutSchema, createGuestOrder } from "@/lib/commerce";
import { sendOrderConfirmation } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const input = checkoutSchema.parse(await request.json());
    const order = await createGuestOrder(input);
    await sendOrderConfirmation(order).catch(console.error);
    return NextResponse.json({ orderNumber: order.order_number, status: order.status, totalInr: order.total_inr }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to place your order.";
    return NextResponse.json({ error: message }, { status: message.includes("configured") ? 503 : 400 });
  }
}
