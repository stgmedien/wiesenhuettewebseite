CREATE TYPE "public"."discount_kind" AS ENUM('loyalty', 'manager', 'promo');--> statement-breakpoint
CREATE TABLE "discount_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(30) NOT NULL,
	"kind" "discount_kind" DEFAULT 'manager' NOT NULL,
	"percent_off" integer DEFAULT 0 NOT NULL,
	"fixed_off_cents" integer DEFAULT 0 NOT NULL,
	"customer_id" uuid,
	"issued_reason" varchar(255),
	"min_subtotal_cents" integer DEFAULT 0 NOT NULL,
	"valid_from" date,
	"valid_until" date,
	"max_redemptions" integer DEFAULT 1 NOT NULL,
	"redemptions" integer DEFAULT 0 NOT NULL,
	"redeemed_booking_id" uuid,
	"redeemed_at" timestamp,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "discount_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "completed_stays" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "loyalty_tier" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "loyalty_discount_issued_at" timestamp;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "anonymized_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "discount_codes" ADD CONSTRAINT "discount_codes_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discount_codes" ADD CONSTRAINT "discount_codes_redeemed_booking_id_bookings_id_fk" FOREIGN KEY ("redeemed_booking_id") REFERENCES "public"."bookings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "discount_codes_code_idx" ON "discount_codes" USING btree ("code");--> statement-breakpoint
CREATE INDEX "discount_codes_customer_idx" ON "discount_codes" USING btree ("customer_id");