ALTER TABLE "customers" RENAME TO "members";--> statement-breakpoint
ALTER TABLE "members" DROP CONSTRAINT "customers_phone_unique";--> statement-breakpoint
ALTER TABLE "redemption_history" DROP CONSTRAINT "redemption_history_customer_id_customers_id_fk";
--> statement-breakpoint
ALTER TABLE "orders" DROP CONSTRAINT "orders_customer_id_customers_id_fk";
--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "user_id" varchar;--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "redemption_history" ADD CONSTRAINT "redemption_history_customer_id_members_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_members_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_user_id_unique" UNIQUE("user_id");--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_phone_unique" UNIQUE("phone");