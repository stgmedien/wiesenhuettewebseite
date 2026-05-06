CREATE TYPE "public"."blocked_date_kind" AS ENUM('wartung', 'reinigung', 'veranstaltung', 'sonstiges');--> statement-breakpoint
CREATE TYPE "public"."damage_severity" AS ENUM('klein', 'mittel', 'gross', 'abrechnung');--> statement-breakpoint
CREATE TYPE "public"."damage_status" AS ENUM('offen', 'in_bearbeitung', 'behoben', 'abgerechnet');--> statement-breakpoint
CREATE TYPE "public"."handover_kind" AS ENUM('checkin', 'checkout');--> statement-breakpoint
CREATE TYPE "public"."inquiry_status" AS ENUM('new', 'in_progress', 'replied', 'converted', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."invoice_status" AS ENUM('entwurf', 'ausgestellt', 'bezahlt', 'storniert');--> statement-breakpoint
CREATE TYPE "public"."membership_status" AS ENUM('none', 'pending', 'verified', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."note_scope" AS ENUM('booking', 'customer', 'inquiry');--> statement-breakpoint
CREATE TYPE "public"."tariff_category" AS ENUM('mitglied', 'nichtmitglied', 'kind', 'schueler', 'lehrer');--> statement-breakpoint
CREATE TABLE "blocked_dates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"from_date" date NOT NULL,
	"to_date" date NOT NULL,
	"kind" "blocked_date_kind" DEFAULT 'wartung' NOT NULL,
	"reason" varchar(255),
	"notes" text,
	"created_by" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "booking_extras" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"extra_id" uuid,
	"label" varchar(200) NOT NULL,
	"qty" integer DEFAULT 1 NOT NULL,
	"unit_cents" integer NOT NULL,
	"total_cents" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "damage_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid,
	"reported_at" timestamp DEFAULT now() NOT NULL,
	"reported_by" varchar(255),
	"severity" "damage_severity" DEFAULT 'klein' NOT NULL,
	"status" "damage_status" DEFAULT 'offen' NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text,
	"estimated_cost_cents" integer DEFAULT 0 NOT NULL,
	"actual_cost_cents" integer DEFAULT 0 NOT NULL,
	"photo_urls" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"deduct_from_deposit" boolean DEFAULT false NOT NULL,
	"resolved_at" timestamp,
	"resolved_by" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "extras" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(60) NOT NULL,
	"label" varchar(200) NOT NULL,
	"description" text,
	"unit_cents" integer NOT NULL,
	"unit_label" varchar(60),
	"per_night" boolean DEFAULT false NOT NULL,
	"per_person" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "extras_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "handovers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"kind" "handover_kind" NOT NULL,
	"at" timestamp DEFAULT now() NOT NULL,
	"by" varchar(255),
	"notes" text,
	"checklist" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"photo_urls" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inquiries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"inquiry_number" varchar(20) NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(60),
	"organization" varchar(255),
	"arrival" date,
	"departure" date,
	"persons" integer,
	"purpose" varchar(255),
	"message" text,
	"status" "inquiry_status" DEFAULT 'new' NOT NULL,
	"converted_to_booking_id" uuid,
	"replied_at" timestamp,
	"replied_by" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "inquiries_inquiry_number_unique" UNIQUE("inquiry_number")
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_number" varchar(30) NOT NULL,
	"booking_id" uuid,
	"customer_id" uuid,
	"status" "invoice_status" DEFAULT 'entwurf' NOT NULL,
	"issue_date" date,
	"due_date" date,
	"paid_at" timestamp,
	"sent_at" timestamp,
	"customer_snapshot" jsonb NOT NULL,
	"line_items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"subtotal_cents" integer DEFAULT 0 NOT NULL,
	"tax_cents" integer DEFAULT 0 NOT NULL,
	"total_cents" integer DEFAULT 0 NOT NULL,
	"pdf_url" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "invoices_invoice_number_unique" UNIQUE("invoice_number")
);
--> statement-breakpoint
CREATE TABLE "magic_link_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"consumed_at" timestamp,
	"request_ip" varchar(45),
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "magic_link_tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scope" "note_scope" NOT NULL,
	"ref_id" uuid NOT NULL,
	"body" text NOT NULL,
	"pinned" boolean DEFAULT false NOT NULL,
	"internal" boolean DEFAULT true NOT NULL,
	"by" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"role" "user_role" NOT NULL,
	"capability" varchar(80) NOT NULL,
	"description" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seasons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(120) NOT NULL,
	"code" varchar(30) NOT NULL,
	"start_month_day" varchar(5) NOT NULL,
	"end_month_day" varchar(5) NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "seasons_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "tariffs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(120) NOT NULL,
	"category" "tariff_category" NOT NULL,
	"season_id" uuid,
	"price_cents_per_night" integer NOT NULL,
	"min_nights" integer DEFAULT 1 NOT NULL,
	"valid_from" date,
	"valid_until" date,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "membership_status" "membership_status" DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "membership_verified_at" timestamp;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "membership_verified_by" varchar(255);--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "membership_rejected_reason" text;--> statement-breakpoint
ALTER TABLE "booking_extras" ADD CONSTRAINT "booking_extras_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_extras" ADD CONSTRAINT "booking_extras_extra_id_extras_id_fk" FOREIGN KEY ("extra_id") REFERENCES "public"."extras"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "damage_reports" ADD CONSTRAINT "damage_reports_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "handovers" ADD CONSTRAINT "handovers_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_converted_to_booking_id_bookings_id_fk" FOREIGN KEY ("converted_to_booking_id") REFERENCES "public"."bookings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tariffs" ADD CONSTRAINT "tariffs_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "blocked_dates_from_idx" ON "blocked_dates" USING btree ("from_date");--> statement-breakpoint
CREATE INDEX "blocked_dates_to_idx" ON "blocked_dates" USING btree ("to_date");--> statement-breakpoint
CREATE INDEX "booking_extras_booking_idx" ON "booking_extras" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "damage_reports_booking_idx" ON "damage_reports" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "damage_reports_status_idx" ON "damage_reports" USING btree ("status");--> statement-breakpoint
CREATE INDEX "extras_active_idx" ON "extras" USING btree ("active");--> statement-breakpoint
CREATE INDEX "handovers_booking_idx" ON "handovers" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "inquiries_status_idx" ON "inquiries" USING btree ("status");--> statement-breakpoint
CREATE INDEX "inquiries_email_idx" ON "inquiries" USING btree ("email");--> statement-breakpoint
CREATE INDEX "invoices_booking_idx" ON "invoices" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "invoices_customer_idx" ON "invoices" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "invoices_status_idx" ON "invoices" USING btree ("status");--> statement-breakpoint
CREATE INDEX "magic_link_email_idx" ON "magic_link_tokens" USING btree ("email");--> statement-breakpoint
CREATE INDEX "magic_link_expires_idx" ON "magic_link_tokens" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "notes_scope_ref_idx" ON "notes" USING btree ("scope","ref_id");--> statement-breakpoint
CREATE UNIQUE INDEX "permissions_role_cap_uniq" ON "permissions" USING btree ("role","capability");--> statement-breakpoint
CREATE INDEX "seasons_active_idx" ON "seasons" USING btree ("active");--> statement-breakpoint
CREATE INDEX "tariffs_category_idx" ON "tariffs" USING btree ("category");--> statement-breakpoint
CREATE INDEX "tariffs_active_idx" ON "tariffs" USING btree ("active");--> statement-breakpoint
CREATE INDEX "customers_membership_status_idx" ON "customers" USING btree ("membership_status");