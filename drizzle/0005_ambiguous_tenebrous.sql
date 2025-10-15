ALTER TABLE "vouchers" ALTER COLUMN "expires_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "vouchers" ALTER COLUMN "created_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "vouchers" ALTER COLUMN "created_at" SET DEFAULT now();