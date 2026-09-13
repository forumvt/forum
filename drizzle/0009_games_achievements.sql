ALTER TABLE "user" ADD COLUMN "xp" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE TYPE "public"."achievement_kind" AS ENUM('counter', 'state');--> statement-breakpoint
CREATE TYPE "public"."game_run_status" AS ENUM('active', 'ended');--> statement-breakpoint
CREATE TABLE "achievement" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"icon" text NOT NULL,
	"event" text,
	"target" integer NOT NULL,
	"reward_xp" integer NOT NULL,
	"kind" "achievement_kind" DEFAULT 'counter' NOT NULL,
	"game_slug" text
);--> statement-breakpoint
CREATE TABLE "user_achievement" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"achievement_id" text NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"unlocked_at" timestamp,
	CONSTRAINT "user_achievement_user_id_achievement_id_unique" UNIQUE("user_id","achievement_id")
);--> statement-breakpoint
CREATE TABLE "game_run" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"game_slug" text NOT NULL,
	"status" "game_run_status" DEFAULT 'active' NOT NULL,
	"wave" integer DEFAULT 0 NOT NULL,
	"kill_streak_no_damage" integer DEFAULT 0 NOT NULL,
	"damage_taken_this_wave" boolean DEFAULT false NOT NULL,
	"enemies_killed" integer DEFAULT 0 NOT NULL,
	"coins_collected" integer DEFAULT 0 NOT NULL,
	"chests_opened" integer DEFAULT 0 NOT NULL,
	"game_started_counted" boolean DEFAULT false NOT NULL,
	"xp_awarded_this_run" integer DEFAULT 0 NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"ended_at" timestamp
);--> statement-breakpoint
ALTER TABLE "user_achievement" ADD CONSTRAINT "user_achievement_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_achievement" ADD CONSTRAINT "user_achievement_achievement_id_achievement_id_fk" FOREIGN KEY ("achievement_id") REFERENCES "public"."achievement"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_run" ADD CONSTRAINT "game_run_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_achievement_user_idx" ON "user_achievement" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "game_run_user_status_idx" ON "game_run" USING btree ("user_id","status");
