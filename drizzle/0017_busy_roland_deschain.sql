ALTER TABLE "deliveries" ALTER COLUMN "type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."deliveryType";--> statement-breakpoint
CREATE TYPE "public"."deliveryType" AS ENUM('pickup', 'delivery');--> statement-breakpoint
ALTER TABLE "deliveries" ALTER COLUMN "type" SET DATA TYPE "public"."deliveryType" USING "type"::"public"."deliveryType";--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "note" varchar;