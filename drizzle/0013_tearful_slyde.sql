ALTER TABLE "inventories" RENAME COLUMN "current_quantity" TO "stock";--> statement-breakpoint
ALTER TABLE "inventories" DROP CONSTRAINT "current_quantity_check";--> statement-breakpoint
ALTER TABLE "inventories" ADD CONSTRAINT "current_quantity_check" CHECK ("inventories"."stock" >= 0);