import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const enabled = process.env.RUN_CHECKOUT_SANDBOX === "1";
const env = enabled ? Object.fromEntries(
  fs
    .readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => {
      const [k, ...v] = l.split("=");
      return [k.trim(), v.join("=").trim()];
    })
) : {};

const runSandbox = enabled && env.RAZORPAY_KEY_ID?.startsWith("rzp_test_");
const checkoutTest = runSandbox ? test : test.skip;

const supabase = runSandbox ? createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
) : null;

const testEmail = `test_${Date.now()}@example.com`;
let createdOrderNumber = "";
let createdTotalInr = 0;
let razorpayOrderId = "";

checkoutTest("1. Places an order with Razorpay payment method via POST /api/checkout", async () => {
  const res = await fetch("http://localhost:3000/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customer: {
        fullName: "Ananya Sharma",
        email: testEmail,
        phone: "9876543210",
      },
      address: {
        line1: "101 Lotus Boulevard",
        city: "Ahmedabad",
        state: "Gujarat",
        postalCode: "380015",
        country: "India",
      },
      items: [
        {
          name: "Rose Pink Blazer Co-ord",
          size: "M",
          quantity: 1,
        },
      ],
      paymentMethod: "razorpay",
    }),
  });

  assert.equal(res.status, 201, "Expected 201 Created from /api/checkout");
  const data = await res.json();
  assert.ok(data.orderNumber, "Order number must be generated");
  assert.ok(data.totalInr > 0, "Total must be positive");
  assert.ok(data.invoiceUrl, "Invoice URL must be present");

  createdOrderNumber = data.orderNumber;
  createdTotalInr = data.totalInr;
});

checkoutTest("2. Creates a Razorpay provider order via POST /api/payments/razorpay/order", async () => {
  assert.ok(createdOrderNumber, "Order number must be set");

  const rzpRes = await fetch("http://localhost:3000/api/payments/razorpay/order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      orderNumber: createdOrderNumber,
      amountInr: createdTotalInr,
      customerName: "Ananya Sharma",
      customerEmail: testEmail,
      customerPhone: "9876543210",
    }),
  });

  assert.equal(rzpRes.status, 200, "Expected 200 OK from /api/payments/razorpay/order");
  const rzpData = await rzpRes.json();
  assert.ok(rzpData.razorpayOrderId, "Razorpay order ID must be generated");
  assert.equal(rzpData.amountInr, createdTotalInr);

  razorpayOrderId = rzpData.razorpayOrderId;
});

checkoutTest("3. Keeps the Razorpay draft unpaid until capture", async () => {
  assert.ok(createdOrderNumber, "Order number must be set");
  assert.ok(razorpayOrderId, "Razorpay order ID must be set");
  const { data: order, error } = await supabase
    .from("orders")
    .select("payment_status,status,payment_provider_order_id,confirmed_at")
    .eq("order_number", createdOrderNumber)
    .single();
  assert.ifError(error);
  assert.equal(order.payment_provider_order_id, razorpayOrderId);
  assert.equal(order.payment_status, "payment_pending");
  assert.equal(order.status, "pending_payment");
  assert.equal(order.confirmed_at, null);
});

checkoutTest("4. Places a Cash on Delivery (COD) order via POST /api/checkout", async () => {
  const res = await fetch("http://localhost:3000/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customer: {
        fullName: "Rohan Patel",
        email: `cod_${Date.now()}@example.com`,
        phone: "9123456789",
      },
      address: {
        line1: "402 Satellite Towers",
        city: "Ahmedabad",
        state: "Gujarat",
        postalCode: "380015",
        country: "India",
      },
      items: [
        {
          name: "Midnight One-Shoulder Maxi",
          size: "S",
          quantity: 1,
        },
      ],
      paymentMethod: "cod",
    }),
  });

  assert.equal(res.status, 201, "Expected 201 Created for COD order");
  const data = await res.json();
  assert.ok(data.orderNumber);

  const { data: dbOrder } = await supabase
    .from("orders")
    .select("order_number, payment_status, status, payment_method")
    .eq("order_number", data.orderNumber)
    .single();

  assert.equal(dbOrder.payment_method, "cod");
  assert.equal(dbOrder.payment_status, "pending");
  assert.equal(dbOrder.status, "confirmed");
});

checkoutTest("5. Order lookup works for tracking on /api/orders/lookup", async () => {
  assert.ok(createdOrderNumber, "Order number must be set");

  const res = await fetch("http://localhost:3000/api/orders/lookup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      orderNumber: createdOrderNumber,
      email: testEmail,
    }),
  });

  assert.equal(res.status, 200, "Expected 200 OK from /api/orders/lookup");
  const data = await res.json();
  assert.equal(data.order.order_number, createdOrderNumber);
  assert.equal(data.order.payment_status, "paid");
});
