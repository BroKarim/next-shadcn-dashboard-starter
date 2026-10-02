ALTER TABLE "comments" ADD COLUMN "admin_reply" text;--> statement-breakpoint
ALTER TABLE "comments" ADD COLUMN "admin_reply_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "comments" ADD COLUMN "admin_reply_by_user_id" uuid;--> statement-breakpoint
ALTER TABLE "comments" ADD COLUMN "admin_reply_by_email" text;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_admin_reply_by_user_id_users_id_fk" FOREIGN KEY ("admin_reply_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;