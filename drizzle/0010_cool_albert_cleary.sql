CREATE TABLE "membership_tiers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(60) NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"annual_fee_cents" integer NOT NULL,
	"stripe_price_id" text,
	"stripe_product_id" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "membership_tiers_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "membership_tier_code" varchar(60);--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "stripe_subscription_id" text;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "stripe_subscription_customer_id" text;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "subscription_status" varchar(30);--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "subscription_current_period_end" timestamp;--> statement-breakpoint
CREATE INDEX "membership_tiers_code_idx" ON "membership_tiers" USING btree ("code");