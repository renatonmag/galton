CREATE TYPE "public"."behavior_insight_status" AS ENUM('active', 'dismissed');--> statement-breakpoint
CREATE TABLE "behavior_insights" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"text" text NOT NULL,
	"evidence_count" integer DEFAULT 0 NOT NULL,
	"first_seen" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen" timestamp with time zone DEFAULT now() NOT NULL,
	"status" "behavior_insight_status" DEFAULT 'active' NOT NULL
);
