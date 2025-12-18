ALTER TABLE "deliveries" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "deliveries" ALTER COLUMN "status" SET DEFAULT 'requested'::text;--> statement-breakpoint
DROP TYPE "public"."deliveryStatus";--> statement-breakpoint
CREATE TYPE "public"."deliveryStatus" AS ENUM('requested', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
ALTER TABLE "deliveries" ALTER COLUMN "status" SET DEFAULT 'requested'::"public"."deliveryStatus";--> statement-breakpoint
ALTER TABLE "deliveries" ALTER COLUMN "status" SET DATA TYPE "public"."deliveryStatus" USING "status"::"public"."deliveryStatus";