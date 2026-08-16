CREATE TABLE "admin_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" text DEFAULT 'content' NOT NULL,
	"subject" text,
	"body" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" text DEFAULT 'page' NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"summary" text,
	"body" text,
	"image_url" text,
	"seo_title" text,
	"seo_description" text,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text,
	"email" text,
	"type" text DEFAULT 'general' NOT NULL,
	"rating" integer,
	"message" text NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"admin_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"url" text NOT NULL,
	"public_id" text,
	"filename" text,
	"alt_text" text,
	"folder" text DEFAULT 'general' NOT NULL,
	"width" integer,
	"height" integer,
	"bytes" integer,
	"mime_type" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "newsletter_subscribers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"status" text DEFAULT 'subscribed' NOT NULL,
	"source" text DEFAULT 'website' NOT NULL,
	"subscribed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"unsubscribed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "partnerships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"company" text,
	"email" text,
	"phone" text,
	"type" text DEFAULT 'creator' NOT NULL,
	"status" text DEFAULT 'lead' NOT NULL,
	"value_inr" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stock_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid,
	"variant_id" uuid,
	"customer_name" text,
	"email" text NOT NULL,
	"phone" text,
	"requested_size" text,
	"status" text DEFAULT 'requested' NOT NULL,
	"notified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "carts" ADD COLUMN "email" text;--> statement-breakpoint
ALTER TABLE "carts" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "carts" ADD COLUMN "status" text DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "carts" ADD COLUMN "last_activity_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "stock_requests" ADD CONSTRAINT "stock_requests_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_requests" ADD CONSTRAINT "stock_requests_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "admin_templates_type_idx" ON "admin_templates" USING btree ("type");--> statement-breakpoint
CREATE UNIQUE INDEX "content_entries_slug_idx" ON "content_entries" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "content_entries_status_idx" ON "content_entries" USING btree ("status");--> statement-breakpoint
CREATE INDEX "customer_feedback_status_idx" ON "customer_feedback" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "media_assets_url_idx" ON "media_assets" USING btree ("url");--> statement-breakpoint
CREATE INDEX "media_assets_folder_idx" ON "media_assets" USING btree ("folder");--> statement-breakpoint
CREATE UNIQUE INDEX "newsletter_subscribers_email_idx" ON "newsletter_subscribers" USING btree ("email");--> statement-breakpoint
CREATE INDEX "partnerships_status_idx" ON "partnerships" USING btree ("status");--> statement-breakpoint
CREATE INDEX "stock_requests_status_idx" ON "stock_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "stock_requests_product_idx" ON "stock_requests" USING btree ("product_id");
--> statement-breakpoint
ALTER TABLE "admin_templates" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "content_entries" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "customer_feedback" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "media_assets" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "newsletter_subscribers" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "partnerships" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "stock_requests" ENABLE ROW LEVEL SECURITY;
