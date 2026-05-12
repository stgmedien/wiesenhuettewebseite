CREATE TABLE "booking_attempts" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255),
	"ip" varchar(64),
	"at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "login_attempts" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"ip" varchar(64),
	"kind" varchar(20) NOT NULL,
	"success" boolean NOT NULL,
	"at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stripe_webhook_events" (
	"event_id" text PRIMARY KEY NOT NULL,
	"event_type" text NOT NULL,
	"status" varchar(20) DEFAULT 'processed' NOT NULL,
	"received_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "booking_attempts_email_at_idx" ON "booking_attempts" USING btree ("email","at");--> statement-breakpoint
CREATE INDEX "booking_attempts_ip_at_idx" ON "booking_attempts" USING btree ("ip","at");--> statement-breakpoint
CREATE INDEX "login_attempts_email_at_idx" ON "login_attempts" USING btree ("email","at");--> statement-breakpoint
CREATE INDEX "login_attempts_ip_at_idx" ON "login_attempts" USING btree ("ip","at");