import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(
  fs
    .readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => {
      const [k, ...v] = l.split("=");
      return [k.trim(), v.join("=").trim()];
    })
);

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

const testEmail = `test_${Date.now()}@example.com`;
let createdOrderNumber = "";
let createdTotalInr = 0;
let razorpayOrderId = "";

test("1. Places an order with Razorpay payment method via POST /api/checkout", async () => {
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

test("2. Creates a Razorpay provider order via POST /api/payments/razorpay/order", async () => {
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

test("3. Verifies Razorpay payment via POST /api/payments/razorpay/verify and marks order as paid", async () => {
  assert.ok(createdOrderNumber, "Order number must be set");
  assert.ok(razorpayOrderId, "Razorpay order ID must be set");

  const verifyRes = await fetch("http://localhost:3000/api/payments/razorpay/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      orderNumber: createdOrderNumber,
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: "pay_test_" + Date.now(),
      isDemo: true,
    }),
  });

  assert.equal(verifyRes.status, 200, "Expected 200 OK from /api/payments/razorpay/verify");
  const verifyData = await verifyRes.json();
  assert.equal(verifyData.success, true);
  assert.equal(verifyData.orderNumber, createdOrderNumber);

  // Verify order status in Supabase database
  const { data: dbOrder } = await supabase
    .from("orders")
    .select("order_number, payment_status, status, total_inr")
    .eq("order_number", createdOrderNumber)
    .single();

  assert.equal(dbOrder.payment_status, "paid", "Database order payment_status must be paid");
  assert.equal(dbOrder.status, "confirmed", "Database order status must be confirmed");
});

test("4. Places a Cash on Delivery (COD) order via POST /api/checkout", async () => {
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

test("5. Order lookup works for tracking on /api/orders/lookup", async () => {
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
