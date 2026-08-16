import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
};

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    imageUrl: text("image_url"),
    parentId: uuid("parent_id"),
    sortOrder: integer("sort_order").default(0).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("categories_slug_idx").on(table.slug),
    index("categories_parent_idx").on(table.parentId),
  ],
);

export const products = pgTable(
  "products",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    shortDescription: text("short_description"),
    description: text("description"),
    brand: text("brand").default("Carnival of Clothes").notNull(),
    status: text("status").default("draft").notNull(),
    heroImageUrl: text("hero_image_url"),
    priceInr: integer("price_inr").notNull(),
    compareAtPriceInr: integer("compare_at_price_inr"),
    costInr: integer("cost_inr"),
    taxRate: numeric("tax_rate", { precision: 5, scale: 2 }).default("0"),
    hsnCode: text("hsn_code"),
    sku: text("sku"),
    weightGrams: integer("weight_grams"),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    searchKeywords: text("search_keywords"),
    material: text("material"),
    careInstructions: text("care_instructions"),
    styleNotes: text("style_notes"),
    tags: jsonb("tags").$type<string[]>().default([]),
    aiGeneratedAt: timestamp("ai_generated_at", { withTimezone: true }),
    isFeatured: boolean("is_featured").default(false).notNull(),
    isBestSeller: boolean("is_best_seller").default(false).notNull(),
    isNewArrival: boolean("is_new_arrival").default(false).notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("products_slug_idx").on(table.slug),
    uniqueIndex("products_sku_idx").on(table.sku),
    index("products_status_idx").on(table.status),
  ],
);

export const productCategories = pgTable("product_categories", {
  productId: uuid("product_id")
    .references(() => products.id, { onDelete: "cascade" })
    .notNull(),
  categoryId: uuid("category_id")
    .references(() => categories.id, { onDelete: "cascade" })
    .notNull(),
});

export const productImages = pgTable(
  "product_images",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id")
      .references(() => products.id, { onDelete: "cascade" })
      .notNull(),
    url: text("url").notNull(),
    altText: text("alt_text"),
    sortOrder: integer("sort_order").default(0).notNull(),
    isHero: boolean("is_hero").default(false).notNull(),
    ...timestamps,
  },
  (table) => [index("product_images_product_idx").on(table.productId)],
);

export const productReviews = pgTable(
  "product_reviews",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id")
      .references(() => products.id, { onDelete: "cascade" })
      .notNull(),
    customerName: text("customer_name").notNull(),
    email: text("email"),
    rating: integer("rating").notNull(),
    title: text("title"),
    body: text("body").notNull(),
    imageUrl: text("image_url"),
    isVerified: boolean("is_verified").default(false).notNull(),
    status: text("status").default("pending").notNull(),
    ...timestamps,
  },
  (table) => [
    index("product_reviews_product_idx").on(table.productId),
    index("product_reviews_status_idx").on(table.status),
  ],
);

export const productVariants = pgTable(
  "product_variants",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id")
      .references(() => products.id, { onDelete: "cascade" })
      .notNull(),
    sku: text("sku").notNull(),
    title: text("title").notNull(),
    size: text("size"),
    color: text("color"),
    imageUrl: text("image_url"),
    priceInr: integer("price_inr"),
    compareAtPriceInr: integer("compare_at_price_inr"),
    inventoryQuantity: integer("inventory_quantity").default(0).notNull(),
    lowStockThreshold: integer("low_stock_threshold").default(3).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("variants_sku_idx").on(table.sku),
    index("variants_product_idx").on(table.productId),
  ],
);

