ALTER TABLE "carts" ADD COLUMN "cart_revision" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "carts" ADD COLUMN "lead_revision" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "cart_id" uuid;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "checkout_key" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "confirmed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_cart_id_carts_id_fk" FOREIGN KEY ("cart_id") REFERENCES "public"."carts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "orders_checkout_key_idx" ON "orders" USING btree ("checkout_key");--> statement-breakpoint
CREATE INDEX "orders_cart_idx" ON "orders" USING btree ("cart_id");
--> statement-breakpoint
UPDATE orders o
SET cart_id = c.id
FROM (
  SELECT order_id, min(anonymous_id) AS token
  FROM commerce_events
  WHERE event_name = 'purchase' AND order_id IS NOT NULL AND anonymous_id IS NOT NULL
  GROUP BY order_id
  HAVING count(DISTINCT anonymous_id) = 1
) history
JOIN carts c ON c.anonymous_token = history.token
WHERE o.id = history.order_id;
--> statement-breakpoint
UPDATE orders o SET confirmed_at = coalesce(history.purchased_at,o.placed_at)
FROM (SELECT previous.id,min(event.created_at) AS purchased_at FROM orders previous
  LEFT JOIN commerce_events event ON event.order_id = previous.id AND event.event_name = 'purchase'
  WHERE previous.status IN ('confirmed','completed') AND (previous.payment_method <> 'razorpay' OR previous.payment_status = 'paid')
  GROUP BY previous.id) history
