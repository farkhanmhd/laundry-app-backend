ALTER TABLE "vouchers" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "vouchers" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "vouchers" ADD COLUMN "code" varchar(32) NOT NULL;--> statement-breakpoint
ALTER TABLE "vouchers" ADD COLUMN "expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "vouchers" ADD CONSTRAINT "vouchers_code_unique" UNIQUE("code");