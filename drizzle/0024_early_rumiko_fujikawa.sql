CREATE TABLE "projekt_anfragen" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"projekt_key" varchar(60) NOT NULL,
	"projekt_nr" varchar(10) NOT NULL,
	"projekt_titel" varchar(300) NOT NULL,
	"gruppe" varchar(200) NOT NULL,
	"kontakt_name" varchar(200) NOT NULL,
	"kontakt_email" varchar(320) NOT NULL,
	"kontakt_telefon" varchar(60),
	"nachricht" text,
	"erledigt" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "projekt_anfragen_projekt_key_idx" ON "projekt_anfragen" USING btree ("projekt_key");--> statement-breakpoint
CREATE INDEX "projekt_anfragen_erledigt_idx" ON "projekt_anfragen" USING btree ("erledigt");
