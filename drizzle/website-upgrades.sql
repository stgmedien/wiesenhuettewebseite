-- Website-Upgrades 07/2026: Warteliste, teilbare Angebote, Gruppen-Hub.
-- Additiv (CREATE TABLE IF NOT EXISTS) — gefahrlos auf Prod anwendbar.

CREATE TABLE IF NOT EXISTS "waitlist_entries" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" varchar(255) NOT NULL,
  "first_name" varchar(120),
  "arrival" date NOT NULL,
  "departure" date NOT NULL,
  "persons" integer,
  "notified_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "waitlist_range_idx" ON "waitlist_entries" ("arrival", "departure");
CREATE INDEX IF NOT EXISTS "waitlist_email_idx" ON "waitlist_entries" ("email");

CREATE TABLE IF NOT EXISTS "offers" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "token" varchar(64) NOT NULL UNIQUE,
  "arrival" date NOT NULL,
  "departure" date NOT NULL,
  "adults" integer NOT NULL DEFAULT 0,
  "children" integer NOT NULL DEFAULT 0,
  "pupils" integer NOT NULL DEFAULT 0,
  "teachers" integer NOT NULL DEFAULT 0,
  "purpose" varchar(200),
  "institution" varchar(200),
  "contact_name" varchar(200),
  "line_items" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "subtotal_cents" integer NOT NULL DEFAULT 0,
  "deposit_cents" integer NOT NULL DEFAULT 0,
  "kurtaxe_cents" integer NOT NULL DEFAULT 0,
  "valid_until" date NOT NULL,
  "views" integer NOT NULL DEFAULT 0,
  "created_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "offers_token_idx" ON "offers" ("token");

CREATE TABLE IF NOT EXISTS "booking_hubs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "booking_id" uuid NOT NULL UNIQUE REFERENCES "bookings"("id") ON DELETE CASCADE,
  "token" varchar(64) NOT NULL UNIQUE,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "hub_entries" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "hub_id" uuid NOT NULL REFERENCES "booking_hubs"("id") ON DELETE CASCADE,
  "kind" varchar(20) NOT NULL,
  "title" varchar(200) NOT NULL,
  "details" text,
  "author_name" varchar(120),
  "done" boolean NOT NULL DEFAULT false,
  "meta" jsonb,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "hub_entries_hub_idx" ON "hub_entries" ("hub_id", "kind");