export const inventoryMovements = pgTable("inventory_movements", {
  id: uuid("id").defaultRandom().primaryKey(),
  variantId: uuid("variant_id")
    .references(() => productVariants.id)
    .notNull(),
  quantityDelta: integer("quantity_delta").notNull(),
  reason: text("reason").notNull(),
  referenceType: text("reference_type"),
  referenceId: text("reference_id"),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const carts = pgTable(
  "carts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    anonymousToken: text("anonymous_token").notNull(),
    email: text("email"),
    phone: text("phone"),
    status: text("status").default("active").notNull(),
    currency: text("currency").default("INR").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    lastActivityAt: timestamp("last_activity_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    ...timestamps,
  },
  (table) => [uniqueIndex("carts_token_idx").on(table.anonymousToken)],
);

export const cartItems = pgTable("cart_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  cartId: uuid("cart_id")
    .references(() => carts.id, { onDelete: "cascade" })
    .notNull(),
  productId: uuid("product_id")
    .references(() => products.id)
    .notNull(),
  variantId: uuid("variant_id").references(() => productVariants.id),
  quantity: integer("quantity").notNull(),
  ...timestamps,
});

export const addresses = pgTable(
  "addresses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    fullName: text("full_name").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull(),
    line1: text("line1").notNull(),
    line2: text("line2"),
    city: text("city").notNull(),
    state: text("state").notNull(),
    postalCode: text("postal_code").notNull(),
    country: text("country").default("India").notNull(),
    ...timestamps,
  },
  (table) => [index("addresses_email_idx").on(table.email)],
);

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderNumber: text("order_number").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull(),
    status: text("status").default("pending").notNull(),
    paymentStatus: text("payment_status").default("pending").notNull(),
    paymentMethod: text("payment_method").default("cod").notNull(),
    fulfillmentStatus: text("fulfillment_status")
      .default("unfulfilled")
      .notNull(),
    currency: text("currency").default("INR").notNull(),
    subtotalInr: integer("subtotal_inr").notNull(),
    discountInr: integer("discount_inr").default(0).notNull(),
    shippingInr: integer("shipping_inr").default(0).notNull(),
    taxInr: integer("tax_inr").default(0).notNull(),
    totalInr: integer("total_inr").notNull(),
    shippingAddressId: uuid("shipping_address_id").references(
      () => addresses.id,
    ),
    paymentProviderOrderId: text("payment_provider_order_id"),
    couponCode: text("coupon_code"),
    customerNote: text("customer_note"),
    adminNote: text("admin_note"),
    placedAt: timestamp("placed_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("orders_number_idx").on(table.orderNumber),
    index("orders_email_idx").on(table.email),
    index("orders_status_idx").on(table.status),
  ],
);

export const orderItems = pgTable("order_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id")
    .references(() => orders.id, { onDelete: "cascade" })
    .notNull(),
  productId: uuid("product_id").references(() => products.id),
  variantId: uuid("variant_id").references(() => productVariants.id),
  productName: text("product_name").notNull(),
  variantTitle: text("variant_title"),
  sku: text("sku"),
  imageUrl: text("image_url"),
  quantity: integer("quantity").notNull(),
  unitPriceInr: integer("unit_price_inr").notNull(),
  totalInr: integer("total_inr").notNull(),
  ...timestamps,
});

export const payments = pgTable("payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id")
    .references(() => orders.id, { onDelete: "cascade" })
    .notNull(),
  provider: text("provider").notNull(),
  providerOrderId: text("provider_order_id"),
  providerPaymentId: text("provider_payment_id"),
  status: text("status").default("pending").notNull(),
  amountInr: integer("amount_inr").notNull(),
  rawPayload: jsonb("raw_payload"),
  ...timestamps,
});

export const fulfillments = pgTable("fulfillments", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id")
    .references(() => orders.id, { onDelete: "cascade" })
    .notNull(),
  carrier: text("carrier"),
  trackingNumber: text("tracking_number"),
  trackingUrl: text("tracking_url"),
  status: text("status").default("processing").notNull(),
  estimatedDeliveryAt: timestamp("estimated_delivery_at", {
    withTimezone: true,
  }),
  shippedAt: timestamp("shipped_at", { withTimezone: true }),
  deliveredAt: timestamp("delivered_at", { withTimezone: true }),
  ...timestamps,
});

export const trackingEvents = pgTable("tracking_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  fulfillmentId: uuid("fulfillment_id")
    .references(() => fulfillments.id, { onDelete: "cascade" })
    .notNull(),
  status: text("status").notNull(),
  message: text("message").notNull(),
  location: text("location"),
  occurredAt: timestamp("occurred_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const promotions = pgTable("promotions", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  code: text("code"),
  type: text("type").notNull(),
  value: integer("value").notNull(),
  minimumSubtotalInr: integer("minimum_subtotal_inr").default(0),
  usageLimit: integer("usage_limit"),
  usageCount: integer("usage_count").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  ...timestamps,
});

