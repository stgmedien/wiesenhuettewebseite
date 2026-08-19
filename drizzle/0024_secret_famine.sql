CREATE TYPE "public"."projekt_status" AS ENUM('frei', 'teils', 'vergeben');--> statement-breakpoint
CREATE TABLE "booking_hubs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"token" varchar(64) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "booking_hubs_booking_id_unique" UNIQUE("booking_id"),
	CONSTRAINT "booking_hubs_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "hub_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hub_id" uuid NOT NULL,
	"kind" varchar(20) NOT NULL,
	"title" varchar(200) NOT NULL,
	"details" text,
	"author_name" varchar(120),
	"done" boolean DEFAULT false NOT NULL,
	"meta" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "offers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token" varchar(64) NOT NULL,
	"arrival" date NOT NULL,
	"departure" date NOT NULL,
	"adults" integer DEFAULT 0 NOT NULL,
	"children" integer DEFAULT 0 NOT NULL,
	"pupils" integer DEFAULT 0 NOT NULL,
	"teachers" integer DEFAULT 0 NOT NULL,
	"purpose" varchar(200),
	"institution" varchar(200),
	"contact_name" varchar(200),
	"line_items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"subtotal_cents" integer DEFAULT 0 NOT NULL,
	"deposit_cents" integer DEFAULT 0 NOT NULL,
	"kurtaxe_cents" integer DEFAULT 0 NOT NULL,
	"valid_until" date NOT NULL,
	"views" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "offers_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "projekte" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(60) NOT NULL,
	"nr" varchar(10) NOT NULL,
	"titel" varchar(300) NOT NULL,
	"untertitel" varchar(300) NOT NULL,
	"darum_gehts" text NOT NULL,
	"brauchen_wir" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"zeitrahmen" varchar(200) DEFAULT '-' NOT NULL,
	"aufwand" varchar(200) DEFAULT '-' NOT NULL,
	"kosten" text DEFAULT 'Richtwert: bitte eintragen' NOT NULL,
	"anpacken" text NOT NULL,
	"beitrag" text NOT NULL,
	"danke" text NOT NULL,
	"kontakt" text DEFAULT 'Ansprechpartner steht noch nicht fest' NOT NULL,
	"bild" text NOT NULL,
	"status" "projekt_status" DEFAULT 'frei' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "projekte_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "waitlist_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"first_name" varchar(120),
	"arrival" date NOT NULL,
	"departure" date NOT NULL,
	"persons" integer,
	"notified_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "booking_hubs" ADD CONSTRAINT "booking_hubs_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hub_entries" ADD CONSTRAINT "hub_entries_hub_id_booking_hubs_id_fk" FOREIGN KEY ("hub_id") REFERENCES "public"."booking_hubs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "hub_entries_hub_idx" ON "hub_entries" USING btree ("hub_id","kind");--> statement-breakpoint
CREATE INDEX "offers_token_idx" ON "offers" USING btree ("token");--> statement-breakpoint
CREATE INDEX "projekte_sort_idx" ON "projekte" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "waitlist_range_idx" ON "waitlist_entries" USING btree ("arrival","departure");--> statement-breakpoint
CREATE INDEX "waitlist_email_idx" ON "waitlist_entries" USING btree ("email");