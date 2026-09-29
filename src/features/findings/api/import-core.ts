/**
 * Transactional core of the XLSX import (D18/D19).
 *
 * Separated from the server action so it can be exercised against a real
 * database in tests without a Clerk session (`import-core.test.ts`):
 * the action does auth + file validation, this module does the work.
 *
 * Rules:
 * - One transaction per import; a failing row is isolated (savepoint) and
 *   counted as `failed`, the rest of the file still lands.
 * - Only the six official SILAHAP columns are overwritten (context.md);
 *   comments and attachments are never touched.
 * - Matched rows always get `last_seen_in_import_at` + `last_import_batch_id`
 *   (D19); everything is summarised in `import_batches` and one audit row per
 *   changed finding is appended to `activities`.
 */

import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';

import { and, count, desc, eq, isNotNull, isNull, ne, notInArray, sql } from 'drizzle-orm';
import * as XLSX from 'xlsx';

import { db } from '@/db/client';
import { activities, findings, importBatches } from '@/db/schema';
import { ValidationError } from '@/lib/errors';
import { diffOfficialFields, importIdentity, mapSheetRows } from '../utils/import-xlsx';

export interface ImportSummary {
  batchId: string;
  fileName: string;
  rowsTotal: number;
  created: number;
  updated: number;
  unchanged: number;
  failed: number;
  status: 'completed' | 'completed_with_errors' | 'failed';
  skipped: { rowNumber: number; reason: string }[];
  /**
   * Active findings with `last_import_batch_id` set but not matched by this
   * file (D19: they are never deleted, only reported here). Rows that were
   * never imported (`null`, e.g. from the seed) are deliberately excluded.
   */
  staleActiveRows: number;
}

export interface ImportActor {
  userId: string | null;
  email: string;
  name: string | null;
}

/** JSON-safe snapshot of the previous batch that used the same file bytes. */
export interface ImportBatchHashMatch {
  id: string;
  fileName: string;
  startedAt: string;
  uploadedByEmail: string;
}

export function computeFileHash(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex');
}

/** Previous batch whose source file had the exact same bytes. */
export async function findBatchByFileHash(fileHash: string): Promise<ImportBatchHashMatch | null> {
  const [row] = await db
    .select({
      id: importBatches.id,
      fileName: importBatches.fileName,
      startedAt: importBatches.startedAt,
      uploadedByEmail: importBatches.uploadedByEmail
    })
    .from(importBatches)
    // A `failed` batch landed nothing, so it is not a meaningful duplicate.
    .where(and(eq(importBatches.fileHash, fileHash), ne(importBatches.status, 'failed')))
    .orderBy(desc(importBatches.startedAt))
    .limit(1);

  return row ? { ...row, startedAt: row.startedAt.toISOString() } : null;
}

export function parseWorkbook(buffer: Buffer): Record<string, unknown>[] {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      throw new ValidationError('Berkas tidak memiliki lembar kerja.');
    }
    return XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[sheetName], {
      defval: ''
    });
  } catch (error) {
    if (error instanceof ValidationError) throw error;
    throw new ValidationError('Berkas XLSX tidak dapat dibaca.');
  }
}

