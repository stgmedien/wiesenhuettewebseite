ALTER TABLE "email_log" ADD COLUMN "message_id" text;--> statement-breakpoint
ALTER TABLE "email_log" ADD COLUMN "delivery_status" varchar(20);--> statement-breakpoint
ALTER TABLE "email_log" ADD COLUMN "delivery_status_at" timestamp;