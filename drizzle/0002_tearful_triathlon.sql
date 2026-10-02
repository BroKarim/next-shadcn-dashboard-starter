ALTER TABLE "users" DROP CONSTRAINT "users_role_check";--> statement-breakpoint
UPDATE "users" SET "role" = 'admin' WHERE "role" = 'editor';--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_role_check" CHECK ("users"."role" in ('user', 'admin'));