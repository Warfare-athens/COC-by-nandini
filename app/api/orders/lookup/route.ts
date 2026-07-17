import { NextResponse } from "next/server";
import { lookupOrder } from "@/lib/commerce";
import { z } from "zod";

const schema = z.object({ orderNumber: z.string().min(6), email: z.string().email() });
export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    const order = await lookupOrder(input.orderNumber, input.email);
    if (!order) return NextResponse.json({ error: "No matching order was found." }, { status: 404 });
    return NextResponse.json({ order });
  } catch { return NextResponse.json({ error: "Enter a valid order number and email." }, { status: 400 }); }
}
