CREATE TABLE "donations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stripe_session_id" text NOT NULL,
	"stripe_payment_intent_id" text,
	"donor_name" varchar(255) NOT NULL,
	"donor_email" varchar(255) NOT NULL,
	"amount_cents" integer NOT NULL,
	"purpose" varchar(60) DEFAULT 'zeltpodest' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "donations_stripe_session_id_unique" UNIQUE("stripe_session_id")
);
