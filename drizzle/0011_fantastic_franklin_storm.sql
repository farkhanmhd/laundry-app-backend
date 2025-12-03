ALTER TABLE "bundling_items" RENAME COLUMN "itemType" TO "item_type";--> statement-breakpoint
ALTER TABLE "order_items" ALTER COLUMN "itemType" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "bundling_items" ALTER COLUMN "item_type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."itemType";--> statement-breakpoint
CREATE TYPE "public"."itemType" AS ENUM('service', 'inventory');--> statement-breakpoint
ALTER TABLE "order_items" ALTER COLUMN "itemType" SET DATA TYPE "public"."itemType" USING "itemType"::"public"."itemType";--> statement-breakpoint
ALTER TABLE "bundling_items" ALTER COLUMN "item_type" SET DATA TYPE "public"."itemType" USING "item_type"::"public"."itemType";--> statement-breakpoint
DROP TYPE "public"."item_type";