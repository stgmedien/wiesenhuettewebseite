CREATE TABLE "bulk_mail_campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subject" varchar(200) NOT NULL,
	"body" text NOT NULL,
	"audience" varchar(40) NOT NULL,
	"audience_filter" jsonb,
	"created_by" varchar(255) NOT NULL,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"total_recipients" integer DEFAULT 0 NOT NULL,
	"total_sent" integer DEFAULT 0 NOT NULL,
	"total_failed" integer DEFAULT 0 NOT NULL,
	"total_opted_out" integer DEFAULT 0 NOT NULL,
	"scheduled_for" timestamp,
	"sent_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bulk_mail_sends" (
	"id" serial PRIMARY KEY NOT NULL,
	"campaign_id" uuid NOT NULL,
	"customer_id" uuid,
	"email" varchar(255) NOT NULL,
	"status" varchar(20) NOT NULL,
	"error_message" text,
	"sent_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "maintenance_tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text,
	"location" varchar(200),
	"severity" varchar(20) DEFAULT 'medium' NOT NULL,
	"status" varchar(20) DEFAULT 'open' NOT NULL,
	"photo_urls" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_by" varchar(255),
	"assigned_to" varchar(255),
	"resolved_at" timestamp,
	"resolution_note" text,
	"booking_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "regional_recommendations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category" varchar(40) NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"address" varchar(500),
	"website_url" text,
	"phone" varchar(60),
	"opening_hours" varchar(500),
	"distance_from_huette_km" real,
	"lat" real,
	"lng" real,
	"image_url" text,
	"seasonal_only" varchar(40),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vouchers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(24) NOT NULL,
	"value_cents" integer NOT NULL,
	"redeemed_cents" integer DEFAULT 0 NOT NULL,
	"purchaser_name" varchar(200) NOT NULL,
	"purchaser_email" varchar(255) NOT NULL,
	"recipient_name" varchar(200),
	"recipient_email" varchar(255),
	"personal_message" text,
	"delivery_mode" varchar(20) DEFAULT 'email' NOT NULL,
	"stripe_session_id" text,
	"stripe_payment_intent_id" text,
	"paid_at" timestamp,
	"expires_at" timestamp,
	"first_redeemed_at" timestamp,
	"fully_redeemed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "vouchers_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "accepted_hausordnung_version" varchar(20);--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "accepted_hausordnung_at" timestamp;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "voucher_id" uuid;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "voucher_discount_cents" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "birth_date" date;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "email_opt_out" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "preferred_language" varchar(5) DEFAULT 'de' NOT NULL;--> statement-breakpoint
ALTER TABLE "bulk_mail_sends" ADD CONSTRAINT "bulk_mail_sends_campaign_id_bulk_mail_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."bulk_mail_campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bulk_mail_sends" ADD CONSTRAINT "bulk_mail_sends_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_tickets" ADD CONSTRAINT "maintenance_tickets_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bulk_mail_sends_campaign_idx" ON "bulk_mail_sends" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "maintenance_tickets_status_idx" ON "maintenance_tickets" USING btree ("status");--> statement-breakpoint
CREATE INDEX "maintenance_tickets_severity_idx" ON "maintenance_tickets" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "maintenance_tickets_created_at_idx" ON "maintenance_tickets" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "regional_recommendations_category_idx" ON "regional_recommendations" USING btree ("category");--> statement-breakpoint
CREATE INDEX "regional_recommendations_active_idx" ON "regional_recommendations" USING btree ("active");--> statement-breakpoint
CREATE UNIQUE INDEX "vouchers_code_uniq" ON "vouchers" USING btree ("code");--> statement-breakpoint
CREATE INDEX "vouchers_recipient_email_idx" ON "vouchers" USING btree ("recipient_email");--> statement-breakpoint
CREATE INDEX "vouchers_purchaser_email_idx" ON "vouchers" USING btree ("purchaser_email");--> statement-breakpoint
CREATE INDEX "customers_birth_date_idx" ON "customers" USING btree ("birth_date");