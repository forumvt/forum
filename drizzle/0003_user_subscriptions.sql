CREATE TABLE "user_subscription" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subscriber_user_id" text NOT NULL,
	"target_user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "user_subscription" ADD CONSTRAINT "user_subscription_subscriber_user_id_user_id_fk" FOREIGN KEY ("subscriber_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_subscription" ADD CONSTRAINT "user_subscription_target_user_id_user_id_fk" FOREIGN KEY ("target_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_subscription" ADD CONSTRAINT "user_subscription_subscriber_user_id_target_user_id_unique" UNIQUE("subscriber_user_id","target_user_id");--> statement-breakpoint
CREATE INDEX "user_subscription_subscriber_idx" ON "user_subscription" USING btree ("subscriber_user_id");--> statement-breakpoint
CREATE INDEX "user_subscription_target_idx" ON "user_subscription" USING btree ("target_user_id");
