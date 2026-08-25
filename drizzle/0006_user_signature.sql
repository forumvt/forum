ALTER TABLE "user" ADD COLUMN "signature" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "show_signatures" boolean DEFAULT true NOT NULL;
