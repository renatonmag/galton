ALTER TABLE "log_entries" ALTER COLUMN "result" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "log_entries" ALTER COLUMN "result" SET DEFAULT 'open'::text;--> statement-breakpoint
UPDATE "log_entries" SET result = 'profit' WHERE result = 'success';--> statement-breakpoint
UPDATE "log_entries" SET result = 'loss'   WHERE result = 'failure';--> statement-breakpoint
UPDATE "log_entries" SET result = 'open'   WHERE result IS NULL;--> statement-breakpoint
DROP TYPE "public"."result";--> statement-breakpoint
CREATE TYPE "public"."result" AS ENUM('open', 'profit', 'loss', 'breakeven');--> statement-breakpoint
ALTER TABLE "log_entries" ALTER COLUMN "result" SET DEFAULT 'open'::"public"."result";--> statement-breakpoint
ALTER TABLE "log_entries" ALTER COLUMN "result" SET DATA TYPE "public"."result" USING "result"::"public"."result";--> statement-breakpoint
ALTER TABLE "log_entries" ALTER COLUMN "result" SET NOT NULL;
