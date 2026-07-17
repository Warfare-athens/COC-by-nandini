import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { getSupabaseAdmin, commerceConfigured } from "@/db";

function validSignature(rawBody: string, signature: string, secret: string) {
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

export async function POST(request: Request) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !commerceConfigured()) return NextResponse.json({ error: "Payment webhooks are not configured." }, { status: 503 });
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature") || "";
  if (!signature || !validSignature(rawBody, signature, secret)) return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  try {
    const payload = JSON.parse(rawBody) as { event?: string; payload?: { payment?: { entity?: { id?: string; order_id?: string; status?: string; amount?: number } } } };
    const payment = payload.payload?.payment?.entity;
    const supabase = getSupabaseAdmin();
    await supabase.from("webhook_events").insert({ provider: "razorpay", external_id: payment?.id || crypto.randomUUID(), event_type: payload.event || "unknown", payload, processed_at: new Date().toISOString() });
    if (payment?.order_id) {
      const paymentStatus = payment.status === "captured" ? "paid" : payment.status === "failed" ? "failed" : "pending";
      await supabase.from("payments").update({ status: paymentStatus, provider_payment_id: payment.id || null, raw_payload: payload }).eq("provider_order_id", payment.order_id);
      if (paymentStatus === "paid") await supabase.from("orders").update({ payment_status: "paid", status: "confirmed" }).eq("payment_provider_order_id", payment.order_id);
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Webhook processing failed." }, { status: 400 });
  }
}
