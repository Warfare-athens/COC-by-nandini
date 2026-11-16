-- Run against a local database with the Drizzle migrations applied.
BEGIN;

DO $$
DECLARE
  product_id uuid;
  variant_id uuid;
  cart_token text := gen_random_uuid()::text;
  other_token text := gen_random_uuid()::text;
  legacy_token text := gen_random_uuid()::text;
  visitor_id text := gen_random_uuid()::text;
  fixture_slug text := 'test-journey-' || gen_random_uuid();
  fixture_order text := 'TEST-' || gen_random_uuid();
  online_order uuid;
  cod_order uuid;
  item jsonb;
  profile jsonb := '{"full_name":"Test Shopper","email":"shopper@example.test","phone":"+919876543210","line1":"12 Test Street","city":"Ahmedabad","state":"Gujarat","postal_code":"380001","country":"India","payment_method":"razorpay"}';
  order_values jsonb := '{"payment_method":"razorpay","total_inr":799,"subtotal_inr":650,"shipping_inr":149,"discount_inr":0}';
  result jsonb;
  before_analytics jsonb;
  after_analytics jsonb;
  since timestamptz := now() - interval '24 hours';
BEGIN
  IF has_function_privilege('anon','create_shop_order(text,text,text,jsonb,jsonb,jsonb,jsonb,bigint)','EXECUTE') THEN
    RAISE EXCEPTION 'Anonymous access to order creation RPC';
  END IF;
  before_analytics := shop_analytics(since);
  INSERT INTO products(name,slug,status,price_inr) VALUES ('Tracking fixture',fixture_slug,'active',600) RETURNING id INTO product_id;
  INSERT INTO product_variants(product_id,sku,title,size,color,price_inr,inventory_quantity)
  VALUES(product_id,fixture_slug,'Medium – Blue','M','Blue',650,4) RETURNING id INTO variant_id;
  item := jsonb_build_object('product_id',product_id,'variant_id',variant_id,'quantity',1,
    'product_name','Tracking fixture','variant_title','Medium – Blue','sku',fixture_slug,
    'unit_price_inr',650,'total_inr',650);

  PERFORM track_cart(cart_token,1,jsonb_build_array(item));
  PERFORM track_cart(cart_token,3,jsonb_build_array(item || '{"quantity":2}'));
  PERFORM track_cart(cart_token,2,'[]');
  IF (SELECT ci.quantity FROM cart_items ci JOIN carts c ON c.id = ci.cart_id WHERE c.anonymous_token = cart_token) <> 2 THEN
    RAISE EXCEPTION 'A stale cart update replaced the latest quantity';
  END IF;
  PERFORM track_cart(cart_token,p_lead_revision => 4,p_profile => profile);
  PERFORM track_cart(cart_token,p_lead_revision => 2,p_profile => '{"phone":null}');
  PERFORM track_cart(other_token,p_lead_revision => 1,p_profile => profile);
  INSERT INTO carts(anonymous_token,status,checkout_step) VALUES(legacy_token,'converted','completed');
  IF NOT ((track_cart(legacy_token,1,jsonb_build_array(item))->>'legacy')::boolean) THEN
    RAISE EXCEPTION 'A legacy converted token did not receive a rotation signal';
  END IF;

  result := create_shop_order(cart_token,'key-' || cart_token,fixture_order,order_values,profile,jsonb_build_array(item),'{}',5);
  online_order := (result->'order'->>'id')::uuid;
  IF result->'order'->>'status' <> 'pending_payment' OR result->'order'->>'cart_id' IS NULL THEN
    RAISE EXCEPTION 'New payment draft status or cart linkage is incorrect';
  END IF;
  result := create_shop_order(cart_token,'key-' || cart_token,'retry-' || fixture_order,order_values,profile,jsonb_build_array(item),'{}',6);
  IF (result->>'created')::boolean OR (result->'order'->>'id')::uuid <> online_order THEN
    RAISE EXCEPTION 'Retry created a duplicate order';
  END IF;
  BEGIN
    PERFORM admin_update_shop_order(online_order,'confirmed','processing','{}');
    RAISE EXCEPTION 'unpaid order allowed fulfillment';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM NOT LIKE 'Online payment must be captured%' THEN RAISE; END IF;
  END;
  UPDATE orders SET placed_at = now() - interval '14 days' WHERE id = online_order;
  PERFORM record_shop_payment(online_order,'gateway-fixture','pending');
  PERFORM record_shop_payment(online_order,'gateway-fixture','authorized','pay-authorized');
  PERFORM record_shop_payment(online_order,'gateway-fixture','failed','pay-failed');
  IF (SELECT payment_status FROM orders WHERE id = online_order) <> 'authorized' THEN
    RAISE EXCEPTION 'An unrelated failed attempt overwrote an authorized payment';
  END IF;
  result := record_shop_payment(online_order,'gateway-fixture','paid','pay-authorized');
  IF NOT (result->>'confirmed')::boolean OR result->'order'->>'confirmed_at' IS NULL THEN
    RAISE EXCEPTION 'A captured payment did not confirm the order';
  END IF;
  PERFORM record_shop_payment(online_order,'gateway-fixture','paid','pay-authorized');
  PERFORM record_shop_payment(online_order,'gateway-fixture','failed','pay-failed');
  PERFORM track_cart(cart_token,9,'[]',9,'{"phone":null}');
  IF (SELECT status FROM carts WHERE anonymous_token = cart_token) <> 'converted'
      OR (SELECT phone FROM carts WHERE anonymous_token = cart_token) <> profile->>'phone'
      OR (SELECT status FROM carts WHERE anonymous_token = other_token) <> 'checkout' THEN
    RAISE EXCEPTION 'Conversion or a late update changed the wrong cart';
  END IF;
  IF (SELECT inventory_quantity FROM product_variants WHERE id = variant_id) <> 3
      OR (SELECT count(*) FROM payments WHERE order_id = online_order) <> 2
      OR (SELECT count(*) FROM commerce_events WHERE order_id = online_order AND event_name = 'purchase') <> 1 THEN
    RAISE EXCEPTION 'Gateway retries did not preserve inventory, attempts or the single purchase event';
  END IF;
  PERFORM admin_update_shop_order(online_order,NULL,'shipped','{"carrier":"Test Carrier","tracking_number":"ABC"}');
  PERFORM admin_update_shop_order(online_order,NULL,'delivered','{}');
  IF (SELECT tracking_number FROM fulfillments WHERE order_id = online_order) <> 'ABC' THEN
    RAISE EXCEPTION 'An admin status-only edit erased tracking details';
  END IF;

  result := create_shop_order(other_token,'cod-' || other_token,'COD-' || fixture_order,
    order_values || '{"payment_method":"cod"}',profile,jsonb_build_array(item),'{}',4);
  cod_order := (result->'order'->>'id')::uuid;
  IF result->'order'->>'status' <> 'confirmed'
    OR (SELECT count(*) FROM fulfillments WHERE order_id = cod_order) <> 1
    OR (SELECT inventory_quantity FROM product_variants WHERE id = variant_id) <> 2 THEN
    RAISE EXCEPTION 'COD confirmation was incomplete';
  END IF;
  BEGIN
    PERFORM create_shop_order(gen_random_uuid()::text,gen_random_uuid()::text,'FAIL-' || fixture_order,
      order_values || '{"payment_method":"cod"}',profile,jsonb_build_array(item || '{"quantity":20}'),'{}',1);
    RAISE EXCEPTION 'out-of-stock checkout accepted';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM NOT LIKE 'An item is no longer in stock%' THEN RAISE; END IF;
  END;
  IF EXISTS (SELECT 1 FROM orders WHERE order_number = 'FAIL-' || fixture_order) THEN
    RAISE EXCEPTION 'Failed checkout left a partial order';
  END IF;

  INSERT INTO commerce_events(anonymous_id,event_name,path,product_id,metadata,created_at) VALUES
    (cart_token,'page_view','/',NULL,jsonb_build_object('visitorId',visitor_id,'source','chatgpt.com'),now()),
    (other_token,'page_view','/',NULL,jsonb_build_object('visitorId',visitor_id),now()),
    (other_token,'page_view','/',NULL,jsonb_build_object('visitorId','out-of-range'),now() - interval '72 hours'),
    (cart_token,'product_view','/product/' || fixture_slug,product_id,jsonb_build_object('visitorId',visitor_id),now()),
    (cart_token,'button_clicked','/',NULL,'{"action":"open_cart"}',now()),
    (cart_token,'checkout_started','/checkout',NULL,'{}',now());
  after_analytics := shop_analytics(since);
  IF (after_analytics->>'visitors')::int <> (before_analytics->>'visitors')::int + 1
      OR (after_analytics->>'orders')::int <> (before_analytics->>'orders')::int + 2
      OR (after_analytics->>'checkoutStarts')::int <> (before_analytics->>'checkoutStarts')::int + 2
      OR (after_analytics->>'linkedOrders')::int <> (before_analytics->>'linkedOrders')::int + 2 THEN
    RAISE EXCEPTION 'Analytics window, visitor identity, checkout deduplication or order attribution is incorrect';
  END IF;
  IF NOT (after_analytics->'aiSources' @> '[{"source":"chatgpt.com"}]')
    OR NOT (after_analytics->'buttons' @> '[{"action":"open_cart"}]')
    OR NOT (after_analytics->'products' @> jsonb_build_array(jsonb_build_object('slug',fixture_slug,'name','Tracking fixture','views',1))) THEN
    RAISE EXCEPTION 'Analytics breakdowns are missing fixture activity';
  END IF;
END $$;

ROLLBACK;
