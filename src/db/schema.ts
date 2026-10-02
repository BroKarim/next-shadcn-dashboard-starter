/**
 * PostgreSQL schema for the BPK finding dashboard.
 *
 * Conventions (task_plan.md Implementation Brief §3):
 * - Column names are written explicitly in snake_case (D35) — the Drizzle
 *   `casing` option is deliberately not used in the Kit config nor at runtime.
 * - Money stays `numeric` and is passed through as a string end-to-end (D8).
 * - Soft delete via `deleted_at`; every unique business key is partial
 *   (`WHERE deleted_at IS NULL`) so deleted findings can be re-added (D30).
 * - `status` / `action` / `role` values are `text` + `CHECK`, not pgEnum (D7/D13).
 * - The `findings.kode_display` sequence + trigger live in a hand-written
 *   migration (§3.8); drizzle-kit cannot introspect them.
 */

import { sql } from 'drizzle-orm';
import {
  bigint,
  check,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid
} from 'drizzle-orm/pg-core';

export const users = pgTable(
  'users',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    clerkUserId: text('clerk_user_id').notNull(),
    email: text('email').notNull(),
    firstName: text('first_name'),
    lastName: text('last_name'),
    name: text('name'),
    role: text('role').notNull().default('user'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => sql`now()`)
  },
  (t) => [
    uniqueIndex('users_clerk_user_id_key').on(t.clerkUserId),
    index('users_email_idx').on(t.email),
    check('users_role_check', sql`${t.role} in ('user', 'admin')`)
  ]
);

export const importBatches = pgTable(
  'import_batches',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    fileName: text('file_name').notNull(),
    fileHash: text('file_hash').notNull(),
    storagePath: text('storage_path'),
    uploadedByUserId: uuid('uploaded_by_user_id').references(() => users.id, {
      onDelete: 'set null'
    }),
    uploadedByEmail: text('uploaded_by_email').notNull(),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
    finishedAt: timestamp('finished_at', { withTimezone: true }),
    status: text('status').notNull().default('pending'),
    rowsTotal: integer('rows_total').notNull().default(0),
    rowsCreated: integer('rows_created').notNull().default(0),
    rowsUpdated: integer('rows_updated').notNull().default(0),
    rowsUnchanged: integer('rows_unchanged').notNull().default(0),
    rowsFailed: integer('rows_failed').notNull().default(0),
    errorSummary: text('error_summary'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => sql`now()`)
  },
  (t) => [
    index('import_batches_started_at_idx').on(t.startedAt.desc()),
    index('import_batches_file_hash_idx').on(t.fileHash),
    check(
      'import_batches_status_check',
      sql`${t.status} in ('pending', 'completed', 'completed_with_errors', 'failed')`
    )
  ]
);

export const findings = pgTable(
  'findings',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    // Filled by the hand-written BEFORE INSERT trigger when omitted (D31).
    kodeDisplay: text('kode_display').notNull(),
    noSatker: text('no_satker').notNull(),
    tahun: integer('tahun').notNull(),
    kodeTemuan: text('kode_temuan').notNull(),
    kodeRekomendasi: text('kode_rekomendasi').notNull(),
    judulPemeriksaan: text('judul_pemeriksaan').notNull(),
    uraianTemuan: text('uraian_temuan').notNull(),
    uraianRekomendasi: text('uraian_rekomendasi').notNull(),
    // Money stays a string end-to-end; arithmetic happens in SQL (D8).
    nilaiTemuan: numeric('nilai_temuan', { precision: 18, scale: 2 }).notNull().default('0'),
    status: text('status').notNull(),
    deskripsiTindakLanjut: text('deskripsi_tindak_lanjut').notNull().default(''),
    alasanDitolak: text('alasan_ditolak'),
    tanggalTindakLanjut: date('tanggal_tindak_lanjut', { mode: 'string' }),
    tanggalTerakhirUpdate: timestamp('tanggal_terakhir_update', { withTimezone: true }).notNull(),
    unitKerja: text('unit_kerja').notNull(),
    lastSeenInImportAt: timestamp('last_seen_in_import_at', { withTimezone: true }),
    lastImportBatchId: uuid('last_import_batch_id').references(() => importBatches.id, {
      onDelete: 'set null'
    }),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => sql`now()`)
  },
  (t) => [
    // Partial unique business keys: re-importing a soft-deleted finding works (D30).
    uniqueIndex('findings_natural_key_uq')
      .on(t.noSatker, t.tahun, t.kodeTemuan, t.kodeRekomendasi)
      .where(sql`deleted_at is null`),
    uniqueIndex('findings_kode_display_uq')
      .on(t.kodeDisplay)
      .where(sql`deleted_at is null`),
    index('findings_status_idx').on(t.status),
    index('findings_tahun_idx').on(t.tahun),
    index('findings_deleted_at_idx').on(t.deletedAt),
    index('findings_last_import_batch_idx').on(t.lastImportBatchId),
    check(
      'findings_status_check',
      sql`${t.status} in ('Sesuai Rekomendasi', 'Belum Sesuai', 'Belum Ditindaklanjuti', 'Sudah Ditindaklanjuti', 'Tidak Dapat Ditindaklanjuti')`
    )
  ]
);

