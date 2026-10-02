CREATE TABLE "activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"action" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"actor_user_id" uuid,
	"actor_email" text NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "activities_entity_type_check" CHECK ("activities"."entity_type" in ('finding', 'import_batch', 'user')),
	CONSTRAINT "activities_action_check" CHECK ("activities"."action" in ('Impor XLSX', 'Tambah Temuan', 'Perbarui Temuan', 'Hapus Temuan', 'Pulihkan Temuan', 'Unggah Berkas', 'Perbarui Peran Pengguna'))
);
--> statement-breakpoint
CREATE TABLE "attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"finding_id" uuid NOT NULL,
	"file_name" text NOT NULL,
	"storage_path" text NOT NULL,
	"file_type" text NOT NULL,
	"mime_type" text,
	"size_bytes" bigint NOT NULL,
	"uploaded_by_user_id" uuid,
	"uploaded_by_email" text NOT NULL,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "attachments_file_type_check" CHECK ("attachments"."file_type" in ('pdf', 'xlsx', 'docx', 'image'))
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"finding_id" uuid NOT NULL,
	"author_user_id" uuid,
	"author_email" text NOT NULL,
	"author_name" text,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "findings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kode_display" text NOT NULL,
	"no_satker" text NOT NULL,
	"tahun" integer NOT NULL,
	"kode_temuan" text NOT NULL,
	"kode_rekomendasi" text NOT NULL,
	"judul_pemeriksaan" text NOT NULL,
	"uraian_temuan" text NOT NULL,
	"uraian_rekomendasi" text NOT NULL,
	"nilai_temuan" numeric(18, 2) DEFAULT '0' NOT NULL,
	"status" text NOT NULL,
	"deskripsi_tindak_lanjut" text DEFAULT '' NOT NULL,
	"alasan_ditolak" text,
	"tanggal_tindak_lanjut" date,
	"tanggal_terakhir_update" timestamp with time zone NOT NULL,
	"unit_kerja" text NOT NULL,
	"last_seen_in_import_at" timestamp with time zone,
	"last_import_batch_id" uuid,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "findings_status_check" CHECK ("findings"."status" in ('Sesuai Rekomendasi', 'Belum Sesuai', 'Belum Ditindaklanjuti', 'Sudah Ditindaklanjuti', 'Tidak Dapat Ditindaklanjuti'))
);
--> statement-breakpoint
CREATE TABLE "import_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"file_name" text NOT NULL,
	"file_hash" text NOT NULL,
	"storage_path" text,
	"uploaded_by_user_id" uuid,
	"uploaded_by_email" text NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"status" text DEFAULT 'pending' NOT NULL,
	"rows_total" integer DEFAULT 0 NOT NULL,
	"rows_created" integer DEFAULT 0 NOT NULL,
	"rows_updated" integer DEFAULT 0 NOT NULL,
	"rows_unchanged" integer DEFAULT 0 NOT NULL,
	"rows_failed" integer DEFAULT 0 NOT NULL,
	"error_summary" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "import_batches_status_check" CHECK ("import_batches"."status" in ('pending', 'completed', 'completed_with_errors', 'failed'))
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_user_id" text NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"role" text DEFAULT 'user' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_role_check" CHECK ("users"."role" in ('user', 'editor', 'admin'))
);
--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_finding_id_findings_id_fk" FOREIGN KEY ("finding_id") REFERENCES "public"."findings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_uploaded_by_user_id_users_id_fk" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_finding_id_findings_id_fk" FOREIGN KEY ("finding_id") REFERENCES "public"."findings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_author_user_id_users_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "findings" ADD CONSTRAINT "findings_last_import_batch_id_import_batches_id_fk" FOREIGN KEY ("last_import_batch_id") REFERENCES "public"."import_batches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_batches" ADD CONSTRAINT "import_batches_uploaded_by_user_id_users_id_fk" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activities_entity_idx" ON "activities" USING btree ("entity_type","entity_id","occurred_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "activities_occurred_at_idx" ON "activities" USING btree ("occurred_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "activities_actor_idx" ON "activities" USING btree ("actor_user_id");--> statement-breakpoint
CREATE INDEX "attachments_finding_idx" ON "attachments" USING btree ("finding_id","uploaded_at");--> statement-breakpoint
CREATE INDEX "comments_finding_idx" ON "comments" USING btree ("finding_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "findings_natural_key_uq" ON "findings" USING btree ("no_satker","tahun","kode_temuan","kode_rekomendasi") WHERE deleted_at is null;--> statement-breakpoint
CREATE UNIQUE INDEX "findings_kode_display_uq" ON "findings" USING btree ("kode_display") WHERE deleted_at is null;--> statement-breakpoint
CREATE INDEX "findings_status_idx" ON "findings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "findings_tahun_idx" ON "findings" USING btree ("tahun");--> statement-breakpoint
CREATE INDEX "findings_deleted_at_idx" ON "findings" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "findings_last_import_batch_idx" ON "findings" USING btree ("last_import_batch_id");--> statement-breakpoint
CREATE INDEX "import_batches_started_at_idx" ON "import_batches" USING btree ("started_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "import_batches_file_hash_idx" ON "import_batches" USING btree ("file_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "users_clerk_user_id_key" ON "users" USING btree ("clerk_user_id");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");