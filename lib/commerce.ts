import "server-only";
import { getSupabaseAdmin, commerceConfigured } from "@/db";
import { z } from "zod";

export const checkoutSchema = z.object({
  customer: z.object({ fullName: z.string().min(2), email: z.string().email(), phone: z.string().min(8) }),
  address: z.object({ line1: z.string().min(4), line2: z.string().optional(), city: z.string().min(2), state: z.string().min(2), postalCode: z.string().min(4), country: z.string().default("India") }),
  items: z.array(z.object({ name: z.string().min(1), size: z.string().min(1), quantity: z.number().int().min(1).max(10) })).min(1),
  paymentMethod: z.enum(["cod", "razorpay"]).default("cod"),
  couponCode: z.string().optional(), customerNote: z.string().max(500).optional(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

const orderNumber = () => {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  return `COC-${date}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
};

export async function createGuestOrder(input: CheckoutInput) {
  if (!commerceConfigured()) throw new Error("Commerce is waiting for Supabase configuration.");
  const supabase = getSupabaseAdmin();
  const names = [...new Set(input.items.map((item) => item.name))];
  const { data: catalog, error: catalogError } = await supabase.from("products").select("id,name,hero_image_url,price_inr,status").in("name", names).eq("status", "active");
  if (catalogError) throw catalogError;
  if (!catalog || catalog.length !== names.length) throw new Error("One or more cart products are unavailable. Please refresh your cart.");

  const catalogMap = new Map(catalog.map((product) => [product.name, product]));
  const { data: variants, error: variantsError } = await supabase.from("product_variants")
    .select("id,product_id,sku,title,size,image_url,price_inr,inventory_quantity,is_active")
    .in("product_id", catalog.map((product) => product.id)).eq("is_active", true);
  if (variantsError) throw variantsError;
  const variantMap = new Map((variants || []).map((variant) => [`${variant.product_id}:${String(variant.size || "").toLowerCase()}`, variant]));
  const pricedItems = input.items.map((item) => {
    const product = catalogMap.get(item.name)!;
    const exactVariant = variantMap.get(`${product.id}:${item.size.toLowerCase()}`);
    const productVariants = (variants || []).filter((candidate) => candidate.product_id === product.id);
    const variant = exactVariant || (productVariants.length === 1 ? productVariants[0] : undefined);
    if (!variant) throw new Error(`${item.name} is not available in size ${item.size}.`);
    if (Number(variant.inventory_quantity || 0) < item.quantity) throw new Error(`${item.name} is currently out of stock in size ${item.size}.`);
    const unitPriceInr = Number(variant.price_inr ?? product.price_inr);
    return { ...item, productId: product.id as string, variantId: variant.id as string, sku: variant.sku as string, variantTitle: variant.title as string, imageUrl: (variant.image_url || product.hero_image_url) as string | null, unitPriceInr, totalInr: unitPriceInr * item.quantity };
  });
  const subtotalInr = pricedItems.reduce((sum, item) => sum + item.totalInr, 0);
  const shippingInr = subtotalInr >= 2999 ? 0 : 149;
  const totalInr = subtotalInr + shippingInr;

  const { data: address, error: addressError } = await supabase.from("addresses").insert({
    full_name: input.customer.fullName, email: input.customer.email.toLowerCase(), phone: input.customer.phone,
    line1: input.address.line1, line2: input.address.line2 || null, city: input.address.city, state: input.address.state,
    postal_code: input.address.postalCode, country: input.address.country,
  }).select("id").single();
  if (addressError) throw addressError;

  const number = orderNumber();
  const { data: order, error: orderError } = await supabase.from("orders").insert({
    order_number: number, email: input.customer.email.toLowerCase(), phone: input.customer.phone,
    status: "confirmed", payment_status: input.paymentMethod === "cod" ? "pending" : "payment_pending",
    payment_method: input.paymentMethod, fulfillment_status: "unfulfilled", subtotal_inr: subtotalInr,
    shipping_inr: shippingInr, total_inr: totalInr, shipping_address_id: address.id,
    coupon_code: input.couponCode || null, customer_note: input.customerNote || null,
  }).select("id,order_number,status,total_inr,email").single();
  if (orderError) throw orderError;

  const { error: itemsError } = await supabase.from("order_items").insert(pricedItems.map((item) => ({
    order_id: order.id, product_id: item.productId, variant_id: item.variantId, product_name: item.name, variant_title: item.variantTitle || `Size ${item.size}`, sku: item.sku,
    image_url: item.imageUrl, quantity: item.quantity, unit_price_inr: item.unitPriceInr, total_inr: item.totalInr,
  })));
  if (itemsError) throw itemsError;

  const inventoryTotals = new Map<string, number>();
  for (const item of pricedItems) inventoryTotals.set(item.variantId, (inventoryTotals.get(item.variantId) || 0) + item.quantity);
  for (const [variantId, quantity] of inventoryTotals) {
    const item = pricedItems.find((candidate) => candidate.variantId === variantId)!;
    const { data: updatedVariant, error: inventoryError } = await supabase.from("product_variants")
      .update({ inventory_quantity: Number((variants || []).find((variant) => variant.id === variantId)?.inventory_quantity || 0) - quantity })
      .eq("id", variantId).gte("inventory_quantity", quantity).select("id").maybeSingle();
    if (inventoryError || !updatedVariant) throw inventoryError || new Error(`${item.name} became unavailable while placing the order. Please try again.`);
    const { error: movementError } = await supabase.from("inventory_movements").insert({ variant_id: variantId, quantity_delta: -quantity, reason: "order", reference_type: "order", reference_id: order.id, note: number });
    if (movementError) throw movementError;
  }

  const { data: fulfillment, error: fulfillmentError } = await supabase.from("fulfillments").insert({ order_id: order.id, status: "processing" }).select("id").single();
  if (fulfillmentError) throw fulfillmentError;
  await supabase.from("tracking_events").insert({ fulfillment_id: fulfillment.id, status: "confirmed", message: "Your order has been confirmed and is being prepared." });
  await supabase.from("commerce_events").insert({ event_name: "purchase", order_id: order.id, metadata: { totalInr, itemCount: pricedItems.reduce((sum, item) => sum + item.quantity, 0) } });
  return { ...order, items: pricedItems, shippingInr, subtotalInr };
}

export async function lookupOrder(orderNumberValue: string, email: string) {
  if (!commerceConfigured()) return null;
  const supabase = getSupabaseAdmin();
  const { data: order } = await supabase.from("orders").select("id,order_number,status,payment_status,fulfillment_status,total_inr,placed_at,email,fulfillments(id,carrier,tracking_number,tracking_url,status,estimated_delivery_at,tracking_events(status,message,location,occurred_at)),order_items(product_name,variant_title,image_url,quantity,unit_price_inr,total_inr)").eq("order_number", orderNumberValue.trim().toUpperCase()).eq("email", email.trim().toLowerCase()).maybeSingle();
  return order;
}

export async function storefrontSettings() {
  if (!commerceConfigured()) return { announcement: null, freeShippingThreshold: 2999, codEnabled: true, razorpayEnabled: false };
  const supabase = getSupabaseAdmin();
  const [{ data: announcements }, { data: settings }] = await Promise.all([
    supabase.from("announcements").select("message,link_label,link_url").eq("is_enabled", true).order("updated_at", { ascending: false }).limit(1),
    supabase.from("store_settings").select("key,value"),
  ]);
  const values = Object.fromEntries((settings || []).map((item) => [item.key, item.value]));
  return { announcement: announcements?.[0] || null, freeShippingThreshold: Number(values.free_shipping_threshold || 2999), codEnabled: values.cod_enabled !== false, razorpayEnabled: Boolean(values.razorpay_enabled && process.env.RAZORPAY_KEY_ID) };
}

export async function adminDashboardData() {
  if (!commerceConfigured()) return { configured: false, orders: [], products: [], revenue: 0, orderCount: 0, lowStockCount: 0 };
  const supabase = getSupabaseAdmin();
  const [{ data: orders }, { data: products }, { count: lowStockCount }] = await Promise.all([
    supabase.from("orders").select("id,order_number,email,status,fulfillment_status,total_inr,placed_at").order("placed_at", { ascending: false }).limit(12),
    supabase.from("products").select("id,name,slug,status,price_inr,hero_image_url,is_best_seller,is_new_arrival,is_featured,updated_at").order("updated_at", { ascending: false }).limit(12),
    supabase.from("product_variants").select("id", { count: "exact", head: true }).lte("inventory_quantity", 3),
  ]);
  return { configured: true, orders: orders || [], products: products || [], revenue: (orders || []).reduce((sum, order) => sum + Number(order.total_inr || 0), 0), orderCount: orders?.length || 0, lowStockCount: lowStockCount || 0 };
}
