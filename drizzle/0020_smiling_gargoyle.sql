ALTER TABLE "orders" RENAME COLUMN "staff_id" TO "user_id";--> statement-breakpoint
ALTER TABLE "orders" DROP CONSTRAINT "orders_staff_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;