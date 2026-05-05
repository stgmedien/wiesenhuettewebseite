CREATE TYPE "public"."booking_status" AS ENUM('angefragt', 'bestaetigt', 'bezahlt', 'angereist', 'abgereist', 'storniert', 'wartung');--> statement-breakpoint
CREATE TYPE "public"."customer_type" AS ENUM('privat', 'mitglied', 'verein', 'firma');--> statement-breakpoint
CREATE TYPE "public"."payment_kind" AS ENUM('anzahlung', 'restzahlung', 'vollzahlung', 'kaution', 'rueckerstattung');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('offen', 'erhalten', 'fehlgeschlagen', 'erstattet');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('customer', 'manager', 'admin');--> statement-breakpoint
CREATE TABLE "activity_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"who" varchar(255) NOT NULL,
	"what" text NOT NULL,
	"booking_id" uuid,
	"at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_number" varchar(20) NOT NULL,
	"customer_id" uuid,
	"status" "booking_status" DEFAULT 'angefragt' NOT NULL,
	"arrival" date NOT NULL,
	"departure" date NOT NULL,
	"nights" integer NOT NULL,
	"adults" integer DEFAULT 0 NOT NULL,
	"members" integer DEFAULT 0 NOT NULL,
	"children" integer DEFAULT 0 NOT NULL,
	"pupils" integer DEFAULT 0 NOT NULL,
	"teachers" integer DEFAULT 0 NOT NULL,
	"purpose" varchar(255),
	"persons" integer NOT NULL,
	"accommodation_cents" integer DEFAULT 0 NOT NULL,
	"kurtaxe_cents" integer DEFAULT 0 NOT NULL,
	"energy_flat_cents" integer DEFAULT 0 NOT NULL,
	"cleaning_cents" integer DEFAULT 0 NOT NULL,
	"solo_surcharge_cents" integer DEFAULT 0 NOT NULL,
	"extras_cents" integer DEFAULT 0 NOT NULL,
	"subtotal_cents" integer DEFAULT 0 NOT NULL,
	"deposit_cents" integer DEFAULT 0 NOT NULL,
	"total_cents" integer DEFAULT 0 NOT NULL,
	"paid_cents" integer DEFAULT 0 NOT NULL,
	"extras_snapshot" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"cleaning_opted_in" boolean DEFAULT true NOT NULL,
	"solo_use" boolean DEFAULT false NOT NULL,
	"stripe_session_id" text,
	"stripe_payment_intent_id" text,
	"source" varchar(60) DEFAULT 'Portal' NOT NULL,
	"key_method" varchar(60) DEFAULT 'Schlüsselsafe',
	"internal_notes" text,
	"customer_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "bookings_booking_number_unique" UNIQUE("booking_number")
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"type" "customer_type" DEFAULT 'privat' NOT NULL,
	"first_name" varchar(120) NOT NULL,
	"last_name" varchar(120) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(60),
	"company" varchar(255),
	"member_id" varchar(60),
	"street" varchar(255),
	"zip" varchar(20),
	"city" varchar(120),
	"country" varchar(60) DEFAULT 'DE' NOT NULL,
	"notes" text,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid,
	"to" varchar(255) NOT NULL,
	"subject" text NOT NULL,
	"template" varchar(60) NOT NULL,
	"status" varchar(30) DEFAULT 'sent' NOT NULL,
	"error" text,
	"sent_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"kind" "payment_kind" NOT NULL,
	"status" "payment_status" DEFAULT 'offen' NOT NULL,
	"amount_cents" integer NOT NULL,
	"method" varchar(60),
	"stripe_payment_intent_id" text,
	"received_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255),
	"password_hash" text,
	"role" "user_role" DEFAULT 'customer' NOT NULL,
	"email_verified" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_log" ADD CONSTRAINT "email_log_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bookings_arrival_idx" ON "bookings" USING btree ("arrival");--> statement-breakpoint
CREATE INDEX "bookings_departure_idx" ON "bookings" USING btree ("departure");--> statement-breakpoint
CREATE INDEX "bookings_status_idx" ON "bookings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "customers_email_idx" ON "customers" USING btree ("email");