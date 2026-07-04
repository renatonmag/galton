CREATE TYPE "public"."direction" AS ENUM('buy', 'sell');--> statement-breakpoint
ALTER TABLE "trade_entries" ADD COLUMN "direction" "direction";