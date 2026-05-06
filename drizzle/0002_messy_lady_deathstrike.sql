ALTER TABLE "bookings" ADD COLUMN "deposit_hold" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "deposit_hold_reason" text;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "deposit_hold_at" timestamp;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "deposit_hold_by" varchar(255);