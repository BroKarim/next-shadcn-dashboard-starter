ALTER TABLE "users" ADD COLUMN "first_name" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_name" text;--> statement-breakpoint
UPDATE "users"
SET
  "first_name" = CASE
    WHEN position(' ' in trim("name")) > 0 THEN split_part(trim("name"), ' ', 1)
    ELSE trim("name")
  END,
  "last_name" = CASE
    WHEN position(' ' in trim("name")) > 0 THEN substring(trim("name") from position(' ' in trim("name")) + 1)
    ELSE NULL
  END
WHERE "name" IS NOT NULL AND trim("name") <> '';
