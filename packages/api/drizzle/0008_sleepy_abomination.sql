CREATE TABLE "daily_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"report_date" date NOT NULL,
	"historic_ratio" numeric(5, 4),
	"week_ratio" numeric(5, 4),
	"open_count" integer NOT NULL,
	"improvements" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"strengths" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "daily_reports_user_id_report_date_unique" UNIQUE("user_id","report_date")
);
--> statement-breakpoint
ALTER TABLE "user_preferences" ALTER COLUMN "notification_time" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD COLUMN "timezone" text DEFAULT 'UTC' NOT NULL;