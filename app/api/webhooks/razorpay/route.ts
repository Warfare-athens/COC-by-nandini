export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { getSupabaseAdmin, commerceConfigured } from "@/db";

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

    // 1. Audit Log: Persist every incoming event in webhook_events
    await supabase.from("webhook_events").insert({
      provider: "razorpay",
      external_id: externalId,
      event_type: eventName,
      payload,
      processed_at: new Date().toISOString(),
    });

    // 2. Handle Payment Statuses
    if (eventName === "order.paid" || eventName === "payment.captured" || payment?.status === "captured") {
      if (orderId) {
        await supabase
          .from("payments")
          .update({
            status: "paid",
            provider_payment_id: paymentId || null,
            raw_payload: payload,
            updated_at: new Date().toISOString(),
          })
          .eq("provider_order_id", orderId);
      }

      // Identify order to confirm
      let orderNumber = "";
      if (orderId) {
        const { data: ord } = await supabase
          .from("orders")
          .select("order_number")
          .eq("payment_provider_order_id", orderId)
          .maybeSingle();

        if (ord?.order_number) {
          orderNumber = ord.order_number;
        }
      }

      if (!orderNumber) {
        const receipt = order?.receipt || (payment?.notes as any)?.orderNumber || (order?.notes as any)?.orderNumber;
        if (typeof receipt === "string" && receipt.trim()) {
          orderNumber = receipt.trim();
        }
      }

      if (orderNumber) {
        const { confirmPaidOrder } = await import("@/lib/commerce");
        await confirmPaidOrder(
          { orderNumber },
          {
            provider: "razorpay",
            providerPaymentId: paymentId || `pay_wh_${Date.now()}`,
            providerOrderId: orderId,
            rawPayload: payload,
          }
        ).catch((err) => console.error("Webhook confirmPaidOrder error:", err));
      }
    } else if (eventName === "payment.failed" || payment?.status === "failed") {
      if (orderId) {
        await supabase
          .from("payments")
          .update({
            status: "failed",
            provider_payment_id: paymentId || null,
            raw_payload: payload,
            updated_at: new Date().toISOString(),
          })
          .eq("provider_order_id", orderId);
      }
    } else if (eventName === "payment.authorized") {
      if (orderId) {
        await supabase
          .from("payments")
          .update({
            status: "authorized",
            provider_payment_id: paymentId || null,
            raw_payload: payload,
            updated_at: new Date().toISOString(),
          })
          .eq("provider_order_id", orderId);
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

    return NextResponse.json({ ok: true, received: eventName });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Webhook processing failed." },
      { status: 400 }
    );
  }
}
