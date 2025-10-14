CREATE TYPE "public"."status" AS ENUM('pending', 'in_progress', 'completed');--> statement-breakpoint
CREATE TYPE "public"."type" AS ENUM('washer', 'dryer');--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" uuid PRIMARY KEY NOT NULL,
	"member_id" varchar(6) NOT NULL,
	"machine_id" "smallserial" NOT NULL,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp NOT NULL,
	"status" "status",
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "machines" (
	"id" "smallserial" PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	"type" "type",
	"status" "status"
);
--> statement-breakpoint
CREATE TABLE "job_logs" (
	"id" uuid PRIMARY KEY NOT NULL,
	"order_id" varchar(8) NOT NULL,
	"machine_id" "smallserial" NOT NULL,
	"service_name" varchar(50) NOT NULL,
	"start_time" timestamp,
	"end_time" timestamp,
	"status" "status"
);
--> statement-breakpoint
ALTER TABLE "redemption_history" RENAME COLUMN "customer_id" TO "member_id";--> statement-breakpoint
ALTER TABLE "orders" RENAME COLUMN "customer_id" TO "member_id";--> statement-breakpoint
ALTER TABLE "redemption_history" DROP CONSTRAINT "redemption_history_customer_id_members_id_fk";
--> statement-breakpoint
ALTER TABLE "orders" DROP CONSTRAINT "orders_customer_id_members_id_fk";
--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_machine_id_machines_id_fk" FOREIGN KEY ("machine_id") REFERENCES "public"."machines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_logs" ADD CONSTRAINT "job_logs_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_logs" ADD CONSTRAINT "job_logs_machine_id_machines_id_fk" FOREIGN KEY ("machine_id") REFERENCES "public"."machines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "redemption_history" ADD CONSTRAINT "redemption_history_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;