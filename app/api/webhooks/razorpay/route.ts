export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { getSupabaseAdmin, commerceConfigured } from "@/db";
import { recordShopPayment } from "@/lib/commerce";
import { razorpayGateway } from "@/lib/razorpay-gateway";

function validSignature(rawBody: string, signature: string, secret: string) {
  try {
    const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
    const actualBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);
    return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim();
  if (!secret || !commerceConfigured()) {
    return NextResponse.json({ error: "Payment webhooks are not configured." }, { status: 503 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature") || "";

  if (!signature || !validSignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  try {
    const payload = JSON.parse(rawBody) as {
      event?: string;
      account_id?: string;
      payload?: {
        payment?: {
          entity?: {
            id?: string;
            order_id?: string;
            status?: string;
            amount?: number;
            currency?: string;
            method?: string;
            error_description?: string;
            notes?: Record<string, unknown>;
          };
        };
        order?: {
          entity?: {
            id?: string;
            receipt?: string;
            amount?: number;
            status?: string;
            notes?: Record<string, unknown>;
          };
        };
        dispute?: {
          entity?: {
            id?: string;
            payment_id?: string;
            amount?: number;
            currency?: string;
            status?: string;
            reason_code?: string;
            respond_by?: number;
          };
        };
        payment_downtime?: {
          entity?: {
            id?: string;
            method?: string;
            status?: string;
            severity?: string;
            instrument?: Record<string, unknown>;
          };
        };
      };
    };

    const eventName = payload.event || "unknown";
    const payment = payload.payload?.payment?.entity;
    const order = payload.payload?.order?.entity;
    const dispute = payload.payload?.dispute?.entity;
    const downtime = payload.payload?.payment_downtime?.entity;

    const orderId = payment?.order_id || order?.id || "";
    const paymentId = payment?.id || dispute?.payment_id || "";
    const externalId = paymentId || dispute?.id || downtime?.id || orderId || crypto.randomUUID();

    const supabase = getSupabaseAdmin();

    // Only payment events for a stored gateway order can change a shop order.
    if (orderId && ["order.paid", "payment.captured", "payment.failed", "payment.authorized"].includes(eventName)) {
      const { data: shopOrder, error: readError } = await supabase.from("orders")
        .select("id,total_inr").eq("payment_provider_order_id", orderId).eq("payment_method", "razorpay").maybeSingle();
      if (readError) throw readError;
      if (shopOrder) {
        const paid = eventName === "order.paid" || eventName === "payment.captured";
        const gatewayPayment = paid && !payment?.id
          ? (await razorpayGateway().client.orders.fetchPayments(orderId)).items.find((entry) => entry.status === "captured")
          : payment;
        if (paid && (!gatewayPayment?.id || gatewayPayment.order_id !== orderId || gatewayPayment.currency !== "INR" ||
            Number(gatewayPayment.amount) !== Number(shopOrder.total_inr) * 100 || gatewayPayment.status !== "captured")) {
          throw new Error("Gateway capture could not be verified for the stored order.");
        }
        await recordShopPayment(shopOrder.id, orderId, paid ? "paid" : eventName === "payment.failed" ? "failed" : "authorized",
          gatewayPayment?.id, payload);
      }
    }

    // 3. Handle Dispute Events
    if (eventName.startsWith("payment.dispute.")) {
      const disputeAction = eventName.replace("payment.dispute.", "");
      try {
        await supabase.from("audit_logs").insert({
          actor: "razorpay_webhook",
          action: `dispute.${disputeAction}`,
          entity_type: "dispute",
          entity_id: dispute?.id || paymentId || "unknown",
          metadata: {
            event: eventName,
            disputeId: dispute?.id,
            paymentId: dispute?.payment_id || paymentId,
            amount: dispute?.amount,
            status: dispute?.status,
            reasonCode: dispute?.reason_code,
          },
        });
      } catch (err) {
        console.error("Dispute audit log error:", err);
      }
    }

    // 4. Handle Gateway Downtime Events
    if (eventName.startsWith("payment.downtime.")) {
      const downtimeAction = eventName.replace("payment.downtime.", "");
      try {
        await supabase.from("audit_logs").insert({
          actor: "razorpay_webhook",
          action: `downtime.${downtimeAction}`,
          entity_type: "gateway_downtime",
          entity_id: downtime?.id || "downtime_event",
          metadata: {
            event: eventName,
            method: downtime?.method,
            status: downtime?.status,
            severity: downtime?.severity,
          },
        });
      } catch (err) {
        console.error("Downtime audit log error:", err);
      }
    }

    await supabase.from("webhook_events").insert({
      provider: "razorpay",
      external_id: externalId,
      event_type: eventName,
      payload,
      processed_at: new Date().toISOString(),
    });
    return NextResponse.json({ ok: true, received: eventName });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed." },
      { status: 500 }
    );
  }
}
