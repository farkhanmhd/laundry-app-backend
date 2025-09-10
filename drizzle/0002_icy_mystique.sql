ALTER TABLE "products" ADD COLUMN "reorder_point" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "current_quantity_check" CHECK ("products"."current_quantity" >= 0);--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "price_check" CHECK ("products"."price" >= 0);