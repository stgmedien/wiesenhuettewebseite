ALTER TABLE "bookings" ADD COLUMN "legacy_nichtmitglied_cents" integer;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "legacy_mitglied_cents" integer;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "legacy_kind_cents" integer;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "legacy_schueler_cents" integer;