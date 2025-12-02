ALTER TABLE "bundlings" ADD COLUMN "updated_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "bundlings" ADD COLUMN "deleted_at" timestamp;