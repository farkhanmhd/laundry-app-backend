CREATE TYPE "public"."itemType" AS ENUM('service', 'inventory');--> statement-breakpoint
CREATE TYPE "public"."deliveryStatus" AS ENUM('requested', 'assigned', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."deliveryType" AS ENUM('pickup', 'dropoff');--> statement-breakpoint
CREATE TYPE "public"."orderStatus" AS ENUM('pending', 'processing', 'ready', 'completed');--> statement-breakpoint
CREATE TYPE "public"."inventoryUnit" AS ENUM('kilogram', 'gram', 'litre', 'milliliter', 'pieces');--> statement-breakpoint
CREATE TYPE "public"."paymentType" AS ENUM('qris', 'cash');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('superadmin', 'admin', 'user');--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" varchar(8) PRIMARY KEY NOT NULL,
	"order_id" varchar NOT NULL,
	"itemType" "itemType" NOT NULL,
	"service_id" varchar,
	"inventory_id" varchar,
	"bundling_id" varchar,
	"voucher_id" varchar,
	"quantity" integer NOT NULL,
	"subtotal" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bundlings" (
	"id" varchar PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" varchar(255),
	"price" integer NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vouchers" (
	"id" varchar(6) PRIMARY KEY NOT NULL,
	"code" varchar(32) NOT NULL,
	"name" varchar(128) NOT NULL,
	"points_cost" integer NOT NULL,
	"discount_amount" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_visible" boolean DEFAULT true NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "vouchers_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "deliveries" (
	"id" varchar PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"address_id" varchar NOT NULL,
	"order_id" varchar NOT NULL,
	"type" "deliveryType" NOT NULL,
	"status" "deliveryStatus" DEFAULT 'requested' NOT NULL,
	"notes" varchar(255),
	"requested_at" timestamp DEFAULT now(),
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "addresses" (
	"id" varchar PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"label" varchar(50),
	"address" varchar(255) NOT NULL,
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"notes" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stock_adjustments" (
	"id" varchar PRIMARY KEY NOT NULL,
	"inventory_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"previous_quantity" integer NOT NULL,
	"new_quantity" integer NOT NULL,
	"reason" varchar(128) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "redemption_history" (
	"id" varchar PRIMARY KEY NOT NULL,
	"member_id" varchar NOT NULL,
	"voucher_id" varchar NOT NULL,
	"order_id" varchar NOT NULL,
	"points_spent" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" varchar(8) PRIMARY KEY NOT NULL,
	"customer_name" varchar(50),
	"member_id" varchar,
	"user_id" varchar NOT NULL,
	"status" "orderStatus" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bundling_items" (
	"id" varchar PRIMARY KEY NOT NULL,
	"bundling_id" varchar NOT NULL,
	"itemType" "itemType" NOT NULL,
	"service_id" varchar NOT NULL,
	"inventory_id" varchar NOT NULL,
	"quantity" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "members" (
	"id" varchar(6) PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	"user_id" varchar,
	"phone" varchar(24) NOT NULL,
	"points" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "members_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "members_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
CREATE TABLE "inventories" (
	"id" varchar(6) PRIMARY KEY NOT NULL,
	"name" varchar(128) NOT NULL,
	"description" varchar(512) NOT NULL,
	"image" varchar,
	"price" integer NOT NULL,
	"unit" "inventoryUnit",
	"current_quantity" integer DEFAULT 0 NOT NULL,
	"safety_stock" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp,
	CONSTRAINT "current_quantity_check" CHECK ("inventories"."current_quantity" >= 0),
	CONSTRAINT "price_check" CHECK ("inventories"."price" >= 0)
);
--> statement-breakpoint
CREATE TABLE "payment_detail" (
	"id" varchar PRIMARY KEY NOT NULL,
	"order_id" varchar NOT NULL,
	"paymentType" "paymentType",
	"discount_amount" integer NOT NULL,
	"amount_paid" integer NOT NULL,
	"change" integer,
	"total" integer NOT NULL,
	"transaction_status" varchar,
	"transaction_time" timestamp DEFAULT now() NOT NULL,
	"fraud_status" varchar(20) NOT NULL,
	"expiry_time" timestamp NOT NULL,
	"qr_string" varchar(500),
	"acquirer" varchar(50),
	"actions" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" varchar(6) PRIMARY KEY NOT NULL,
	"name" varchar(128) NOT NULL,
	"image" varchar,
	"description" varchar(512) NOT NULL,
	"price" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp,
	CONSTRAINT "price_check" CHECK ("services"."price" >= 0)
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"impersonated_by" text,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"username" text,
	"display_username" text,
	"role" "role" DEFAULT 'user',
	"banned" boolean DEFAULT false,
	"ban_reason" text,
	"ban_expires" timestamp,
	CONSTRAINT "user_email_unique" UNIQUE("email"),
	CONSTRAINT "user_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_inventory_id_inventories_id_fk" FOREIGN KEY ("inventory_id") REFERENCES "public"."inventories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_bundling_id_bundlings_id_fk" FOREIGN KEY ("bundling_id") REFERENCES "public"."bundlings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_voucher_id_vouchers_id_fk" FOREIGN KEY ("voucher_id") REFERENCES "public"."vouchers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_address_id_addresses_id_fk" FOREIGN KEY ("address_id") REFERENCES "public"."addresses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_adjustments" ADD CONSTRAINT "stock_adjustments_inventory_id_inventories_id_fk" FOREIGN KEY ("inventory_id") REFERENCES "public"."inventories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_adjustments" ADD CONSTRAINT "stock_adjustments_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "redemption_history" ADD CONSTRAINT "redemption_history_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "redemption_history" ADD CONSTRAINT "redemption_history_voucher_id_vouchers_id_fk" FOREIGN KEY ("voucher_id") REFERENCES "public"."vouchers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "redemption_history" ADD CONSTRAINT "redemption_history_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bundling_items" ADD CONSTRAINT "bundling_items_bundling_id_bundlings_id_fk" FOREIGN KEY ("bundling_id") REFERENCES "public"."bundlings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bundling_items" ADD CONSTRAINT "bundling_items_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bundling_items" ADD CONSTRAINT "bundling_items_inventory_id_inventories_id_fk" FOREIGN KEY ("inventory_id") REFERENCES "public"."inventories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_detail" ADD CONSTRAINT "payment_detail_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;