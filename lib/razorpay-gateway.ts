import "server-only";
import Razorpay from "razorpay";

export function razorpayGateway() {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const secret = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (!keyId || !secret) throw new Error("Razorpay is not configured.");
  return { client: new Razorpay({ key_id: keyId, key_secret: secret }), keyId, secret };
}
