ALTER TABLE "products" ADD COLUMN "material" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "care_instructions" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "style_notes" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "tags" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "ai_generated_at" timestamp with time zone;