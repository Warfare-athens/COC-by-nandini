ALTER TABLE "orders" ADD COLUMN "payment_provider_order_id" text;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "provider_order_id" text;