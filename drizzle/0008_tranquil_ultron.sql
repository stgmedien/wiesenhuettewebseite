CREATE TABLE "mail_template_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"subject" text NOT NULL,
	"body_md" text NOT NULL,
	"change_note" text,
	"created_by" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mail_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(80) NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"variables" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"active_version_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "mail_templates_key_unique" UNIQUE("key")
);
--> statement-breakpoint
ALTER TABLE "handovers" ADD COLUMN "signature_guest_url" text;--> statement-breakpoint
ALTER TABLE "handovers" ADD COLUMN "signature_manager_url" text;--> statement-breakpoint
ALTER TABLE "handovers" ADD COLUMN "guest_name" varchar(255);--> statement-breakpoint
ALTER TABLE "handovers" ADD COLUMN "completed_at" timestamp;--> statement-breakpoint
ALTER TABLE "mail_template_versions" ADD CONSTRAINT "mail_template_versions_template_id_mail_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."mail_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "mail_template_version_uniq" ON "mail_template_versions" USING btree ("template_id","version");--> statement-breakpoint
CREATE INDEX "mail_templates_key_idx" ON "mail_templates" USING btree ("key");