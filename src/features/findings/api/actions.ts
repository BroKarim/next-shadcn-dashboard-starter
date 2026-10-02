'use server';

/**
 * Finding mutations (task_plan.md Phase 5, D17/D23).
 *
 * Every write authenticates and authorizes server-side before touching the
 * database, runs inside a transaction, and appends an `activities` row with
 * the before/after diff (D13/D18). `activities` is append-only.
 *
 * Mutations created here are only those the UI actually uses — no placeholder
 * actions for future features.
 */

import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';

import { and, eq, isNull } from 'drizzle-orm';

import { db } from '@/db/client';
import { activities, attachments, comments, findings } from '@/db/schema';
import { NotFoundError, ValidationError } from '@/lib/errors';
import { requireActorIdentity, requireRole } from '@/lib/rbac';
import type { ActivityAction } from './types';
import { diffFields, hasChanges, type FieldDiff } from '../utils/diff';
import { resolveFile } from '../utils/file-type';
import { applyImport, type ImportSummary } from './import-core';

/** Keep uploads below Vercel's 4.5 MB Function request limit. */
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

interface Actor {
  /** Local `users.id` (uuid) — FK columns reference this, not the Clerk id. */
  id: string;
  email: string;
  name: string | null;
}

type Db = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** The only finding column an admin may change manually. */
const EDITABLE_FIELDS = ['nilaiTemuan'] as const;

function parseNilaiTemuan(input: number): number {
  if (!Number.isFinite(input) || input < 0) {
    throw new ValidationError('Nilai temuan harus berupa angka nol atau lebih.');
  }
  return input;
}

async function logActivity(
  tx: Db,
  actor: Actor,
  entry: {
    entityId: string;
    entityType?: 'finding' | 'import_batch';
    action: ActivityAction;
    metadata: FieldDiff | Record<string, unknown>;
  }
) {
  await tx.insert(activities).values({
    entityType: entry.entityType ?? 'finding',
    entityId: entry.entityId,
    action: entry.action,
    metadata: entry.metadata,
    actorUserId: actor.id,
    actorEmail: actor.email
  });
}

export async function updateFindingValue(
  kodeDisplay: string,
  nilaiTemuan: number
): Promise<{ changed: boolean; diff: FieldDiff }> {
  await requireRole('admin');
  const value = parseNilaiTemuan(nilaiTemuan);
  const actor = await requireActorIdentity();

  return db.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(findings)
      .where(and(eq(findings.kodeDisplay, kodeDisplay), isNull(findings.deletedAt)));

    if (!current) {
      throw new NotFoundError(`Temuan ${kodeDisplay} tidak ditemukan.`);
    }

    const nextValue = value.toFixed(2);
    const diff = diffFields(
      current as unknown as Record<string, unknown>,
      { nilaiTemuan: nextValue },
      EDITABLE_FIELDS as unknown as string[]
    );

    if (!hasChanges(diff)) {
      return { changed: false, diff };
    }

    await tx.update(findings).set({ nilaiTemuan: nextValue }).where(eq(findings.id, current.id));
    await logActivity(tx, actor, {
      entityId: current.id,
      action: 'Perbarui Temuan',
      metadata: diff
    });

    return { changed: true, diff };
  });
}

/** Import the official XLSX finding workbook through the authenticated UI. */
export async function importFindings(formData: FormData): Promise<ImportSummary> {
  await requireRole('admin');
  const actor = await requireActorIdentity();
  const file = formData.get('file');

  if (!(file instanceof File)) {
    throw new ValidationError('Berkas XLSX wajib dipilih.');
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new ValidationError('Ukuran berkas XLSX melebihi 4 MB.');
  }
  if (!file.name.toLowerCase().endsWith('.xlsx')) {
    throw new ValidationError('Format impor harus berupa berkas XLSX.');
  }

  return applyImport(Buffer.from(await file.arrayBuffer()), file.name, actor);
}

// ---------------------------------------------------------------------------
// Discussion comments (D14): separate from `activities` — writing a comment
// never touches the activity timeline. Every signed-in user may comment; the
// author may delete their own comment, admins may delete any, and only admins
// may write a response to a comment.
// ---------------------------------------------------------------------------

export async function createComment(kodeDisplay: string, body: string): Promise<{ id: string }> {
  await requireRole('user');
  const actor = await requireActorIdentity();
  const text = body.trim();

  if (text.length === 0) {
    throw new ValidationError('Komentar tidak boleh kosong.');
  }
  if (text.length > 4000) {
    throw new ValidationError('Komentar terlalu panjang (maks 4000 karakter).');
  }

  return db.transaction(async (tx) => {
    const [finding] = await tx
      .select({ id: findings.id })
      .from(findings)
      .where(and(eq(findings.kodeDisplay, kodeDisplay), isNull(findings.deletedAt)));

    if (!finding) {
      throw new NotFoundError(`Temuan ${kodeDisplay} tidak ditemukan.`);
    }

    const [row] = await tx
      .insert(comments)
      .values({
        findingId: finding.id,
        authorUserId: actor.id,
        authorEmail: actor.email,
        authorName: actor.name,
        body: text
      })
      .returning({ id: comments.id });

    return { id: row.id };
  });
}