WHERE o.id = history.id;
--> statement-breakpoint
CREATE INDEX commerce_events_journey_idx ON commerce_events(anonymous_id,created_at DESC);
--> statement-breakpoint
CREATE INDEX orders_completed_time_idx ON orders ((coalesce(confirmed_at,placed_at))) WHERE status IN ('confirmed','completed');
--> statement-breakpoint
CREATE FUNCTION track_cart(
  p_token text, p_cart_revision bigint DEFAULT NULL, p_items jsonb DEFAULT NULL,
  p_lead_revision bigint DEFAULT NULL, p_profile jsonb DEFAULT NULL,
  p_attribution jsonb DEFAULT '{}', p_last_field text DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
DECLARE
  cart carts%ROWTYPE;
  before_fields jsonb;
  fields jsonb;
  changes text[];
  step text;
  next_status text;
  added_checkout boolean;
BEGIN
  IF p_profile IS NULL AND p_items = '[]'::jsonb AND NOT EXISTS (
    SELECT 1 FROM carts WHERE anonymous_token = p_token
  ) THEN
    RETURN jsonb_build_object('ok', true);
  END IF;

  INSERT INTO carts(anonymous_token) VALUES (p_token) ON CONFLICT (anonymous_token) DO NOTHING;
  SELECT * INTO STRICT cart FROM carts WHERE anonymous_token = p_token FOR UPDATE;
  IF cart.status = 'converted' THEN
    RETURN jsonb_build_object('ok', true, 'converted', true, 'legacy', cart.cart_revision = 0 AND cart.lead_revision = 0
      AND NOT EXISTS (SELECT 1 FROM orders WHERE cart_id = cart.id AND checkout_key IS NOT NULL));
  END IF;

  IF p_items IS NOT NULL AND (p_cart_revision > cart.cart_revision OR cart.cart_revision = 0) THEN
    DELETE FROM cart_items WHERE cart_id = cart.id;
    INSERT INTO cart_items(cart_id, product_id, variant_id, quantity)
    SELECT cart.id, i.product_id, i.variant_id, i.quantity
    FROM jsonb_to_recordset(p_items) AS i(product_id uuid, variant_id uuid, quantity integer);

    next_status := CASE
      WHEN p_items = '[]'::jsonb THEN 'empty'
      WHEN cart.status = 'empty' AND cart.checkout_step IS NOT NULL THEN 'checkout'
      WHEN cart.status = 'empty' THEN 'active'
      ELSE cart.status END;
    UPDATE carts SET cart_revision = p_cart_revision, status = next_status, updated_at = now(), last_activity_at = now(),
      source = coalesce(source, p_attribution->>'source'), medium = coalesce(medium, p_attribution->>'medium'),
      campaign = coalesce(campaign, p_attribution->>'campaign'), landing_page = coalesce(landing_page, p_attribution->>'landing_page'),
      referrer = coalesce(referrer, p_attribution->>'referrer'), device = coalesce(device, p_attribution->>'device'),
      expires_at = now() + CASE WHEN checkout_step IS NULL THEN interval '30 days' ELSE interval '183 days' END
    WHERE id = cart.id RETURNING * INTO cart;
  END IF;

  IF p_profile IS NULL OR (p_lead_revision <= cart.lead_revision AND cart.lead_revision > 0) THEN
    RETURN jsonb_build_object('ok', true, 'checkoutStep', cart.checkout_step);
  END IF;

  before_fields := jsonb_build_object('full_name',cart.full_name,'email',cart.email,'phone',cart.phone,'line1',cart.line1,
    'line2',cart.line2,'city',cart.city,'state',cart.state,'postal_code',cart.postal_code,'country',cart.country,'payment_method',cart.payment_method);
  fields := before_fields || p_profile;
  SELECT coalesce(array_agg(key ORDER BY key), ARRAY[]::text[]) INTO changes
    FROM jsonb_each(fields) AS field(key,value) WHERE value IS DISTINCT FROM before_fields->key;
  step := CASE
    WHEN fields->>'full_name' IS NOT NULL AND (fields->>'email' IS NOT NULL OR fields->>'phone' IS NOT NULL)
      AND fields->>'line1' IS NOT NULL AND fields->>'city' IS NOT NULL AND fields->>'state' IS NOT NULL AND fields->>'postal_code' IS NOT NULL THEN 'payment'
    WHEN fields->>'line1' IS NOT NULL OR fields->>'line2' IS NOT NULL OR fields->>'city' IS NOT NULL
      OR fields->>'state' IS NOT NULL OR fields->>'postal_code' IS NOT NULL THEN 'delivery'
    ELSE 'personal' END;
  added_checkout := cart.checkout_step IS NULL;

  UPDATE carts SET full_name = fields->>'full_name', email = fields->>'email', phone = fields->>'phone',
    line1 = fields->>'line1', line2 = fields->>'line2', city = fields->>'city', state = fields->>'state',
    postal_code = fields->>'postal_code', country = fields->>'country', payment_method = fields->>'payment_method',
    checkout_step = step, status = CASE WHEN status IN ('active','empty') THEN 'checkout' ELSE status END,
    lead_revision = p_lead_revision, updated_at = now(), last_activity_at = now(), expires_at = now() + interval '183 days',
    source = coalesce(source, p_attribution->>'source'), medium = coalesce(medium, p_attribution->>'medium'),
    campaign = coalesce(campaign, p_attribution->>'campaign'), landing_page = coalesce(landing_page, p_attribution->>'landing_page'),
    referrer = coalesce(referrer, p_attribution->>'referrer'), device = coalesce(device, p_attribution->>'device')
  WHERE id = cart.id;
  IF added_checkout THEN
    INSERT INTO commerce_events(anonymous_id,event_name,path,metadata)
    VALUES (p_token,'checkout_started','/checkout',jsonb_build_object('cartId',cart.id));
  END IF;
  IF cardinality(changes) > 0 THEN
    INSERT INTO commerce_events(anonymous_id,event_name,path,metadata)
    VALUES (p_token,'checkout_field_updated','/checkout',jsonb_build_object('cartId',cart.id,'changedFields',changes,'lastField',p_last_field,'checkoutStep',step));
    IF (('email' = ANY(changes) AND fields->>'email' ~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$')
        OR ('phone' = ANY(changes) AND length(regexp_replace(fields->>'phone','[^0-9]','','g')) BETWEEN 10 AND 15)) THEN
      INSERT INTO commerce_events(anonymous_id,event_name,path,metadata)
      VALUES (p_token,'checkout_contact_captured','/checkout',jsonb_build_object('cartId',cart.id,'checkoutStep',step));
    END IF;
  END IF;
  RETURN jsonb_build_object('ok',true,'changedFields',changes,'checkoutStep',step);
END $$;
--> statement-breakpoint
REVOKE EXECUTE ON FUNCTION track_cart(text,bigint,jsonb,bigint,jsonb,jsonb,text) FROM PUBLIC, anon, authenticated;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION track_cart(text,bigint,jsonb,bigint,jsonb,jsonb,text) TO service_role;


--> statement-breakpoint
CREATE FUNCTION finalize_shop_order(p_order_id uuid, p_prepaid boolean) RETURNS void
LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
DECLARE
  shop_order orders%ROWTYPE;
  cart_token text;
  delivery_id uuid;
  stock_short boolean := false;
  line record;
BEGIN
  SELECT * INTO STRICT shop_order FROM orders WHERE id = p_order_id;
  FOR line IN
    SELECT variant_id, sum(quantity)::integer AS quantity FROM order_items
    WHERE order_id = p_order_id AND variant_id IS NOT NULL GROUP BY variant_id ORDER BY variant_id
  LOOP
    PERFORM 1 FROM product_variants WHERE id = line.variant_id AND inventory_quantity >= line.quantity FOR UPDATE;
    IF NOT FOUND THEN stock_short := true; END IF;
  END LOOP;
  IF stock_short AND NOT p_prepaid THEN
    RAISE EXCEPTION 'An item is no longer in stock. Please update your bag.';
  END IF;

  IF NOT stock_short THEN
    UPDATE product_variants v SET inventory_quantity = v.inventory_quantity - lines.quantity, updated_at = now()
    FROM (SELECT variant_id, sum(quantity)::integer AS quantity FROM order_items
      WHERE order_id = p_order_id AND variant_id IS NOT NULL GROUP BY variant_id) lines
    WHERE v.id = lines.variant_id;
    INSERT INTO inventory_movements(variant_id,quantity_delta,reason,reference_type,reference_id,note)
    SELECT variant_id,-sum(quantity)::integer,'order','order',p_order_id::text,shop_order.order_number
    FROM order_items WHERE order_id = p_order_id AND variant_id IS NOT NULL GROUP BY variant_id;
  END IF;

  SELECT id INTO delivery_id FROM fulfillments WHERE order_id = p_order_id ORDER BY created_at LIMIT 1;
  IF delivery_id IS NULL THEN
    INSERT INTO fulfillments(order_id,status) VALUES (p_order_id,CASE WHEN stock_short THEN 'unfulfilled' ELSE 'processing' END)
    RETURNING id INTO delivery_id;
  END IF;
  UPDATE orders SET fulfillment_status = CASE WHEN stock_short THEN 'unfulfilled' ELSE 'processing' END,
    status = 'confirmed', confirmed_at = coalesce(confirmed_at,now()), updated_at = now() WHERE id = p_order_id;
  INSERT INTO tracking_events(fulfillment_id,status,message) VALUES (
    delivery_id, CASE WHEN stock_short THEN 'unfulfilled' ELSE 'confirmed' END,
    CASE WHEN stock_short THEN 'Payment received. Stock needs review before this order can be packed.'
      ELSE 'Your order has been confirmed and is being prepared.' END
  );
  IF shop_order.cart_id IS NOT NULL THEN
    UPDATE carts SET status = 'converted', checkout_step = 'completed', last_activity_at = now(), updated_at = now()
    WHERE id = shop_order.cart_id RETURNING anonymous_token INTO cart_token;
  END IF;
  INSERT INTO commerce_events(anonymous_id,event_name,path,order_id,metadata)
  VALUES (cart_token,'purchase','/checkout',p_order_id,jsonb_build_object(
    'totalInr',shop_order.total_inr,'paymentMethod',shop_order.payment_method,'orderNumber',shop_order.order_number,
    'stockNeedsReview',stock_short));
  IF shop_order.coupon_code IS NOT NULL THEN
    UPDATE promotions SET usage_count = usage_count + 1, updated_at = now() WHERE code = shop_order.coupon_code;
  END IF;
END $$;
--> statement-breakpoint
CREATE FUNCTION create_shop_order(
  p_token text, p_checkout_key text, p_order_number text, p_order jsonb, p_profile jsonb, p_items jsonb,
  p_attribution jsonb, p_revision bigint
) RETURNS jsonb LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
DECLARE
  cart carts%ROWTYPE;
  shop_order orders%ROWTYPE;
  shipping_id uuid;
  prepaid boolean := p_order->>'payment_method' = 'razorpay';
BEGIN
  IF p_token IS NOT NULL THEN
    INSERT INTO carts(anonymous_token) VALUES (p_token) ON CONFLICT (anonymous_token) DO NOTHING;
    SELECT * INTO STRICT cart FROM carts WHERE anonymous_token = p_token FOR UPDATE;
    SELECT * INTO shop_order FROM orders WHERE checkout_key = p_checkout_key;
    IF FOUND THEN
      IF shop_order.status = 'cancelled' THEN RAISE EXCEPTION 'This checkout was cancelled. Refresh your bag to start again.'; END IF;
      RETURN jsonb_build_object('order',to_jsonb(shop_order),'created',false);
    END IF;
    IF cart.status = 'converted' THEN RAISE EXCEPTION 'This bag has already been checked out.'; END IF;

    IF cart.checkout_step IS NULL THEN
      INSERT INTO commerce_events(anonymous_id,event_name,path,metadata)
      VALUES (p_token,'checkout_started','/checkout',jsonb_build_object('cartId',cart.id));
    END IF;
    UPDATE carts SET full_name = p_profile->>'full_name', email = p_profile->>'email', phone = p_profile->>'phone',
      line1 = p_profile->>'line1', line2 = p_profile->>'line2', city = p_profile->>'city', state = p_profile->>'state',
      postal_code = p_profile->>'postal_code', country = p_profile->>'country', payment_method = p_order->>'payment_method',
      checkout_step = 'payment', status = CASE WHEN status IN ('active','empty') THEN 'checkout' ELSE status END,
      updated_at = now(), last_activity_at = now(), expires_at = now() + interval '183 days',
      lead_revision = greatest(lead_revision,p_revision), cart_revision = greatest(cart_revision,p_revision),
      source = coalesce(source,p_attribution->>'source'), medium = coalesce(medium,p_attribution->>'medium'),
      campaign = coalesce(campaign,p_attribution->>'campaign'), landing_page = coalesce(landing_page,p_attribution->>'landing_page'),
      referrer = coalesce(referrer,p_attribution->>'referrer'), device = coalesce(device,p_attribution->>'device')
    WHERE id = cart.id;
    IF p_revision >= cart.cart_revision OR cart.cart_revision = 0 THEN
      DELETE FROM cart_items WHERE cart_id = cart.id;
      INSERT INTO cart_items(cart_id,product_id,variant_id,quantity)
      SELECT cart.id,i.product_id,i.variant_id,i.quantity FROM jsonb_to_recordset(p_items) AS i(product_id uuid,variant_id uuid,quantity integer);
    END IF;
  END IF;

  INSERT INTO addresses(full_name,email,phone,line1,line2,city,state,postal_code,country)
  VALUES (p_profile->>'full_name',p_profile->>'email',p_profile->>'phone',p_profile->>'line1',p_profile->>'line2',
    p_profile->>'city',p_profile->>'state',p_profile->>'postal_code',p_profile->>'country') RETURNING id INTO shipping_id;
  INSERT INTO orders(order_number,cart_id,checkout_key,email,phone,status,payment_status,payment_method,subtotal_inr,
    shipping_inr,discount_inr,total_inr,shipping_address_id,coupon_code,customer_note)
  VALUES (p_order_number,cart.id,p_checkout_key,p_profile->>'email',p_profile->>'phone',
    CASE WHEN prepaid THEN 'pending_payment' ELSE 'confirmed' END,CASE WHEN prepaid THEN 'payment_pending' ELSE 'pending' END,
    p_order->>'payment_method',(p_order->>'subtotal_inr')::integer,(p_order->>'shipping_inr')::integer,
    (p_order->>'discount_inr')::integer,(p_order->>'total_inr')::integer,shipping_id,p_order->>'coupon_code',p_order->>'customer_note')
  RETURNING * INTO shop_order;
  INSERT INTO order_items(order_id,product_id,variant_id,product_name,variant_title,sku,image_url,quantity,unit_price_inr,total_inr)
  SELECT shop_order.id,i.product_id,i.variant_id,i.product_name,i.variant_title,i.sku,i.image_url,i.quantity,i.unit_price_inr,i.total_inr
  FROM jsonb_to_recordset(p_items) AS i(product_id uuid,variant_id uuid,product_name text,variant_title text,sku text,image_url text,
    quantity integer,unit_price_inr integer,total_inr integer);
  INSERT INTO commerce_events(anonymous_id,event_name,path,order_id,metadata)
  VALUES (p_token,'order_created','/checkout',shop_order.id,jsonb_build_object('paymentMethod',shop_order.payment_method,'orderNumber',p_order_number));
  IF NOT prepaid THEN PERFORM finalize_shop_order(shop_order.id,false); END IF;
  SELECT * INTO STRICT shop_order FROM orders WHERE id = shop_order.id;
  RETURN jsonb_build_object('order',to_jsonb(shop_order),'created',true);
END $$;
--> statement-breakpoint
CREATE FUNCTION record_shop_payment(
  p_order_id uuid, p_provider_order_id text, p_status text, p_payment_id text DEFAULT NULL, p_payload jsonb DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
DECLARE
  shop_order orders%ROWTYPE;
  payment_row payments%ROWTYPE;
  cart_token text;
  confirmed boolean := false;
  attempt_changed boolean;
  next_payment_status text;
BEGIN
  SELECT * INTO STRICT shop_order FROM orders WHERE id = p_order_id FOR UPDATE;
  IF shop_order.payment_method <> 'razorpay' OR p_status NOT IN ('pending','failed','authorized','paid') THEN
    RAISE EXCEPTION 'Invalid payment transition.';
  END IF;
  IF shop_order.payment_provider_order_id IS DISTINCT FROM p_provider_order_id AND
    (shop_order.payment_provider_order_id IS NOT NULL OR p_status <> 'pending' OR shop_order.status <> 'pending_payment') THEN
    RAISE EXCEPTION 'Payment order does not match the checkout.';
  END IF;
  IF shop_order.payment_status IN ('paid','refunded') OR (p_status = 'pending' AND shop_order.payment_provider_order_id IS NOT NULL) THEN
    RETURN jsonb_build_object('order',to_jsonb(shop_order),'confirmed',false);
  END IF;

  SELECT * INTO payment_row FROM payments WHERE order_id = p_order_id AND provider_order_id = p_provider_order_id
    AND (provider_payment_id IS NOT DISTINCT FROM p_payment_id OR provider_payment_id IS NULL)
    ORDER BY (provider_payment_id IS NOT DISTINCT FROM p_payment_id) DESC, created_at DESC LIMIT 1;
  attempt_changed := payment_row.status IS DISTINCT FROM p_status;
  IF payment_row.status = 'failed' AND p_status = 'authorized' THEN
    RETURN jsonb_build_object('order',to_jsonb(shop_order),'confirmed',false);
  END IF;
  IF FOUND THEN
    UPDATE payments SET status = p_status, provider_payment_id = coalesce(p_payment_id,provider_payment_id),
      raw_payload = coalesce(p_payload,raw_payload), updated_at = now() WHERE id = payment_row.id;
  ELSE
    INSERT INTO payments(order_id,provider,provider_order_id,provider_payment_id,status,amount_inr,raw_payload)
    VALUES (p_order_id,'razorpay',p_provider_order_id,p_payment_id,p_status,shop_order.total_inr,p_payload);
  END IF;
  next_payment_status := CASE
    WHEN p_status = 'pending' THEN 'payment_pending'
    WHEN p_status = 'failed' AND EXISTS (SELECT 1 FROM payments WHERE order_id = p_order_id AND status = 'authorized') THEN 'authorized'
    ELSE p_status END;
  UPDATE orders SET payment_provider_order_id = p_provider_order_id, payment_status = next_payment_status, updated_at = now()
  WHERE id = p_order_id;
  SELECT anonymous_token INTO cart_token FROM carts WHERE id = shop_order.cart_id;
  IF p_status = 'paid' THEN
    IF shop_order.status <> 'cancelled' THEN
      IF shop_order.cart_id IS NOT NULL THEN
        PERFORM 1 FROM carts WHERE id = shop_order.cart_id FOR UPDATE;
      END IF;
      IF shop_order.cart_id IS NULL OR NOT EXISTS (
        SELECT 1 FROM orders WHERE cart_id = shop_order.cart_id AND id <> p_order_id
          AND status IN ('confirmed','completed') AND (payment_method = 'cod' OR payment_status = 'paid')
          AND checkout_key IS NOT NULL
      ) THEN
        PERFORM finalize_shop_order(p_order_id,true);
        confirmed := true;
      ELSE
        UPDATE orders SET status = 'cancelled' WHERE id = p_order_id;
      END IF;
    END IF;
    IF NOT confirmed THEN
      INSERT INTO commerce_events(anonymous_id,event_name,path,order_id,metadata)
      VALUES (cart_token,'payment_requires_review','/checkout',p_order_id,jsonb_build_object('paymentId',p_payment_id,'reason','Payment received for a cancelled or already converted checkout'));
    END IF;
  ELSIF p_status <> 'pending' AND attempt_changed THEN
    INSERT INTO commerce_events(anonymous_id,event_name,path,order_id,metadata)
    VALUES (cart_token,'payment_' || p_status,'/checkout',p_order_id,jsonb_build_object('paymentId',p_payment_id));
  END IF;
  SELECT * INTO STRICT shop_order FROM orders WHERE id = p_order_id;
  RETURN jsonb_build_object('order',to_jsonb(shop_order),'confirmed',confirmed);
END $$;
--> statement-breakpoint
REVOKE EXECUTE ON FUNCTION finalize_shop_order(uuid,boolean), create_shop_order(text,text,text,jsonb,jsonb,jsonb,jsonb,bigint),
  record_shop_payment(uuid,text,text,text,jsonb) FROM PUBLIC, anon, authenticated;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION finalize_shop_order(uuid,boolean), create_shop_order(text,text,text,jsonb,jsonb,jsonb,jsonb,bigint),
  record_shop_payment(uuid,text,text,text,jsonb) TO service_role;


--> statement-breakpoint
CREATE FUNCTION admin_update_shop_order(p_id uuid,p_status text,p_fulfillment text,p_tracking jsonb)
RETURNS boolean LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
DECLARE
  shop_order orders%ROWTYPE;
  delivery fulfillments%ROWTYPE;
  next_status text;
  next_fulfillment text;
  tracking_changed boolean;
BEGIN
  SELECT * INTO shop_order FROM orders WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN RETURN false; END IF;
  next_status := CASE WHEN p_fulfillment = 'cancelled' THEN 'cancelled' ELSE coalesce(p_status,shop_order.status) END;
  next_fulfillment := CASE WHEN next_status = 'cancelled' THEN 'cancelled' ELSE p_fulfillment END;
  IF shop_order.payment_method = 'razorpay' AND shop_order.payment_status <> 'paid' AND
    (next_status NOT IN ('pending_payment','cancelled') OR next_fulfillment NOT IN ('unfulfilled','cancelled')) THEN
    RAISE EXCEPTION 'Online payment must be captured before fulfillment.';
  END IF;
  IF shop_order.status = 'cancelled' AND next_status <> 'cancelled' THEN
    RAISE EXCEPTION 'A cancelled order cannot be reopened.';
  END IF;
  UPDATE orders SET status = next_status, fulfillment_status = next_fulfillment, updated_at = now(),
    confirmed_at = CASE WHEN next_status IN ('confirmed','completed') THEN coalesce(confirmed_at,now()) ELSE confirmed_at END,
    checkout_key = CASE WHEN next_status = 'cancelled' AND shop_order.payment_status <> 'paid' THEN NULL ELSE checkout_key END
  WHERE id = p_id;
  SELECT * INTO delivery FROM fulfillments WHERE order_id = p_id ORDER BY created_at LIMIT 1;
  IF delivery.id IS NULL AND next_fulfillment NOT IN ('unfulfilled','cancelled') THEN
    INSERT INTO fulfillments(order_id,status) VALUES(p_id,next_fulfillment) RETURNING * INTO delivery;
  END IF;
  IF delivery.id IS NOT NULL THEN
    tracking_changed := delivery.status <> next_fulfillment
      OR (p_tracking ? 'carrier' AND delivery.carrier IS DISTINCT FROM p_tracking->>'carrier')
      OR (p_tracking ? 'tracking_number' AND delivery.tracking_number IS DISTINCT FROM p_tracking->>'tracking_number')
      OR (p_tracking ? 'tracking_url' AND delivery.tracking_url IS DISTINCT FROM p_tracking->>'tracking_url');
    UPDATE fulfillments SET status = next_fulfillment,
      carrier = CASE WHEN p_tracking ? 'carrier' THEN p_tracking->>'carrier' ELSE carrier END,
      tracking_number = CASE WHEN p_tracking ? 'tracking_number' THEN p_tracking->>'tracking_number' ELSE tracking_number END,
      tracking_url = CASE WHEN p_tracking ? 'tracking_url' THEN p_tracking->>'tracking_url' ELSE tracking_url END,
      shipped_at = CASE WHEN next_fulfillment IN ('shipped','out_for_delivery','delivered') THEN coalesce(shipped_at,now()) ELSE shipped_at END,
      delivered_at = CASE WHEN next_fulfillment = 'delivered' THEN coalesce(delivered_at,now()) ELSE delivered_at END,
      updated_at = now()
    WHERE id = delivery.id;
    IF tracking_changed OR shop_order.fulfillment_status <> next_fulfillment THEN
      INSERT INTO tracking_events(fulfillment_id,status,message)
      VALUES(delivery.id,next_fulfillment,CASE WHEN shop_order.fulfillment_status <> next_fulfillment
        THEN 'Order updated to ' || replace(next_fulfillment,'_',' ') || '.' ELSE 'Shipping information updated.' END);
    END IF;
  END IF;
  INSERT INTO audit_logs(actor,action,entity_type,entity_id,metadata)
  VALUES('admin','order.updated','order',p_id::text,jsonb_build_object('status',next_status,'fulfillmentStatus',next_fulfillment));
  RETURN true;
END $$;
--> statement-breakpoint
REVOKE EXECUTE ON FUNCTION admin_update_shop_order(uuid,text,text,jsonb) FROM PUBLIC, anon, authenticated;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION admin_update_shop_order(uuid,text,text,jsonb) TO service_role;
--> statement-breakpoint
CREATE FUNCTION shop_analytics(p_since timestamptz) RETURNS jsonb
LANGUAGE sql STABLE SET search_path = public, pg_temp AS $$
  WITH events AS MATERIALIZED (
    SELECT event_name, anonymous_id, coalesce(metadata->>'visitorId',anonymous_id) AS visitor,
      path, product_id, metadata, created_at,
      (created_at AT TIME ZONE 'Asia/Kolkata')::date AS day
    FROM commerce_events
    WHERE created_at >= p_since AND created_at <= now() AND event_name IN (
      'page_view','product_view','add_to_cart','cart_viewed','checkout_started','checkout_submitted',
      'checkout_failed','checkout_contact_captured','button_clicked','whatsapp_started'
    ) AND coalesce(path,'') NOT LIKE '/admin%'
  ), checkout_starts AS (
    SELECT anonymous_id,min(day) AS day FROM events
    WHERE event_name = 'checkout_started' AND EXISTS (SELECT 1 FROM carts WHERE anonymous_token = events.anonymous_id)
    GROUP BY anonymous_id
  ), placed AS MATERIALIZED (
    SELECT id, cart_id, total_inr, fulfillment_status, (coalesce(confirmed_at,placed_at) AT TIME ZONE 'Asia/Kolkata')::date AS day
    FROM orders WHERE coalesce(confirmed_at,placed_at) BETWEEN p_since AND now() AND status IN ('confirmed','completed')
      AND (payment_method <> 'razorpay' OR payment_status = 'paid') AND payment_status <> 'refunded'
  ), visitors_in_range AS (
    SELECT DISTINCT visitor FROM events WHERE event_name = 'page_view' AND visitor IS NOT NULL
  ), add_actions AS (
    SELECT DISTINCT visitor,anonymous_id FROM events WHERE event_name = 'add_to_cart' AND visitor IS NOT NULL
  ), days AS (
    SELECT day::date
    FROM generate_series((p_since AT TIME ZONE 'Asia/Kolkata')::date,(now() AT TIME ZONE 'Asia/Kolkata')::date, interval '1 day') AS day
  ), daily_events AS (
    SELECT day, count(DISTINCT visitor) FILTER (WHERE event_name = 'page_view') AS visitors,
      count(*) FILTER (WHERE event_name = 'add_to_cart') AS adds FROM events GROUP BY day
  ), daily_starts AS (
    SELECT day,count(*) AS starts FROM checkout_starts GROUP BY day
  ), daily_orders AS (
    SELECT day,count(*) AS orders FROM placed GROUP BY day
  ), product_events AS (
    SELECT coalesce(p.slug, legacy.slug, e.metadata->>'slug', split_part(regexp_replace(e.path,'^/product/',''), '?', 1)) AS slug,
      coalesce(p.name,legacy.name,e.metadata->>'product') AS name, e.visitor, e.event_name
    FROM events e LEFT JOIN products p ON p.id = e.product_id
    LEFT JOIN products legacy ON p.id IS NULL AND legacy.slug = coalesce(e.metadata->>'slug',
      CASE WHEN e.path LIKE '/product/%' THEN split_part(substr(e.path,10),'?',1) END)
    WHERE e.event_name IN ('product_view','add_to_cart')
  ), products_viewed AS (
    SELECT slug, coalesce(max(name),slug) AS name,
      count(*) FILTER (WHERE event_name = 'product_view') AS views,
      count(DISTINCT visitor) FILTER (WHERE event_name = 'product_view') AS visitors,
      count(*) FILTER (WHERE event_name = 'add_to_cart') AS adds
    FROM product_events WHERE slug IS NOT NULL AND slug <> '' AND slug NOT LIKE '/%'
    GROUP BY slug HAVING count(*) FILTER (WHERE event_name = 'product_view') > 0 ORDER BY views DESC, slug LIMIT 30
  ), buttons AS (
    SELECT metadata->>'action' AS action,count(*) AS clicks,count(DISTINCT visitor) AS visitors
    FROM events WHERE event_name = 'button_clicked' AND metadata->>'action' IS NOT NULL
    GROUP BY 1 ORDER BY clicks DESC, action LIMIT 30
  ), sources AS (
    SELECT coalesce(nullif(lower(metadata->>'source'),''),'direct') AS source,
      count(*) AS views,count(DISTINCT visitor) AS visitors
    FROM events WHERE event_name = 'page_view' GROUP BY 1 ORDER BY visitors DESC, source LIMIT 15
  ), ai_referrers AS (
    SELECT lower(metadata->>'source') AS source,count(*) AS views,count(DISTINCT visitor) AS visitors
    FROM events WHERE event_name = 'page_view' AND lower(metadata->>'source') IN
      ('chatgpt.com','chatgpt','perplexity.ai','perplexity','gemini.google.com','copilot.microsoft.com','claude.ai')
    GROUP BY 1 ORDER BY visitors DESC,source
  )
  SELECT jsonb_build_object(
    'visitors', (SELECT count(DISTINCT visitor) FROM events WHERE event_name = 'page_view'),
    'pageViews', (SELECT count(*) FROM events WHERE event_name = 'page_view'),
    'cartVisitors', (SELECT count(DISTINCT visitor) FROM events WHERE event_name = 'add_to_cart'),
    'cartViews', (SELECT count(*) FROM events WHERE event_name = 'cart_viewed'),
    'addToCarts', (SELECT count(*) FROM events WHERE event_name = 'add_to_cart'),
    'checkoutStarts', (SELECT count(*) FROM checkout_starts),
    'checkoutSubmits', (SELECT count(*) FROM events WHERE event_name = 'checkout_submitted'),
    'checkoutFailures', (SELECT count(*) FROM events WHERE event_name = 'checkout_failed'),
    'contacts', (SELECT count(DISTINCT anonymous_id) FROM events WHERE event_name = 'checkout_contact_captured'),
    'whatsapp', (SELECT count(*) FROM events WHERE event_name = 'whatsapp_started'),
    'orders', (SELECT count(*) FROM placed),
    'deliveredOrders', (SELECT count(*) FROM placed WHERE fulfillment_status = 'delivered'),
    'linkedOrders', (SELECT count(DISTINCT placed.cart_id) FROM placed JOIN carts c ON c.id = placed.cart_id JOIN checkout_starts s ON s.anonymous_id = c.anonymous_token),
    'visitorsWhoAdded', (SELECT count(DISTINCT a.visitor) FROM add_actions a JOIN visitors_in_range v ON v.visitor = a.visitor),
    'cartVisitorsWhoCheckedOut', (SELECT count(DISTINCT a.visitor) FROM add_actions a JOIN checkout_starts s ON s.anonymous_id = a.anonymous_id),
    'visitorsWhoOrdered', (SELECT count(DISTINCT e.visitor) FROM placed JOIN carts c ON c.id = placed.cart_id JOIN events e ON e.anonymous_id = c.anonymous_token
      JOIN visitors_in_range v ON v.visitor = e.visitor WHERE e.event_name = 'page_view'),
    'sales', (SELECT coalesce(sum(total_inr),0) FROM placed),
    'trend', (SELECT coalesce(jsonb_agg(jsonb_build_object('day',days.day,'visitors',coalesce(e.visitors,0),'adds',coalesce(e.adds,0),
      'starts',coalesce(s.starts,0),'orders',coalesce(o.orders,0)) ORDER BY days.day),'[]') FROM days
      LEFT JOIN daily_events e USING(day) LEFT JOIN daily_starts s USING(day) LEFT JOIN daily_orders o USING(day)),
    'products', (SELECT coalesce(jsonb_agg(to_jsonb(p) ORDER BY p.views DESC,p.slug),'[]') FROM products_viewed p),
    'buttons', (SELECT coalesce(jsonb_agg(to_jsonb(b) ORDER BY b.clicks DESC,b.action),'[]') FROM buttons b),
    'sources', (SELECT coalesce(jsonb_agg(to_jsonb(s) ORDER BY s.visitors DESC,s.source),'[]') FROM sources s),
    'aiSources', (SELECT coalesce(jsonb_agg(to_jsonb(a) ORDER BY a.visitors DESC,a.source),'[]') FROM ai_referrers a),
    'visibility', (SELECT jsonb_build_object('indexable',count(*),'complete',count(*) FILTER (WHERE
        nullif(btrim(seo_title),'') IS NOT NULL AND nullif(btrim(seo_description),'') IS NOT NULL
        AND nullif(btrim(hero_image_url),'') IS NOT NULL
        AND coalesce(nullif(btrim(short_description),''),nullif(btrim(description),'')) IS NOT NULL))
      FROM products WHERE status = 'active')
  );
$$;
--> statement-breakpoint
REVOKE EXECUTE ON FUNCTION shop_analytics(timestamptz) FROM PUBLIC, anon, authenticated;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION shop_analytics(timestamptz) TO service_role;
--> statement-breakpoint
NOTIFY pgrst, 'reload schema';

