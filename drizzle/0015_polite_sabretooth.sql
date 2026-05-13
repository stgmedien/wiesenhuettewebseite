CREATE TYPE "public"."external_review_source" AS ENUM('google', 'gruppenhaus', 'gruppenunterkuenfte', 'manual');--> statement-breakpoint
CREATE TABLE "external_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" "external_review_source" NOT NULL,
	"author_name" varchar(200) NOT NULL,
	"rating" integer,
	"text" text,
	"reviewed_at" date,
	"relative_time" varchar(60),
	"source_ref" varchar(255),
	"source_url" text,
	"original_language" varchar(5),
	"translated" boolean DEFAULT false NOT NULL,
	"published" boolean DEFAULT true NOT NULL,
	"highlight" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "ext_reviews_source_ref_idx" ON "external_reviews" USING btree ("source","source_ref");--> statement-breakpoint
CREATE INDEX "ext_reviews_published_idx" ON "external_reviews" USING btree ("published");--> statement-breakpoint
CREATE INDEX "ext_reviews_source_idx" ON "external_reviews" USING btree ("source");