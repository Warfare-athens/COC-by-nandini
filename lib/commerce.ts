import "server-only";
import { getSupabaseAdmin, commerceConfigured } from "@/db";
import { sendOrderConfirmation } from "@/lib/email";
import { sendWhatsAppOrderConfirmationByOrderId } from "@/lib/whatsapp";
import { z } from "zod";

export const checkoutSchema = z.object({
  customer: z.object({ fullName: z.string().min(2), email: z.string().email(), phone: z.string().min(8) }),
  address: z.object({ line1: z.string().min(4), line2: z.string().optional(), city: z.string().min(2), state: z.string().min(2), postalCode: z.string().min(4), country: z.string().default("India") }),
  items: z.array(z.object({ name: z.string().min(1), size: z.string().min(1), quantity: z.number().int().min(1).max(10) })).min(1),
  paymentMethod: z.enum(["cod", "razorpay"]).default("cod"),
  couponCode: z.string().optional(), customerNote: z.string().max(500).optional(), cartToken: z.string().uuid().optional(),
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
  const [{ data: settings }, promotionResult] = await Promise.all([
    supabase.from("store_settings").select("key,value").in("key", ["free_shipping_threshold", "shipping_charge", "cod_enabled"]),
    input.couponCode ? supabase.from("promotions").select("id,code,type,value,minimum_subtotal_inr,usage_limit,usage_count,starts_at,ends_at,is_active").eq("code", input.couponCode.trim().toUpperCase()).maybeSingle() : Promise.resolve({ data: null, error: null }),
  ]);
  const storeValues = Object.fromEntries((settings || []).map(item => [item.key, item.value]));
  if (input.paymentMethod === "cod" && storeValues.cod_enabled === false) throw new Error("Cash on delivery is currently unavailable.");
  const promotion = promotionResult.data; const now = Date.now();
  const couponValid = Boolean(promotion?.is_active && subtotalInr >= Number(promotion.minimum_subtotal_inr || 0) && (!promotion.usage_limit || Number(promotion.usage_count || 0) < Number(promotion.usage_limit)) && (!promotion.starts_at || new Date(promotion.starts_at).getTime() <= now) && (!promotion.ends_at || new Date(promotion.ends_at).getTime() >= now));
  if (input.couponCode && !couponValid) throw new Error("This coupon is invalid, expired or unavailable for this order.");
  const discountInr = couponValid ? Math.min(subtotalInr, promotion!.type === "percentage" ? Math.round(subtotalInr * Number(promotion!.value) / 100) : Number(promotion!.value)) : 0;
  const freeShippingThreshold = Number(storeValues.free_shipping_threshold ?? 2999); const shippingCharge = Number(storeValues.shipping_charge ?? 149);
  const shippingInr = subtotalInr >= freeShippingThreshold ? 0 : shippingCharge;
  const totalInr = Math.max(subtotalInr - discountInr + shippingInr, 0);

  const { data: address, error: addressError } = await supabase.from("addresses").insert({
    full_name: input.customer.fullName, email: input.customer.email.toLowerCase(), phone: input.customer.phone,
    line1: input.address.line1, line2: input.address.line2 || null, city: input.address.city, state: input.address.state,
    postal_code: input.address.postalCode, country: input.address.country,
  }).select("id").single();
  if (addressError) throw addressError;

  const number = orderNumber();
  const isPrepaid = input.paymentMethod === "razorpay";
  const { data: order, error: orderError } = await supabase.from("orders").insert({
    order_number: number,
    email: input.customer.email.toLowerCase(),
    phone: input.customer.phone,
    status: isPrepaid ? "pending_payment" : "confirmed",
    payment_status: isPrepaid ? "payment_pending" : "pending",
    payment_method: input.paymentMethod,
    fulfillment_status: "unfulfilled",
    subtotal_inr: subtotalInr,
    shipping_inr: shippingInr,
    discount_inr: discountInr,
    total_inr: totalInr,
    shipping_address_id: address.id,
    coupon_code: couponValid ? promotion!.code : null,
    customer_note: input.customerNote || null,
  }).select("id,order_number,status,payment_status,payment_method,total_inr,email").single();
  if (orderError) throw orderError;

  const { error: itemsError } = await supabase.from("order_items").insert(pricedItems.map((item) => ({
    order_id: order.id,
    product_id: item.productId,
    variant_id: item.variantId,
    product_name: item.name,
    variant_title: item.variantTitle || `Size ${item.size}`,
    sku: item.sku,
    image_url: item.imageUrl,
    quantity: item.quantity,
    unit_price_inr: item.unitPriceInr,
    total_inr: item.totalInr,
  })));
  if (itemsError) throw itemsError;

  // For COD orders, confirm immediately: deduct inventory, create fulfillment, update cart
  if (!isPrepaid) {
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
    await supabase.from("commerce_events").insert({ anonymous_id: input.cartToken || null, event_name: "purchase", order_id: order.id, metadata: { totalInr, itemCount: pricedItems.reduce((sum, item) => sum + item.quantity, 0), couponCode: input.couponCode || null, paymentMethod: input.paymentMethod } });
    if (couponValid) await supabase.from("promotions").update({ usage_count: Number(promotion!.usage_count || 0) + 1, updated_at: new Date().toISOString() }).eq("id", promotion!.id);
    if (input.cartToken) await supabase.from("carts").update({
      status: "converted",
      full_name: input.customer.fullName,
      email: input.customer.email.toLowerCase(),
      phone: input.customer.phone,
      line1: input.address.line1,
      line2: input.address.line2 || null,
      city: input.address.city,
      state: input.address.state,
      postal_code: input.address.postalCode,
      country: input.address.country,
      payment_method: input.paymentMethod,
      checkout_step: "completed",
      last_activity_at: new Date().toISOString(),
    }).eq("anonymous_token", input.cartToken);
  } else {
    // For Razorpay prepaid: save shipping address and advance cart step to payment, but DO NOT convert yet
    if (input.cartToken) await supabase.from("carts").update({
      full_name: input.customer.fullName,
      email: input.customer.email.toLowerCase(),
      phone: input.customer.phone,
      line1: input.address.line1,
      line2: input.address.line2 || null,
      city: input.address.city,
      state: input.address.state,
      postal_code: input.address.postalCode,
      country: input.address.country,
      payment_method: input.paymentMethod,
      checkout_step: "payment",
      last_activity_at: new Date().toISOString(),
    }).eq("anonymous_token", input.cartToken);
  }

  return { ...order, items: pricedItems, shippingInr, subtotalInr };
}

export async function confirmPaidOrder(
  orderIdentifier: { orderNumber?: string; orderId?: string },
  paymentDetails: {
    provider: string;
    providerPaymentId: string;
    providerOrderId?: string;
    rawPayload?: unknown;
  }
) {
  if (!commerceConfigured()) throw new Error("Commerce is waiting for Supabase configuration.");
  const supabase = getSupabaseAdmin();

  let query = supabase.from("orders").select("id,order_number,email,total_inr,status,payment_status,coupon_code,shipping_address_id");
  if (orderIdentifier.orderNumber) {
    query = query.eq("order_number", orderIdentifier.orderNumber);
  } else if (orderIdentifier.orderId) {
    query = query.eq("id", orderIdentifier.orderId);
  } else {
    throw new Error("Order number or ID required.");
  }

  const { data: order, error: orderErr } = await query.single();
  if (orderErr || !order) throw new Error("Order not found for payment confirmation.");

  // Idempotency: if already confirmed and paid, avoid duplicate operations
  if (order.status === "confirmed" && order.payment_status === "paid") {
    return order;
  }

  // 1. Confirm order and mark paid
  await supabase
    .from("orders")
    .update({
      status: "confirmed",
      payment_status: "paid",
      payment_provider_order_id: paymentDetails.providerOrderId || undefined,
      updated_at: new Date().toISOString(),
    })
    .eq("id", order.id);

  // 2. Update payments table record
  if (paymentDetails.providerOrderId) {
    const { data: existingPayment } = await supabase
      .from("payments")
      .select("id")
      .eq("provider_order_id", paymentDetails.providerOrderId)
      .maybeSingle();

    if (existingPayment) {
      await supabase
        .from("payments")
        .update({
          status: "paid",
          provider_payment_id: paymentDetails.providerPaymentId,
          raw_payload: paymentDetails.rawPayload || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingPayment.id);
    } else {
      await supabase.from("payments").insert({
        order_id: order.id,
        provider: paymentDetails.provider,
        provider_order_id: paymentDetails.providerOrderId,
        provider_payment_id: paymentDetails.providerPaymentId,
        amount_inr: Number(order.total_inr),
        status: "paid",
        raw_payload: paymentDetails.rawPayload || null,
      });
    }
  }

  // 3. Deduct inventory for items
  const { data: items } = await supabase
    .from("order_items")
    .select("variant_id,quantity,product_name")
    .eq("order_id", order.id);

  if (items && items.length > 0) {
    const inventoryTotals = new Map<string, number>();
    for (const item of items) {
      if (item.variant_id) {
        inventoryTotals.set(item.variant_id, (inventoryTotals.get(item.variant_id) || 0) + item.quantity);
      }
    }
    for (const [variantId, quantity] of inventoryTotals) {
      const { data: v } = await supabase
        .from("product_variants")
        .select("inventory_quantity")
        .eq("id", variantId)
        .maybeSingle();

      if (v) {
        await supabase
          .from("product_variants")
          .update({ inventory_quantity: Math.max(0, Number(v.inventory_quantity || 0) - quantity) })
          .eq("id", variantId);

        await supabase.from("inventory_movements").insert({
          variant_id: variantId,
          quantity_delta: -quantity,
          reason: "order",
          reference_type: "order",
          reference_id: order.id,
          note: order.order_number,
        });
      }
    }
  }

  // 4. Create fulfillment & tracking event
  const { data: existingFulfillment } = await supabase
    .from("fulfillments")
    .select("id")
    .eq("order_id", order.id)
    .maybeSingle();

  let fulfillmentId = existingFulfillment?.id;
  if (!fulfillmentId) {
    const { data: newFulfillment } = await supabase
      .from("fulfillments")
      .insert({ order_id: order.id, status: "processing" })
      .select("id")
      .single();
    fulfillmentId = newFulfillment?.id;
  }

  if (fulfillmentId) {
    await supabase.from("tracking_events").insert({
      fulfillment_id: fulfillmentId,
      status: "confirmed",
      message: `Payment verified (${paymentDetails.providerPaymentId}). Order confirmed and being prepared.`,
    });
  }

  // 5. Record purchase commerce event
  await supabase.from("commerce_events").insert({
    event_name: "purchase",
    order_id: order.id,
    metadata: {
      totalInr: order.total_inr,
      orderNumber: order.order_number,
      paymentMethod: "razorpay",
      paymentId: paymentDetails.providerPaymentId,
    },
  });

  // 6. Increment coupon usage if used
  if (order.coupon_code) {
    const { data: promo } = await supabase
      .from("promotions")
      .select("id,usage_count")
      .eq("code", order.coupon_code)
      .maybeSingle();
    if (promo) {
      await supabase
        .from("promotions")
        .update({ usage_count: Number(promo.usage_count || 0) + 1, updated_at: new Date().toISOString() })
        .eq("id", promo.id);
    }
  }

  // 7. Update cart to converted
  if (order.email) {
    await supabase
      .from("carts")
      .update({ status: "converted", checkout_step: "completed", last_activity_at: new Date().toISOString() })
      .eq("email", order.email)
      .neq("status", "converted");
  }

  // 8. Send confirmation email and WhatsApp
  await Promise.allSettled([
    sendOrderConfirmation(order),
    sendWhatsAppOrderConfirmationByOrderId(order.id),
  ]);

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
  const since = new Date(Date.now() - Math.max(1, Math.min(days, 90)) * 86_400_000).toISOString();
  const [ordersResult, productsResult, cartsResult, eventsResult, lowStockResult] = await Promise.all([
    supabase.from("orders").select("id,order_number,email,status,payment_status,payment_method,fulfillment_status,total_inr,placed_at").gte("placed_at", since).order("placed_at", { ascending: false }).limit(5000),
    supabase.from("products").select("id,name,slug,status,price_inr,compare_at_price_inr,hero_image_url,tags,is_best_seller,is_new_arrival,is_featured,updated_at,product_variants(inventory_quantity),product_categories(categories(name))").order("updated_at", { ascending: false }).limit(200),
    supabase.from("carts").select("id,anonymous_token,email,phone,status,last_activity_at,cart_items(quantity,products(price_inr))").gte("last_activity_at", since).order("last_activity_at", { ascending: false }).limit(5000),
    supabase.from("commerce_events").select("anonymous_id,event_name,created_at").gte("created_at", since).order("created_at", { ascending: false }).limit(10000),
    supabase.from("product_variants").select("id", { count: "exact", head: true }).eq("is_active", true).lte("inventory_quantity", 3),
  ]);

  const orders = (ordersResult.data || []) as Record<string, unknown>[];
  const carts = (cartsResult.data || []) as Record<string, unknown>[];
  const events = (eventsResult.data || []) as Record<string, unknown>[];
  const isConfirmedOrder = (order: Record<string, unknown>) => {
    const status = String(order.status || "");
    const paymentStatus = String(order.payment_status || "");
    const paymentMethod = String(order.payment_method || "");
    if (["cancelled", "refunded", "pending_payment"].includes(status)) return false;
    if (paymentMethod === "razorpay" && paymentStatus !== "paid") return false;
    return true;
  };
  const validOrders = orders.filter(isConfirmedOrder);
  const revenue = validOrders.reduce((sum, order) => sum + Number(order.total_inr || 0), 0);
  const cartValue = (cart: Record<string, unknown>) => ((cart.cart_items || []) as Record<string, unknown>[]).reduce((sum, item) => {
    const product = item.products as Record<string, unknown> | null;
    return sum + Number(item.quantity || 0) * Number(product?.price_inr || 0);
  }, 0);
  const staleBoundary = Date.now() - 60 * 60 * 1000;
  const recoverable = carts.filter((cart) => {
    const status = String(cart.status);
    const isStale = new Date(String(cart.last_activity_at)).getTime() <= staleBoundary;
    const hasContact = Boolean(cart.email || cart.phone);
    return hasContact && cartValue(cart) > 0 && !["converted", "recovered", "closed", "empty"].includes(status) && (isStale || ["checkout", "abandoned", "contacted"].includes(status));
  });
  const visitorIds = new Set(events.filter((event) => event.event_name === "page_view").map((event) => String(event.anonymous_id)).filter(Boolean));
  const cartVisitorIds = new Set([
    ...events.filter((event) => event.event_name === "add_to_cart").map((event) => String(event.anonymous_id)).filter(Boolean),
    ...carts.map((cart) => String(cart.anonymous_token)).filter(Boolean),
  ]);
  const checkoutIds = new Set([
    ...events.filter((event) => event.event_name === "checkout_started").map((event) => String(event.anonymous_id)).filter(Boolean),
    ...carts.filter((cart) => ["checkout", "converted"].includes(String(cart.status))).map((cart) => String(cart.anonymous_token)).filter(Boolean),
  ]);
  cartVisitorIds.forEach((id) => visitorIds.add(id));
  checkoutIds.forEach((id) => visitorIds.add(id));
  const visitors = Math.max(visitorIds.size, validOrders.length);
  const cartVisitors = Math.max(cartVisitorIds.size, checkoutIds.size);
  const checkoutDrafts = Math.max(checkoutIds.size, validOrders.length);
  const addToCartEvents = events.filter((event) => event.event_name === "add_to_cart").length;
  const cartItemCount = carts.reduce((sum, cart) => sum + ((cart.cart_items || []) as Record<string, unknown>[]).reduce((itemSum, item) => itemSum + Number(item.quantity || 0), 0), 0);
  const percent = (part: number, whole: number) => whole ? Math.min(100, Math.round(part / whole * 1000) / 10) : 0;

  return {
    ...empty,
    configured: true,
    orders: validOrders.slice(0, 8),
    products: (productsResult.data || []) as Record<string, unknown>[],
    revenue,
    orderCount: validOrders.length,
    averageOrder: validOrders.length ? Math.round(revenue / validOrders.length) : 0,
    deliveredOrders: validOrders.filter((order) => order.fulfillment_status === "delivered").length,
    openOrders: validOrders.filter((order) => order.fulfillment_status !== "delivered").length,
    lowStockCount: lowStockResult.count || 0,
    recoverableCarts: recoverable.length,
    abandonedValue: recoverable.reduce((sum, cart) => sum + cartValue(cart), 0),
    visitors,
    cartVisitors,
    addToCarts: Math.max(addToCartEvents, cartItemCount),
    checkoutDrafts,
    whatsappStarted: events.filter((event) => event.event_name === "whatsapp_started").length,
    conversion: percent(validOrders.length, visitors),
    visitorToCart: percent(cartVisitors, visitors),
    cartToCheckout: percent(checkoutDrafts, cartVisitors),
    checkoutToOrder: percent(validOrders.length, checkoutDrafts),
  };
}