export async function deleteComment(commentId: string): Promise<{ deleted: boolean }> {
  await requireRole('user');
  const actor = await requireActorIdentity();

  return db.transaction(async (tx) => {
    const [row] = await tx.select().from(comments).where(eq(comments.id, commentId));
    if (!row) {
      throw new NotFoundError('Komentar tidak ditemukan.');
    }

    // Deleting someone else's comment requires admin. The email snapshot is
    // also accepted for legacy seed rows whose author FK is null.
    if (row.authorUserId !== actor.id && row.authorEmail !== actor.email) {
      await requireRole('admin');
    }

    await tx.delete(comments).where(eq(comments.id, commentId));
    return { deleted: true };
  });
}

export async function replyToComment(
  commentId: string,
  body: string
): Promise<{ replied: boolean }> {
  await requireRole('admin');
  const actor = await requireActorIdentity();
  const text = body.trim();

  if (text.length === 0) {
    throw new ValidationError('Tanggapan admin tidak boleh kosong.');
  }
  if (text.length > 4000) {
    throw new ValidationError('Tanggapan admin terlalu panjang (maks 4000 karakter).');
  }

  return db.transaction(async (tx) => {
    const [row] = await tx
      .update(comments)
      .set({
        adminReply: text,
        adminReplyAt: new Date(),
        adminReplyByUserId: actor.id,
        adminReplyByEmail: actor.email
      })
      .where(eq(comments.id, commentId))
      .returning({ id: comments.id });

    if (!row) {
      throw new NotFoundError('Komentar tidak ditemukan.');
    }

    return { replied: true };
  });
}

// ---------------------------------------------------------------------------
// Attachments: metadata in Postgres, bytes under `storage/attachments/`
// (outside `public/`). Served through an authenticated route handler.
// ---------------------------------------------------------------------------

export async function uploadAttachment(
  kodeDisplay: string,
  formData: FormData
): Promise<{ id: string; fileName: string }> {
  await requireRole('admin');
  const actor = await requireActorIdentity();

  const file = formData.get('file');
  if (!(file instanceof File)) {
    throw new ValidationError('Berkas wajib dipilih.');
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new ValidationError('Ukuran berkas melebihi 4 MB.');
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const resolved = resolveFile(buffer, file.name);
  if (!resolved) {
    throw new ValidationError('Jenis berkas tidak didukung (pdf, xlsx, docx, atau gambar).');
  }

  return db.transaction(async (tx) => {
    const [finding] = await tx
      .select({ id: findings.id })
      .from(findings)
      .where(and(eq(findings.kodeDisplay, kodeDisplay), isNull(findings.deletedAt)));

    if (!finding) {
      throw new NotFoundError(`Temuan ${kodeDisplay} tidak ditemukan.`);
    }

    const storagePath = `storage/attachments/${finding.id}/${randomUUID()}.${resolved.extension}`;
    await mkdir(`storage/attachments/${finding.id}`, { recursive: true });
    await writeFile(storagePath, buffer);

    const [row] = await tx
      .insert(attachments)
      .values({
        findingId: finding.id,
        fileName: file.name,
        storagePath,
        fileType: resolved.fileType,
        mimeType: resolved.mimeType,
        sizeBytes: file.size,
        uploadedByUserId: actor.id,
        uploadedByEmail: actor.email
      })
      .returning({ id: attachments.id });

    await logActivity(tx, actor, {
      entityId: finding.id,
      action: 'Unggah Berkas',
      metadata: { fileName: file.name, fileType: resolved.fileType, sizeBytes: file.size }
    });

    return { id: row.id, fileName: file.name };
  });
}

export async function deleteAttachment(attachmentId: string): Promise<{ deleted: boolean }> {
  await requireRole('admin');
  const actor = await requireActorIdentity();

  return db.transaction(async (tx) => {
    const [row] = await tx.select().from(attachments).where(eq(attachments.id, attachmentId));
    if (!row) {
      throw new NotFoundError('Lampiran tidak ditemukan.');
    }

    await tx.delete(attachments).where(eq(attachments.id, attachmentId));
    try {
      await unlink(row.storagePath);
    } catch {
      // The row is gone; a missing file is not worth failing the request for.
    }

    await logActivity(tx, actor, {
      entityId: row.findingId,
      action: 'Unggah Berkas',
      metadata: { fileName: row.fileName, deleted: true }
    });

    return { deleted: true };
  });
}