/**
 * Append-only activity log (D13). The application never UPDATEs or DELETEs
 * rows here. Comments and admin replies are deliberately excluded from this
 * table (D14) — the detail page keeps separate Diskusi and Riwayat Aktivitas
 * sections.
 */
export const activities = pgTable(
  'activities',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    entityType: text('entity_type').notNull(),
    entityId: uuid('entity_id').notNull(),
    action: text('action').notNull(),
    // Stores the before/after diff, e.g. {"status": {"from": ..., "to": ...}}.
    metadata: jsonb('metadata')
      .notNull()
      .default(sql`'{}'::jsonb`),
    actorUserId: uuid('actor_user_id').references(() => users.id, { onDelete: 'set null' }),
    // Email snapshot so the timeline survives user deletion.
    actorEmail: text('actor_email').notNull(),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow()
  },
  (t) => [
    index('activities_entity_idx').on(t.entityType, t.entityId, t.occurredAt.desc()),
    index('activities_occurred_at_idx').on(t.occurredAt.desc()),
    index('activities_actor_idx').on(t.actorUserId),
    check(
      'activities_entity_type_check',
      sql`${t.entityType} in ('finding', 'import_batch', 'user')`
    ),
    check(
      'activities_action_check',
      sql`${t.action} in ('Impor XLSX', 'Tambah Temuan', 'Perbarui Temuan', 'Hapus Temuan', 'Pulihkan Temuan', 'Unggah Berkas', 'Perbarui Peran Pengguna', 'Hapus Pengguna')`
    )
  ]
);

/**
 * Private discussion rows. Visibility is enforced in the detail service: an
 * admin sees all comments, while a user sees only their own comment and its
 * admin response.
 */
export const comments = pgTable(
  'comments',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    findingId: uuid('finding_id')
      .notNull()
      .references(() => findings.id, { onDelete: 'cascade' }),
    authorUserId: uuid('author_user_id').references(() => users.id, { onDelete: 'set null' }),
    authorEmail: text('author_email').notNull(),
    authorName: text('author_name'),
    body: text('body').notNull(),
    adminReply: text('admin_reply'),
    adminReplyAt: timestamp('admin_reply_at', { withTimezone: true }),
    adminReplyByUserId: uuid('admin_reply_by_user_id').references(() => users.id, {
      onDelete: 'set null'
    }),
    adminReplyByEmail: text('admin_reply_by_email'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => sql`now()`)
  },
  (t) => [index('comments_finding_idx').on(t.findingId, t.createdAt)]
);

export const attachments = pgTable(
  'attachments',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    findingId: uuid('finding_id')
      .notNull()
      .references(() => findings.id, { onDelete: 'cascade' }),
    fileName: text('file_name').notNull(),
    // attachments/{findingId}/{uuid}.{ext} — never the user-supplied name.
    storagePath: text('storage_path').notNull(),
    fileType: text('file_type').notNull(),
    mimeType: text('mime_type'),
    sizeBytes: bigint('size_bytes', { mode: 'number' }).notNull(),
    uploadedByUserId: uuid('uploaded_by_user_id').references(() => users.id, {
      onDelete: 'set null'
    }),
    uploadedByEmail: text('uploaded_by_email').notNull(),
    uploadedAt: timestamp('uploaded_at', { withTimezone: true }).notNull().defaultNow()
  },
  (t) => [
    index('attachments_finding_idx').on(t.findingId, t.uploadedAt),
    check('attachments_file_type_check', sql`${t.fileType} in ('pdf', 'xlsx', 'docx', 'image')`)
  ]
);
