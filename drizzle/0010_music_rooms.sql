CREATE TABLE "music_room" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"created_by_user_id" text NOT NULL,
	"is_private" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "music_room_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "music_room_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_id" uuid NOT NULL,
	"song_id" text NOT NULL,
	"title" text NOT NULL,
	"artist" text NOT NULL,
	"source" text NOT NULL,
	"duration" integer NOT NULL,
	"dj_user_id" text,
	"played_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "music_room" ADD CONSTRAINT "music_room_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "music_room_history" ADD CONSTRAINT "music_room_history_room_id_music_room_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."music_room"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "music_room_history" ADD CONSTRAINT "music_room_history_dj_user_id_user_id_fk" FOREIGN KEY ("dj_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "music_room_active_idx" ON "music_room" USING btree ("is_active","created_at");
--> statement-breakpoint
CREATE INDEX "music_room_history_room_played_idx" ON "music_room_history" USING btree ("room_id","played_at");
