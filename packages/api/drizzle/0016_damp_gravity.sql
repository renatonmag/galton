ALTER TABLE "behavior_insights" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "behavior_insights" ALTER COLUMN "status" SET DEFAULT 'active'::text;--> statement-breakpoint
DROP TYPE "public"."behavior_insight_status";--> statement-breakpoint
CREATE TYPE "public"."behavior_insight_status" AS ENUM('active', 'dismissed');--> statement-breakpoint
ALTER TABLE "behavior_insights" ALTER COLUMN "status" SET DEFAULT 'active'::"public"."behavior_insight_status";--> statement-breakpoint
ALTER TABLE "behavior_insights" ALTER COLUMN "status" SET DATA TYPE "public"."behavior_insight_status" USING "status"::"public"."behavior_insight_status";--> statement-breakpoint
ALTER TABLE "sessions" DROP COLUMN "reinforce_processed";