export async function applyImport(
  buffer: Buffer,
  fileName: string,
  actor: ImportActor
): Promise<ImportSummary> {
  const fileHash = computeFileHash(buffer);
  const sheetRows = parseWorkbook(buffer);

  if (sheetRows.length === 0) {
    throw new ValidationError('Berkas tidak berisi baris data.');
  }

  const { records, skipped } = mapSheetRows(sheetRows);

  return db.transaction(async (tx) => {
    const [batch] = await tx
      .insert(importBatches)
      .values({
        fileName,
        fileHash,
        uploadedByUserId: actor.userId,
        uploadedByEmail: actor.email,
        startedAt: new Date(),
        status: 'pending',
        rowsTotal: sheetRows.length
      })
      .returning({ id: importBatches.id });

    if (!batch) {
      throw new ValidationError('Batch impor gagal dibuat.');
    }

    const existingRows = await tx.select().from(findings).where(isNull(findings.deletedAt));
    const byIdentity = new Map(
      existingRows.map((row) => [
        importIdentity({
          noSatker: row.noSatker,
          tahun: row.tahun,
          kodeTemuan: row.kodeTemuan,
          kodeRekomendasi: row.kodeRekomendasi
        }),
        row
      ])
    );

    let created = 0;
    let updated = 0;
    let unchanged = 0;
    let failed = 0;
    const failures: string[] = skipped.map((row) => `Baris ${row.rowNumber}: ${row.reason}`);
    // Existing rows this file attempted to touch. Rows whose savepoint rolled
    // back keep their previous `last_import_batch_id`, but they were seen —
    // counting them as "not in this file" would be wrong.
    const attemptedExistingIds: string[] = [];

    for (const record of records) {
      const existing = byIdentity.get(importIdentity(record));
      if (existing) {
        attemptedExistingIds.push(existing.id);
      }

      try {
        if (!existing) {
          // Nested transaction = SAVEPOINT: only this row rolls back on error.
          await tx.transaction(async (row) => {
            const [inserted] = await row
              .insert(findings)
              .values({
                kodeDisplay: sql`default`,
                noSatker: record.noSatker,
                tahun: record.tahun,
                kodeTemuan: record.kodeTemuan,
                kodeRekomendasi: record.kodeRekomendasi,
                judulPemeriksaan: record.judulPemeriksaan,
                uraianTemuan: record.uraianTemuan,
                uraianRekomendasi: record.uraianRekomendasi,
                nilaiTemuan: record.nilaiTemuan.toFixed(2),
                status: record.status,
                deskripsiTindakLanjut: record.deskripsiTindakLanjut,
                alasanDitolak: record.alasanDitolak,
                tanggalTindakLanjut: record.tanggalTindakLanjut,
                tanggalTerakhirUpdate: record.tanggalTerakhirUpdate,
                unitKerja: record.unitKerja,
                lastSeenInImportAt: new Date(),
                lastImportBatchId: batch.id
              })
              .returning({ id: findings.id, kodeDisplay: findings.kodeDisplay });

            await row.insert(activities).values({
              entityType: 'finding',
              entityId: inserted.id,
              action: 'Tambah Temuan',
              metadata: {
                source: 'import-xlsx',
                importBatchId: batch.id,
                kodeDisplay: inserted.kodeDisplay
              },
              actorUserId: actor.userId,
              actorEmail: actor.email
            });
          });
          created += 1;
          continue;
        }

        const diff = diffOfficialFields(existing as unknown as Record<string, unknown>, {
          status: record.status,
          alasanDitolak: record.alasanDitolak,
          deskripsiTindakLanjut: record.deskripsiTindakLanjut,
          tanggalTindakLanjut: record.tanggalTindakLanjut,
          tanggalTerakhirUpdate: record.tanggalTerakhirUpdate,
          nilaiTemuan: record.nilaiTemuan.toFixed(2)
        });

        await tx.transaction(async (row) => {
          await row
            .update(findings)
            .set({
              status: record.status,
              alasanDitolak: record.alasanDitolak,
              deskripsiTindakLanjut: record.deskripsiTindakLanjut,
              tanggalTindakLanjut: record.tanggalTindakLanjut,
              tanggalTerakhirUpdate: record.tanggalTerakhirUpdate,
              nilaiTemuan: record.nilaiTemuan.toFixed(2),
              lastSeenInImportAt: new Date(),
              lastImportBatchId: batch.id
            })
            .where(eq(findings.id, existing.id));

          if (Object.keys(diff).length > 0) {
            await row.insert(activities).values({
              entityType: 'finding',
              entityId: existing.id,
              action: 'Perbarui Temuan',
              metadata: { source: 'import-xlsx', importBatchId: batch.id, ...diff },
              actorUserId: actor.userId,
              actorEmail: actor.email
            });
          }
        });

        if (Object.keys(diff).length > 0) {
          updated += 1;
        } else {
          unchanged += 1;
        }
      } catch (error) {
        failed += 1;
        const detail = error instanceof Error ? error.message : 'kesalahan tidak dikenal';
        if (failures.length < 50) {
          failures.push(`Baris ${record.kodeTemuan}/${record.tahun}: ${detail}`);
        }
      }
    }

    const status: ImportSummary['status'] =
      records.length === 0
        ? 'failed'
        : failed > 0 || skipped.length > 0
          ? 'completed_with_errors'
          : 'completed';

    // Best-effort audit copy; the database remains the source of truth.
    let storagePath: string | null = `storage/imports/${batch.id}.xlsx`;
    try {
      await mkdir('storage/imports', { recursive: true });
      await writeFile(storagePath, buffer);
    } catch {
      storagePath = null;
      failures.push('Berkas sumber gagal disimpan ke storage/imports.');
    }

    await tx
      .update(importBatches)
      .set({
        finishedAt: new Date(),
        status,
        rowsCreated: created,
        rowsUpdated: updated,
        rowsUnchanged: unchanged,
        rowsFailed: failed,
        errorSummary: failures.length > 0 ? failures.slice(0, 20).join('\n') : null,
        storagePath
      })
      .where(eq(importBatches.id, batch.id));

    // Active findings tagged with an older batch but absent from this file
    // (never deleted — D19). Rows never imported stay out (owner correction).
    const staleConditions = [
      isNull(findings.deletedAt),
      isNotNull(findings.lastImportBatchId),
      ne(findings.lastImportBatchId, batch.id)
    ];
    if (attemptedExistingIds.length > 0) {
      staleConditions.push(notInArray(findings.id, attemptedExistingIds));
    }
    const [stale] = await tx
      .select({ jumlah: count() })
      .from(findings)
      .where(and(...staleConditions));
    const staleActiveRows = Number(stale?.jumlah ?? 0);

    await tx.insert(activities).values({
      entityType: 'import_batch',
      entityId: batch.id,
      action: 'Impor XLSX',
      metadata: {
        fileName,
        rowsTotal: sheetRows.length,
        created,
        updated,
        unchanged,
        failed,
        skipped: skipped.length,
        staleActiveRows
      },
      actorUserId: actor.userId,
      actorEmail: actor.email
    });

    return {
      batchId: batch.id,
      fileName,
      rowsTotal: sheetRows.length,
      created,
      updated,
      unchanged,
      failed,
      status,
      skipped,
      staleActiveRows
    } satisfies ImportSummary;
  });
}
