import { normalizeWhatsAppPhone } from "./whatsapp-recovery";
import { absoluteInvoiceUrl } from "./invoice";
import { getSupabaseAdmin, commerceConfigured } from "@/db";

export { normalizeWhatsAppPhone };

export interface OrderNotificationItem {
  name: string;
  size?: string | null;
  quantity: number;
  priceInr?: number | null;
}

export interface OrderNotificationData {
  orderNumber: string;
  customerName?: string | null;
  phone?: string | null;
  email?: string | null;
  totalInr: number;
  paymentMethod?: string | null;
  items?: OrderNotificationItem[];
  address?: {
    line1?: string | null;
    city?: string | null;
    state?: string | null;
    postalCode?: string | null;
  } | null;
  invoiceUrl?: string | null;
  trackingUrl?: string | null;
}

export function buildOrderConfirmationMessage(data: OrderNotificationData): string {
  const name = data.customerName ? data.customerName.trim().split(/\s+/)[0] : "there";
  const formattedTotal = Number(data.totalInr || 0).toLocaleString("en-IN");
  const paymentLabel = data.paymentMethod === "cod" ? "Cash on Delivery" : "Prepaid";

  let itemsList = "";
  if (data.items && data.items.length > 0) {
    itemsList = data.items
      .map((item) => {
        const sizeStr = item.size ? ` (Size: ${item.size})` : "";
        const qtyStr = item.quantity > 1 ? ` × ${item.quantity}` : "";
        return `• ${item.name}${sizeStr}${qtyStr}`;
      })
      .join("\n");
  }

  let addressStr = "";
  if (data.address) {
    const parts = [data.address.line1, data.address.city, data.address.state, data.address.postalCode].filter(Boolean);
    if (parts.length > 0) {
      addressStr = parts.join(", ");
    }
  }

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.carnivalofclothes.com").replace(/\/$/, "");
  const trackingUrl = data.trackingUrl || `${siteUrl}/track-order?orderNumber=${encodeURIComponent(data.orderNumber)}`;
  const invoiceUrl = data.invoiceUrl || (data.email ? absoluteInvoiceUrl(data.orderNumber, data.email) : null);

  return (
    `✨ *Order Confirmed! Carnival of Clothes* ✨\n\n` +
    `Hi ${name}! 🎉 Thank you for shopping with Carnival of Clothes by Nandini.\n` +
    `Your order *#${data.orderNumber}* has been confirmed and is being prepared with care in our Ahmedabad boutique studio.\n\n` +
    (itemsList ? `🛍️ *Your Order Items:*\n${itemsList}\n\n` : "") +
    `💰 *Total Amount:* ₹${formattedTotal} (${paymentLabel})\n` +
    (addressStr ? `📍 *Delivering to:* ${addressStr}\n\n` : "\n") +
    (invoiceUrl ? `📄 *View / Download Tax Invoice:*\n${invoiceUrl}\n\n` : "") +
    `🚚 *Live Order Tracking:*\n${trackingUrl}\n\n` +
    `If you need size assistance, custom styling advice, or delivery updates, reply directly to this chat. We are happy to help! 💕\n\n` +
    `— Team Carnival of Clothes, Ahmedabad`
  );
}

export function buildWhatsAppOrderConfirmationUrl(data: OrderNotificationData): string | null {
  const normalizedPhone = normalizeWhatsAppPhone(data.phone);
  if (!normalizedPhone) return null;
  const message = buildOrderConfirmationMessage(data);
  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
}

export async function sendOrderConfirmationWhatsApp(data: OrderNotificationData): Promise<{
  success: boolean;
  mode: "api" | "link_ready";
  url?: string | null;
  error?: string;
}> {
  const normalizedPhone = normalizeWhatsAppPhone(data.phone);
  if (!normalizedPhone) {
    return { success: false, mode: "link_ready", error: "No valid phone number provided." };
  }

  const message = buildOrderConfirmationMessage(data);
  const waUrl = `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;

  const apiToken = process.env.WHATSAPP_API_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (apiToken && phoneNumberId) {
    try {
      const response = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: normalizedPhone,
          type: "text",
          text: { preview_url: true, body: message },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn("WhatsApp Cloud API request failed:", errorText);
        return { success: false, mode: "link_ready", url: waUrl, error: errorText };
      }

      return { success: true, mode: "api", url: waUrl };
    } catch (err) {
      console.warn("WhatsApp Cloud API dispatch error:", err);
      return { success: false, mode: "link_ready", url: waUrl, error: err instanceof Error ? err.message : String(err) };
    }
  }

  // Graceful fallback: return pre-generated wa.me link
  return { success: true, mode: "link_ready", url: waUrl };
}

export async function sendWhatsAppOrderConfirmationByOrderId(orderId: string) {
  if (!commerceConfigured()) return null;
  const supabase = getSupabaseAdmin();

  const { data: order } = await supabase
    .from("orders")
    .select(`
      id,
      order_number,
      email,
      phone,
      total_inr,
      payment_method,
      shipping_address_id,
      addresses:shipping_address_id(full_name, phone, line1, city, state, postal_code),
      order_items(product_name, variant_title, quantity, unit_price_inr)
    `)
    .eq("id", orderId)
    .maybeSingle();

  if (!order) return null;

  const address = Array.isArray(order.addresses) ? order.addresses[0] : order.addresses;
  const customerName = (address as { full_name?: string } | null)?.full_name || null;
  const phone = order.phone || (address as { phone?: string } | null)?.phone || null;

  const items: OrderNotificationItem[] = ((order.order_items as Array<{
    product_name?: string;
    variant_title?: string;
    quantity?: number;
    unit_price_inr?: number;
  }>) || []).map((item) => {
    let size: string | null = null;
    if (item.variant_title) {
      const match = item.variant_title.match(/Size\s+([A-Z0-9]+)/i);
      size = match ? match[1] : item.variant_title;
    }
    return {
      name: item.product_name || "Carnival Edit",
      size,
      quantity: Number(item.quantity || 1),
      priceInr: Number(item.unit_price_inr || 0),
    };
  });

  const notificationData: OrderNotificationData = {
    orderNumber: order.order_number,
    customerName,
    phone,
    email: order.email,
    totalInr: Number(order.total_inr),
    paymentMethod: order.payment_method,
    items,
    address: address ? {
      line1: (address as { line1?: string }).line1,
      city: (address as { city?: string }).city,
      state: (address as { state?: string }).state,
      postalCode: (address as { postal_code?: string }).postal_code,
    } : null,
  };

  const result = await sendOrderConfirmationWhatsApp(notificationData);

  // Record audit event in Supabase
  try {
    await supabase.from("commerce_events").insert({
      event_name: "whatsapp_order_confirmation",
      order_id: order.id,
      metadata: {
        orderNumber: order.order_number,
        phone: normalizeWhatsAppPhone(phone),
        mode: result.mode,
        success: result.success,
      },
    });
  } catch {
    // Non-blocking audit failure
  }

  return result;
}
