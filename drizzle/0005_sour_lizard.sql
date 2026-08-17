ALTER TABLE "carts" ADD COLUMN "full_name" text;--> statement-breakpoint
ALTER TABLE "carts" ADD COLUMN "line1" text;--> statement-breakpoint
ALTER TABLE "carts" ADD COLUMN "line2" text;--> statement-breakpoint
ALTER TABLE "carts" ADD COLUMN "city" text;--> statement-breakpoint
ALTER TABLE "carts" ADD COLUMN "state" text;--> statement-breakpoint
ALTER TABLE "carts" ADD COLUMN "postal_code" text;--> statement-breakpoint
ALTER TABLE "carts" ADD COLUMN "country" text DEFAULT 'India';--> statement-breakpoint
ALTER TABLE "carts" ADD COLUMN "payment_method" text;--> statement-breakpoint
ALTER TABLE "carts" ADD COLUMN "checkout_step" text;--> statement-breakpoint
ALTER TABLE "carts" ADD COLUMN "source" text;--> statement-breakpoint
ALTER TABLE "carts" ADD COLUMN "medium" text;--> statement-breakpoint
ALTER TABLE "carts" ADD COLUMN "campaign" text;--> statement-breakpoint
ALTER TABLE "carts" ADD COLUMN "landing_page" text;--> statement-breakpoint
ALTER TABLE "carts" ADD COLUMN "referrer" text;--> statement-breakpoint
ALTER TABLE "carts" ADD COLUMN "device" text;