CREATE TABLE "user_ignore" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ignorer_user_id" text NOT NULL,
	"target_user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "user_ignore" ADD CONSTRAINT "user_ignore_ignorer_user_id_user_id_fk" FOREIGN KEY ("ignorer_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_ignore" ADD CONSTRAINT "user_ignore_target_user_id_user_id_fk" FOREIGN KEY ("target_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_ignore" ADD CONSTRAINT "user_ignore_ignorer_user_id_target_user_id_unique" UNIQUE("ignorer_user_id","target_user_id");--> statement-breakpoint
CREATE INDEX "user_ignore_ignorer_idx" ON "user_ignore" USING btree ("ignorer_user_id");--> statement-breakpoint
CREATE INDEX "user_ignore_target_idx" ON "user_ignore" USING btree ("target_user_id");
