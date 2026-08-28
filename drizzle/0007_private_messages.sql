CREATE TABLE "pm_conversation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_low_id" text NOT NULL,
	"user_high_id" text NOT NULL,
	"last_message_at" timestamp DEFAULT now() NOT NULL,
	"last_message_preview" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE "pm_participant" (
	"conversation_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"last_read_at" timestamp
);--> statement-breakpoint
CREATE TABLE "pm_message" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"sender_id" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "pm_conversation" ADD CONSTRAINT "pm_conversation_user_low_id_user_id_fk" FOREIGN KEY ("user_low_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pm_conversation" ADD CONSTRAINT "pm_conversation_user_high_id_user_id_fk" FOREIGN KEY ("user_high_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pm_participant" ADD CONSTRAINT "pm_participant_conversation_id_pm_conversation_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."pm_conversation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pm_participant" ADD CONSTRAINT "pm_participant_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pm_message" ADD CONSTRAINT "pm_message_conversation_id_pm_conversation_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."pm_conversation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pm_message" ADD CONSTRAINT "pm_message_sender_id_user_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pm_conversation" ADD CONSTRAINT "pm_conversation_user_low_id_user_high_id_unique" UNIQUE("user_low_id","user_high_id");--> statement-breakpoint
ALTER TABLE "pm_participant" ADD CONSTRAINT "pm_participant_conversation_id_user_id_unique" UNIQUE("conversation_id","user_id");--> statement-breakpoint
CREATE INDEX "pm_conversation_last_message_idx" ON "pm_conversation" USING btree ("last_message_at");--> statement-breakpoint
CREATE INDEX "pm_participant_user_idx" ON "pm_participant" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "pm_message_conversation_created_idx" ON "pm_message" USING btree ("conversation_id","created_at");