export const announcements = pgTable("announcements", {
  id: uuid("id").defaultRandom().primaryKey(),
  message: text("message").notNull(),
  linkLabel: text("link_label"),
  linkUrl: text("link_url"),
  isEnabled: boolean("is_enabled").default(false).notNull(),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  ...timestamps,
});

export const storeSettings = pgTable("store_settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  description: text("description"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  actor: text("actor").notNull(),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const commerceEvents = pgTable(
  "commerce_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    anonymousId: text("anonymous_id"),
    eventName: text("event_name").notNull(),
    path: text("path"),
    productId: uuid("product_id"),
    orderId: uuid("order_id"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("events_name_created_idx").on(table.eventName, table.createdAt),
  ],
);

export const webhookEvents = pgTable(
  "webhook_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    provider: text("provider").notNull(),
    externalId: text("external_id").notNull(),
    eventType: text("event_type").notNull(),
    payload: jsonb("payload").notNull(),
    processedAt: timestamp("processed_at", { withTimezone: true }),
    error: text("error"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("webhook_provider_external_idx").on(
      table.provider,
      table.externalId,
    ),
  ],
);

export const contentEntries = pgTable(
  "content_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    type: text("type").default("page").notNull(),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    status: text("status").default("draft").notNull(),
    summary: text("summary"),
    body: text("body"),
    imageUrl: text("image_url"),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("content_entries_slug_idx").on(table.slug),
    index("content_entries_status_idx").on(table.status),
  ],
);

export const mediaAssets = pgTable(
  "media_assets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    url: text("url").notNull(),
    publicId: text("public_id"),
    filename: text("filename"),
    altText: text("alt_text"),
    folder: text("folder").default("general").notNull(),
    width: integer("width"),
    height: integer("height"),
    bytes: integer("bytes"),
    mimeType: text("mime_type"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("media_assets_url_idx").on(table.url),
    index("media_assets_folder_idx").on(table.folder),
  ],
);

export const adminTemplates = pgTable(
  "admin_templates",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    type: text("type").default("content").notNull(),
    subject: text("subject"),
    body: text("body").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    ...timestamps,
  },
  (table) => [index("admin_templates_type_idx").on(table.type)],
);

export const partnerships = pgTable(
  "partnerships",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    company: text("company"),
    email: text("email"),
    phone: text("phone"),
    type: text("type").default("creator").notNull(),
    status: text("status").default("lead").notNull(),
    valueInr: integer("value_inr").default(0).notNull(),
    notes: text("notes"),
    ...timestamps,
  },
  (table) => [index("partnerships_status_idx").on(table.status)],
);

export const stockRequests = pgTable(
  "stock_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id").references(() => products.id, {
      onDelete: "set null",
    }),
    variantId: uuid("variant_id").references(() => productVariants.id, {
      onDelete: "set null",
    }),
    customerName: text("customer_name"),
    email: text("email").notNull(),
    phone: text("phone"),
    requestedSize: text("requested_size"),
    status: text("status").default("requested").notNull(),
    notifiedAt: timestamp("notified_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    index("stock_requests_status_idx").on(table.status),
    index("stock_requests_product_idx").on(table.productId),
  ],
);

export const customerFeedback = pgTable(
  "customer_feedback",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name"),
    email: text("email"),
    type: text("type").default("general").notNull(),
    rating: integer("rating"),
    message: text("message").notNull(),
    status: text("status").default("new").notNull(),
    adminNote: text("admin_note"),
    ...timestamps,
  },
  (table) => [index("customer_feedback_status_idx").on(table.status)],
);

export const newsletterSubscribers = pgTable(
  "newsletter_subscribers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull(),
    status: text("status").default("subscribed").notNull(),
    source: text("source").default("website").notNull(),
    subscribedAt: timestamp("subscribed_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    unsubscribedAt: timestamp("unsubscribed_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [uniqueIndex("newsletter_subscribers_email_idx").on(table.email)],
);
