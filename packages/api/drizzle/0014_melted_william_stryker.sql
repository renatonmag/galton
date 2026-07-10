CREATE TYPE "public"."behavior_insight_type" AS ENUM('do', 'dont');--> statement-breakpoint
ALTER TABLE "behavior_insights" ADD COLUMN "type" "behavior_insight_type" NOT NULL;