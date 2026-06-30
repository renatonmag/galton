DROP TABLE "log_entry_characteristics" CASCADE;--> statement-breakpoint
DROP TABLE "log_entries" CASCADE;--> statement-breakpoint
DROP TABLE "characteristics" CASCADE;--> statement-breakpoint
DROP TABLE "setups" CASCADE;--> statement-breakpoint
DROP TABLE "strategies" CASCADE;--> statement-breakpoint
DROP TYPE "public"."characteristic_type";--> statement-breakpoint
ALTER TABLE "sessions" DROP COLUMN "closed_at";--> statement-breakpoint
CREATE TABLE "trade_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"decision" "decision" NOT NULL,
	"result" "result" DEFAULT 'open' NOT NULL,
	"r" text NOT NULL,
	"success_ratio" numeric(5, 4) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "trade_entries" ADD CONSTRAINT "trade_entries_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;
