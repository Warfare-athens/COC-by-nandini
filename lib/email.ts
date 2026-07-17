import "server-only";
import { Resend } from "resend";

export async function sendOrderConfirmation(order: { order_number: string; email: string; total_inr: number }) {
  if (!process.env.RESEND_API_KEY || !process.env.ORDER_FROM_EMAIL) return { skipped: true };
  const resend = new Resend(process.env.RESEND_API_KEY);
  return resend.emails.send({
    from: process.env.ORDER_FROM_EMAIL,
    to: order.email,
    subject: `Your Carnival order ${order.order_number} is confirmed`,
    html: `<div style="font-family:Arial,sans-serif;color:#3a2926;max-width:560px;margin:auto"><h1 style="font-family:Georgia,serif;color:#7e3d38">Thank you for your order</h1><p>Your Carnival of Clothes edit is confirmed and being prepared with care.</p><p><strong>Order:</strong> ${order.order_number}<br/><strong>Total:</strong> ₹${Number(order.total_inr).toLocaleString("en-IN")}</p><p>Use your order number and email on the Track Order page for updates.</p></div>`,
  });
}
