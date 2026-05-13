CREATE TABLE "feedback_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"sent_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"responded_at" timestamp,
	"overall_rating" integer,
	"cleanliness_rating" integer,
	"comfort_rating" integer,
	"location_rating" integer,
	"communication_rating" integer,
	"price_performance_rating" integer,
	"would_recommend" boolean,
	"highlight_text" text,
	"improvement_text" text,
	"surprise_text" text,
	"allow_quote_internally" boolean DEFAULT false NOT NULL,
	"respondent_name" varchar(120),
	CONSTRAINT "feedback_entries_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
ALTER TABLE "feedback_entries" ADD CONSTRAINT "feedback_entries_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "feedback_entries_booking_idx" ON "feedback_entries" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "feedback_entries_responded_idx" ON "feedback_entries" USING btree ("responded_at");