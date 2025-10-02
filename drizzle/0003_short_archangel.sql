ALTER TABLE "stock_adjustments" DROP CONSTRAINT "stock_adjustments_product_id_products_id_fk";
--> statement-breakpoint
ALTER TABLE "stock_adjustments" ADD CONSTRAINT "stock_adjustments_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;