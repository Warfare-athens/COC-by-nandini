import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";

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

const KEY_SECRET = env.RAZORPAY_KEY_SECRET;

test("Razorpay Standard Web Checkout API Suite", async (t) => {
  let createdOrderId = "";

  await t.test("1. POST /api/create-order creates order with Razorpay API", async () => {
    const res = await fetch("http://localhost:3001/api/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: 299900, // 2999 INR in paise
        currency: "INR",
        receipt: "rcpt_std_01",
      }),
    });

    assert.equal(res.status, 200, "Expected 200 OK from /api/create-order");
    const data = await res.json();
    assert.ok(data.order_id, "Must return order_id");
    assert.ok(data.order_id.startsWith("order_"), "order_id must start with order_");
    assert.equal(data.amount, 299900);
    assert.equal(data.currency, "INR");
    createdOrderId = data.order_id;
  });

  await t.test("2. POST /api/create-order rejects amount < 100 paise", async () => {
    const res = await fetch("http://localhost:3001/api/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: 50, // below 100 paise
        currency: "INR",
      }),
    });

    assert.equal(res.status, 400, "Expected 400 Bad Request for amount < 100");
    const data = await res.json();
    assert.ok(data.error);
  });

  await t.test("3. POST /api/verify-payment succeeds with valid HMAC-SHA256 signature", async () => {
    assert.ok(createdOrderId, "Must have an order_id from test 1");
    const fakePaymentId = `pay_${Date.now()}`;
    const validSignature = crypto
      .createHmac("sha256", KEY_SECRET)
      .update(`${createdOrderId}|${fakePaymentId}`)
      .digest("hex");

    const res = await fetch("http://localhost:3001/api/verify-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        order_id: createdOrderId,
        payment_id: fakePaymentId,
        signature: validSignature,
      }),
    });

    assert.equal(res.status, 200, "Expected 200 OK for valid signature");
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.order_id, createdOrderId);
    assert.equal(data.payment_id, fakePaymentId);
  });

  await t.test("4. POST /api/verify-payment fails with tampered signature", async () => {
    assert.ok(createdOrderId);
    const fakePaymentId = `pay_${Date.now()}`;
    const tamperedSignature = "bad_invalid_signature_1234567890abcdef";

    const res = await fetch("http://localhost:3001/api/verify-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        order_id: createdOrderId,
        payment_id: fakePaymentId,
        signature: tamperedSignature,
      }),
    });

    assert.equal(res.status, 400, "Expected 400 Bad Request for signature mismatch");
    const data = await res.json();
    assert.equal(data.success, false);
  });

  await t.test("5. POST /api/verify-payment fails when missing required fields", async () => {
    const res = await fetch("http://localhost:3001/api/verify-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        order_id: createdOrderId,
        // missing payment_id and signature
      }),
    });

    assert.equal(res.status, 400, "Expected 400 Bad Request for missing fields");
    const data = await res.json();
    assert.equal(data.success, false);
  });
});
