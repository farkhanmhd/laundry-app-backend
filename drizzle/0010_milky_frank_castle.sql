CREATE TYPE "public"."item_type" AS ENUM('service', 'inventory');--> statement-breakpoint
ALTER TYPE "public"."itemType" ADD VALUE 'bundling';--> statement-breakpoint
ALTER TYPE "public"."itemType" ADD VALUE 'voucher';--> statement-breakpoint
ALTER TABLE "bundling_items" ALTER COLUMN "itemType" SET DATA TYPE "public"."item_type" USING "itemType"::text::"public"."item_type";