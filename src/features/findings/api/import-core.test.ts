/**
 * Integration test for the XLSX import transaction (D18/D19).
 *
 * Runs against the local development database (`DATABASE_URL`) with a fake
 * actor, so no Clerk session is needed. Every row it creates is tagged with a
 * `TSTIMP` satker prefix and removed again in `beforeAll`/`afterAll`.
 *
 * Run with: `bun test --conditions=react-server` (the flag makes the
 * `server-only` guard in `src/db/client.ts` resolve to a no-op outside Next).
 */

import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { eq, inArray, like } from 'drizzle-orm';
import * as XLSX from 'xlsx';

import { db } from '@/db/client';
import { activities, findings, importBatches } from '@/db/schema';
import { applyImport, type ImportActor } from './import-core';

const actor: ImportActor = { userId: null, email: 'test-importer@local', name: 'Test Importer' };
const PREFIX = 'TSTIMP';

function buildWorkbook(rows: Record<string, unknown>[]): Buffer {
  const sheet = XLSX.utils.json_to_sheet(rows);
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, 'Temuan');
  return XLSX.write(book, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}

const rowA = {
  NoSatker: `${PREFIX}-01`,
  Tahun: 2035,
  'Kode Temuan': 'T-01',
  'Kode Rekomendasi': 'R-01',
  'Judul Pemeriksaan': 'Pemeriksaan uji impor',
  'Uraian Temuan': 'uraian awal',
  'Uraian Rekomendasi': 'rekomendasi',
  'Nilai Temuan': 'Rp100.000.000',
  Status: 'Belum Ditindaklanjuti',
  'Deskripsi Tindak Lanjut': 'belum ditindaklanjuti',
  'Alasan Ditolak': '',
  'Tanggal Tindak Lanjut': '',
  'Tanggal Terakhir Update': '2035-01-10',
  'Unit Kerja': 'Biro Uji'
};

async function cleanup() {
  // Batch ids first: an import's audit activity references the batch, not a
  // finding, so it must be removed before the batch row disappears.
  const batches = await db
    .select({ id: importBatches.id })
    .from(importBatches)
    .where(eq(importBatches.uploadedByEmail, actor.email));
  const batchIds = batches.map((batch) => batch.id);
  if (batchIds.length > 0) {
    await db.delete(activities).where(inArray(activities.entityId, batchIds));
  }

  const rows = await db
    .select({ id: findings.id })
    .from(findings)
    .where(like(findings.noSatker, `${PREFIX}%`));
  const ids = rows.map((row) => row.id);
  if (ids.length > 0) {
    await db.delete(activities).where(inArray(activities.entityId, ids));
    await db.delete(findings).where(inArray(findings.id, ids));
  }

  await db.delete(importBatches).where(eq(importBatches.uploadedByEmail, actor.email));
}

beforeAll(cleanup);
afterAll(cleanup);

describe('applyImport', () => {
  test('creates new findings, is idempotent on re-run and updates only official columns', async () => {
    // 1) first import -> creates the row
    const first = await applyImport(buildWorkbook([rowA]), 'uji-1.xlsx', actor);
    expect(first.created).toBe(1);
    expect(first.updated).toBe(0);
    expect(first.status).toBe('completed');

    const [created] = await db.select().from(findings).where(eq(findings.noSatker, rowA.NoSatker));
    expect(created.kodeDisplay).toMatch(/^BPK-2035-\d+$/);
    expect(created.status).toBe('Belum Ditindaklanjuti');
    expect(created.nilaiTemuan).toBe('100000000.00');
    expect(created.lastSeenInImportAt).not.toBeNull();

    // 2) identical re-run -> unchanged, no duplicate activity
    const beforeActivities = await db
      .select({ id: activities.id })
      .from(activities)
      .where(eq(activities.entityId, created.id));
    const second = await applyImport(buildWorkbook([rowA]), 'uji-2.xlsx', actor);
    expect(second.created).toBe(0);
    expect(second.updated).toBe(0);
    expect(second.unchanged).toBe(1);
    const afterActivities = await db
      .select({ id: activities.id })
      .from(activities)
      .where(eq(activities.entityId, created.id));
    expect(afterActivities.length).toBe(beforeActivities.length);

    // 3) changed official column + changed internal column
    const third = await applyImport(
      buildWorkbook([
        {
          ...rowA,
          Status: 'Sesuai Rekomendasi',
          'Unit Kerja': 'Biro Lain',
          'Nilai Temuan': 'Rp150.000.000'
        }
      ]),
      'uji-3.xlsx',
      actor
    );
    expect(third.updated).toBe(1);
    expect(third.created).toBe(0);

    const [updated] = await db.select().from(findings).where(eq(findings.id, created.id));
    expect(updated.status).toBe('Sesuai Rekomendasi');
    expect(updated.nilaiTemuan).toBe('150000000.00');
    // Official-only rule: `unit_kerja` is internal and must NOT be overwritten.
    expect(updated.unitKerja).toBe('Biro Uji');

    const diffActivity = await db
      .select({ metadata: activities.metadata, action: activities.action })
      .from(activities)
      .where(eq(activities.entityId, created.id));
    const updateActivity = diffActivity.find((row) => row.action === 'Perbarui Temuan');
    expect(updateActivity?.metadata).toMatchObject({
      status: { from: 'Belum Ditindaklanjuti', to: 'Sesuai Rekomendasi' },
      nilaiTemuan: { from: '100000000.00', to: '150000000.00' }
    });
    expect(Object.keys(updateActivity?.metadata as object)).not.toContain('unitKerja');

    // 4) rows missing identity are skipped but reported, batch status reflects it
    const fourth = await applyImport(
      buildWorkbook([{ ...rowA, 'Kode Temuan': '' }]),
      'uji-4.xlsx',
      actor
    );
    expect(fourth.status).toBe('failed');
    expect(fourth.skipped.length).toBe(1);

    const batches = await db
      .select({
        id: importBatches.id,
        created: importBatches.rowsCreated,
        status: importBatches.status
      })
      .from(importBatches)
      .where(eq(importBatches.uploadedByEmail, actor.email));
    expect(batches.length).toBe(4);
    expect(batches.some((batch) => batch.created === 1 && batch.status === 'completed')).toBe(true);
  }, 30_000);
});
