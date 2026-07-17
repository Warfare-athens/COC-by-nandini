import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({ orderNumber: z.string().min(5), amountInr: z.number().int().positive() });

/**
 * Razorpay is intentionally feature-gated. Once the merchant keys are added,
 * this endpoint is the single place to create a provider order before opening
 * the Razorpay checkout widget on the client.
 */
export async function POST(request: Request) {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return NextResponse.json({ error: "Online payments are not enabled yet." }, { status: 503 });
  }
  try {
    const input = schema.parse(await request.json());
    return NextResponse.json({ error: "Razorpay adapter is ready for merchant credentials.", orderNumber: input.orderNumber, amountInr: input.amountInr }, { status: 501 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid payment request." }, { status: 400 });
  }
}
