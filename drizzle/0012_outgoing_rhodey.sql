CREATE TABLE "community_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" varchar(20) NOT NULL,
	"author_name" varchar(120) NOT NULL,
	"author_context" varchar(200),
	"author_email" varchar(255),
	"title" varchar(200),
	"body" text NOT NULL,
	"photo_urls" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"visit_date" date,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"submitted_ip" varchar(64),
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"moderated_by" varchar(255),
	"moderated_at" timestamp,
	"moderation_note" text
);
--> statement-breakpoint
CREATE TABLE "hiking_routes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(120) NOT NULL,
	"name" varchar(200) NOT NULL,
	"summary" varchar(500),
	"description" text,
	"difficulty" varchar(20) NOT NULL,
	"distance_km" real,
	"elevation_gain_m" integer,
	"duration_minutes" integer,
	"start_lat" real,
	"start_lng" real,
	"gpx_url" text,
	"cover_image_url" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "hiking_routes_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE INDEX "community_entries_kind_status_idx" ON "community_entries" USING btree ("kind","status");--> statement-breakpoint
CREATE INDEX "community_entries_submitted_at_idx" ON "community_entries" USING btree ("submitted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "hiking_routes_slug_uniq" ON "hiking_routes" USING btree ("slug");