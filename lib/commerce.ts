import "server-only";
import { createHash } from "node:crypto";
import { getSupabaseAdmin, commerceConfigured } from "@/db";
import { sendOrderConfirmation } from "@/lib/email";
import { sendWhatsAppOrderConfirmationByOrderId } from "@/lib/whatsapp";
import { attributionSchema, cartLineSchema, resolveCartLines } from "@/lib/commerce-cart";
import { z } from "zod";
import { cartValue, isRecoverableCart } from "@/lib/admin-commerce";
import { getShopAnalytics } from "@/lib/admin-analytics";
import { adminRangeStart } from "@/lib/admin-time";

export const checkoutSchema = z.object({
  customer: z.object({ fullName: z.string().trim().min(2).max(300), email: z.string().trim().email().toLowerCase(), phone: z.string().trim().min(8).max(30) }),
  address: z.object({
    line1: z.string().trim().min(4).max(300), line2: z.string().trim().max(300).optional(), city: z.string().trim().min(2).max(100),
    state: z.string().trim().min(2).max(100), postalCode: z.string().trim().min(4).max(20), country: z.string().trim().max(100).default("India"),
  }),
  items: z.array(cartLineSchema).min(1).max(30),
  paymentMethod: z.enum(["cod", "razorpay"]).default("cod"),
  couponCode: z.string().trim().toUpperCase().max(100).optional(),
  customerNote: z.string().max(500).optional(),
  cartToken: z.string().uuid().optional(),
  revision: z.number().int().nonnegative().default(0),
  attribution: attributionSchema.optional(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
type ShopOrder = {
  id: string; order_number: string; status: string; payment_status: string; payment_method: string;
  total_inr: number; email: string; payment_provider_order_id: string | null;
};

const orderFields = "id,order_number,status,payment_status,payment_method,total_inr,email,payment_provider_order_id";

function orderNumber() {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  return `COC-${date}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

function checkoutKey(input: CheckoutInput) {
  if (!input.cartToken) return null;
  const items = input.items.map(({ productId, name, size, color, quantity }) => JSON.stringify([productId || name, size, color || "", quantity])).sort();
  return createHash("sha256").update(JSON.stringify([
    input.cartToken, input.customer, input.address, items, input.paymentMethod, input.couponCode || "", input.customerNote || "",
  ])).digest("hex");
}

export async function createGuestOrder(input: CheckoutInput) {
  if (!commerceConfigured()) throw new Error("Commerce is waiting for Supabase configuration.");
  const supabase = getSupabaseAdmin();
  const key = checkoutKey(input);
  if (key) {
    const { data, error } = await supabase.from("orders").select(orderFields).eq("checkout_key", key).maybeSingle();
    if (error) throw error;
    if (data?.status === "cancelled") throw new Error("This checkout was cancelled.");
    if (data) return { order: data as ShopOrder, created: false };
  }

  const lines = await resolveCartLines(input.items);
  const quantities = new Map<string, number>();
  const items = lines.map(({ item, product, variant }) => {
    if (!product || !variant) throw new Error(`${item.name} is unavailable in the selected size or color. Please update your bag.`);
    const quantity = (quantities.get(variant.id) || 0) + item.quantity;
    if (quantity > Number(variant.inventory_quantity)) throw new Error(`${item.name} does not have enough stock for this quantity.`);
    quantities.set(variant.id, quantity);
    const unitPrice = Number(variant.price_inr ?? product.price_inr);
    return {
      product_id: product.id, variant_id: variant.id, product_name: product.name,
      variant_title: variant.title || item.size, sku: variant.sku, image_url: variant.image_url || product.hero_image_url,
      quantity: item.quantity, unit_price_inr: unitPrice, total_inr: unitPrice * item.quantity,
    };
  });

  const subtotal = items.reduce((sum, item) => sum + item.total_inr, 0);
  const [settings, promotionResult] = await Promise.all([
    supabase.from("store_settings").select("key,value").in("key", ["free_shipping_threshold", "shipping_charge", "cod_enabled"]),
    input.couponCode ? supabase.from("promotions").select("code,type,value,minimum_subtotal_inr,usage_limit,usage_count,starts_at,ends_at,is_active")
      .eq("code", input.couponCode).maybeSingle() : { data: null, error: null },
  ]);
  if (settings.error || promotionResult.error) throw settings.error || promotionResult.error;
  const values = Object.fromEntries((settings.data || []).map(({ key, value }) => [key, value]));
  if (input.paymentMethod === "cod" && values.cod_enabled === false) throw new Error("Cash on delivery is currently unavailable.");
  const promo = promotionResult.data;
  const now = Date.now();
  const valid = promo?.is_active && subtotal >= Number(promo.minimum_subtotal_inr || 0) &&
    (promo.usage_limit == null || promo.usage_count < promo.usage_limit) &&
    (!promo.starts_at || Date.parse(promo.starts_at) <= now) && (!promo.ends_at || Date.parse(promo.ends_at) >= now);
  if (input.couponCode && !valid) throw new Error("This coupon is invalid, expired or unavailable for this order.");
  const discount = promo && valid ? Math.min(subtotal, promo.type === "percentage" ? Math.round(subtotal * Number(promo.value) / 100) : Number(promo.value)) : 0;
  const shipping = subtotal >= Number(values.free_shipping_threshold ?? 2999) ? 0 : Number(values.shipping_charge ?? 149);
  const total = Math.max(subtotal + shipping - discount, 0);
  if (input.paymentMethod === "razorpay" && total < 1) throw new Error("Please use cash on delivery for this order.");

  const { data, error } = await supabase.rpc("create_shop_order", {
    p_token: input.cartToken || null,
    p_checkout_key: key,
    p_order_number: orderNumber(),
    p_order: { payment_method: input.paymentMethod, subtotal_inr: subtotal, shipping_inr: shipping, discount_inr: discount, total_inr: total,
      coupon_code: promo?.code || null, customer_note: input.customerNote || null },
    p_profile: { full_name: input.customer.fullName, email: input.customer.email, phone: input.customer.phone,
      line1: input.address.line1, line2: input.address.line2 || null, city: input.address.city, state: input.address.state,
      postal_code: input.address.postalCode, country: input.address.country },
    p_items: items,
    p_attribution: input.attribution || {},
    p_revision: input.revision,
  });
  if (error) throw error;
  return data as { order: ShopOrder; created: boolean };
}

export async function loadPaymentOrder(orderNumber: string) {
  const { data, error } = await getSupabaseAdmin().from("orders").select(orderFields).eq("order_number", orderNumber).maybeSingle();
  if (error) throw error;
  return data as ShopOrder | null;
}

export async function recordShopPayment(orderId: string, providerOrderId: string, status: "pending" | "authorized" | "failed" | "paid", paymentId?: string, payload?: unknown) {
  const { data, error } = await getSupabaseAdmin().rpc("record_shop_payment", {
    p_order_id: orderId,
    p_provider_order_id: providerOrderId,
    p_status: status,
    p_payment_id: paymentId || null,
    p_payload: payload || null,
  });
  if (error) throw error;
  const { order, confirmed } = data as { order: ShopOrder; confirmed: boolean };
  if (confirmed) {
    await Promise.allSettled([sendOrderConfirmation(order), sendWhatsAppOrderConfirmationByOrderId(order.id)]);
  }
  return order;
}

export async function lookupOrder(orderNumberValue: string, email: string) {
  if (!commerceConfigured()) return null;
  const supabase = getSupabaseAdmin();
  const { data: order } = await supabase.from("orders").select("id,order_number,status,payment_status,fulfillment_status,total_inr,placed_at,email,fulfillments(id,carrier,tracking_number,tracking_url,status,estimated_delivery_at,tracking_events(status,message,location,occurred_at)),order_items(product_name,variant_title,image_url,quantity,unit_price_inr,total_inr)").eq("order_number", orderNumberValue.trim().toUpperCase()).eq("email", email.trim().toLowerCase()).maybeSingle();
  return order;
}

export async function storefrontSettings() {
  if (!commerceConfigured()) return { announcement: null, freeShippingThreshold: 2999, shippingCharge: 149, codEnabled: true, razorpayEnabled: false };
  const supabase = getSupabaseAdmin();
  const [{ data: announcements }, { data: settings }] = await Promise.all([
    supabase.from("announcements").select("message,link_label,link_url").eq("is_enabled", true).order("updated_at", { ascending: false }).limit(1),
    supabase.from("store_settings").select("key,value"),
  ]);
  const values = Object.fromEntries((settings || []).map((item) => [item.key, item.value]));
  return { announcement: announcements?.[0] || null, freeShippingThreshold: Number(values.free_shipping_threshold || 2999), shippingCharge: Number(values.shipping_charge || 149), codEnabled: values.cod_enabled !== false, razorpayEnabled: Boolean(values.razorpay_enabled && process.env.RAZORPAY_KEY_ID) };
}

export async function adminDashboardData(days = 30) {
  const empty = {
    configured: false,
    days,
    orders: [] as Record<string, unknown>[],
    products: [] as Record<string, unknown>[],
    revenue: 0,
    orderCount: 0,
    averageOrder: 0,
    deliveredOrders: 0,
    openOrders: 0,
    lowStockCount: 0,
    recoverableCarts: 0,
    abandonedValue: 0,
    visitors: 0,
    cartVisitors: 0,
    addToCarts: 0,
    checkoutDrafts: 0,
    whatsappStarted: 0,
    conversion: 0,
    visitorToCart: 0,
    cartToCheckout: 0,
    checkoutToOrder: 0,
  };
  if (!commerceConfigured()) return empty;

  const supabase = getSupabaseAdmin();
  const [analytics, recent, products, stock, carts] = await Promise.all([
    getShopAnalytics(days),
    supabase.from("orders").select("id,order_number,email,status,payment_status,payment_method,fulfillment_status,total_inr,placed_at")
      .gte("confirmed_at", adminRangeStart(days)).in("status", ["confirmed","completed"]).neq("payment_status","refunded")
      .or("payment_method.neq.razorpay,payment_status.eq.paid").order("confirmed_at", { ascending: false }).limit(8),
    supabase.from("products").select("id,name,slug,status,price_inr,compare_at_price_inr,hero_image_url,tags,is_best_seller,is_new_arrival,is_featured,updated_at,product_variants(inventory_quantity,low_stock_threshold),product_categories(categories(name))").order("updated_at", { ascending: false }).limit(200),
    supabase.from("product_variants").select("id", { count: "exact", head: true }).eq("is_active", true).lte("inventory_quantity", 3),
    supabase.from("carts").select("id,email,phone,status,last_activity_at,cart_items(quantity,products(price_inr),product_variants(price_inr))")
      .gte("last_activity_at", adminRangeStart(days)).not("status","in","(converted,recovered,closed,empty)").order("last_activity_at", { ascending: false }).limit(1000),
  ]);
  for (const query of [recent, products, stock, carts]) if (query.error) throw query.error;

  const now = Date.now();
  const recoverable = ((carts.data || []) as Record<string, unknown>[]).filter((cart) => isRecoverableCart(cart, now));
  const percent = (part: number, whole: number) => whole ? Math.round(part / whole * 1000) / 10 : 0;
  return {
    ...empty,
    configured: true,
    orders: (recent.data || []) as Record<string, unknown>[],
    products: (products.data || []) as Record<string, unknown>[],
    revenue: analytics.sales,
    orderCount: analytics.orders,
    averageOrder: analytics.orders ? Math.round(analytics.sales / analytics.orders) : 0,
    deliveredOrders: analytics.deliveredOrders,
    openOrders: analytics.orders - analytics.deliveredOrders,
    lowStockCount: stock.count || 0,
    recoverableCarts: recoverable.length,
    abandonedValue: recoverable.reduce((sum, cart) => sum + cartValue(cart), 0),
    visitors: analytics.visitors,
    cartVisitors: analytics.cartVisitors,
    addToCarts: analytics.addToCarts,
    checkoutDrafts: analytics.checkoutStarts,
    whatsappStarted: analytics.whatsapp,
    conversion: percent(analytics.visitorsWhoOrdered, analytics.visitors),
    visitorToCart: percent(analytics.visitorsWhoAdded, analytics.visitors),
    cartToCheckout: percent(analytics.cartVisitorsWhoCheckedOut, analytics.cartVisitors),
    checkoutToOrder: percent(analytics.linkedOrders, analytics.checkoutStarts),
  };
}
