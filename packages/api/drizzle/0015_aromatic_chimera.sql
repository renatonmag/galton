ALTER TABLE "voice_notes" ADD COLUMN "coach_insight" jsonb;--> statement-breakpoint
ALTER TABLE "voice_notes" ADD COLUMN "matched_insight_id" uuid;--> statement-breakpoint
ALTER TABLE "voice_notes" ADD CONSTRAINT "voice_notes_matched_insight_id_behavior_insights_id_fk" FOREIGN KEY ("matched_insight_id") REFERENCES "public"."behavior_insights"("id") ON DELETE set null ON UPDATE no action;