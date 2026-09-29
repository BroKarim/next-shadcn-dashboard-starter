// oxlint-disable no-console -- CLI script; stdout/stderr is its interface
/**
 * Seed dev data (task_plan.md §4, D26).
 *
 * Run with `bun run src/db/seed.ts`.
 *
 * - Source: the dummy dataset in `src/db/fixtures/findings.ts` (the seed
 *   fixture moved out of the UI mock during the Phase 8 cleanup).
 * - Non-destructive upsert: `INSERT ... ON CONFLICT (natural key)
 *   WHERE deleted_at IS NULL DO NOTHING`. Existing rows are never updated,
 *   rows are never deleted, and real edits survive a re-run.
 * - Attachments are NOT seeded (D25) — no orphan metadata that would 404.
 * - `users` rows are NOT seeded; they are born from `ensureCurrentUser()`.
 * - Activities/comments are append-only, so re-runs would duplicate them;
 *   each row is keyed by (entity, action/author, timestamp) and skipped if
 *   the exact row already exists.
 *
 * This script owns its connection because `src/db/client.ts` is guarded by
 * `server-only`, which is a Next.js-only runtime concept.
 */

import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import {
  BPK_ADMIN_ACTIVITIES,
  BPK_COMMENTS,
  BPK_FINDINGS,
  type AdminActivity,
  type BpkFinding
} from './fixtures/findings';
import { activities, comments, findings } from './schema';

if (!process.env.DATABASE_URL) {
  // Bun loads `.env.local` automatically; dotenv is only a fallback.
  const dotenv = await import('dotenv');
  dotenv.config({ path: '.env.local' });
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

const pg = postgres(url);
const db = drizzle(pg);

const toFindingValues = (f: BpkFinding) => ({
  kodeDisplay: f.id,
  noSatker: f.noSatker,
  tahun: f.tahun,
  kodeTemuan: f.kodeTemuan,
  kodeRekomendasi: f.kodeRekomendasi,
  judulPemeriksaan: f.judulPemeriksaan,
  uraianTemuan: f.uraianTemuan,
  uraianRekomendasi: f.uraianRekomendasi,
  nilaiTemuan: f.nilaiTemuan.toFixed(2),
  status: f.status,
  deskripsiTindakLanjut: f.deskripsiTindakLanjut,
  alasanDitolak: f.alasanDitolak ?? null,
  tanggalTindakLanjut: f.tanggalTindakLanjut ? f.tanggalTindakLanjut.slice(0, 10) : null,
  tanggalTerakhirUpdate: new Date(f.tanggalTerakhirUpdate),
  unitKerja: f.unitKerja
});

async function seedFindings(): Promise<{ inserted: number; skipped: number }> {
  const inserted = await db
    .insert(findings)
    .values(BPK_FINDINGS.map(toFindingValues))
    .onConflictDoNothing({
      target: [findings.noSatker, findings.tahun, findings.kodeTemuan, findings.kodeRekomendasi],
      where: sql`deleted_at is null`
    })
    .returning({ id: findings.id, kodeDisplay: findings.kodeDisplay });

  return { inserted: inserted.length, skipped: BPK_FINDINGS.length - inserted.length };
}

/** Map every `BPK-…` display id to its database uuid. */
async function loadFindingIds(): Promise<Map<string, string>> {
  const rows = await db
    .select({ id: findings.id, kodeDisplay: findings.kodeDisplay })
    .from(findings);
  const map = new Map<string, string>();
  for (const row of rows) {
    // Prefer live rows; the last duplicate wins otherwise.
    map.set(row.kodeDisplay, row.id);
  }
  return map;
}

async function seedActivities(
  findingIds: Map<string, string>
): Promise<{ inserted: number; skippedExisting: number; noFinding: number }> {
  const existing = await db
    .select({
      entityId: activities.entityId,
      action: activities.action,
      occurredAt: activities.occurredAt
    })
    .from(activities);
  const seen = new Set(
    existing.map((r) => `${r.entityId}|${r.action}|${r.occurredAt.toISOString()}`)
  );

  let skippedExisting = 0;
  let noFinding = 0;
  const rows: {
    entityType: 'finding';
    entityId: string;
    action: AdminActivity['action'];
    actorEmail: string;
    occurredAt: Date;
  }[] = [];

  for (const a of BPK_ADMIN_ACTIVITIES) {
    // Batch-level activities (e.g. `Impor XLSX` without a findingId) belong to
    // a real `import_batches` row and are produced by the import feature, so
    // they are deliberately not faked here.
    const entityId = a.findingId ? findingIds.get(a.findingId) : undefined;
    if (!entityId) {
      noFinding += 1;
      continue;
    }
    const occurredAt = new Date(a.occurredAt);
    const key = `${entityId}|${a.action}|${occurredAt.toISOString()}`;
    if (seen.has(key)) {
      skippedExisting += 1;
      continue;
    }
    seen.add(key);
    rows.push({
      entityType: 'finding',
      entityId,
      action: a.action,
      actorEmail: a.actorEmail,
      occurredAt
    });
  }

  if (rows.length > 0) {
    await db.insert(activities).values(rows);
  }
  return { inserted: rows.length, skippedExisting, noFinding };
}

async function seedComments(
  findingIds: Map<string, string>
): Promise<{ inserted: number; skippedExisting: number; noFinding: number }> {
  const existing = await db
    .select({
      findingId: comments.findingId,
      authorEmail: comments.authorEmail,
      createdAt: comments.createdAt
    })
    .from(comments);
  const seen = new Set(
    existing.map((r) => `${r.findingId}|${r.authorEmail}|${r.createdAt.toISOString()}`)
  );

  let skippedExisting = 0;
  const rows: {
    findingId: string;
    authorEmail: string;
    authorName: string | null;
    body: string;
    createdAt: Date;
  }[] = [];

  for (const c of BPK_COMMENTS) {
    const findingId = findingIds.get(c.findingId);
    if (!findingId) {
      continue;
    }
    const createdAt = new Date(c.createdAt);
    const key = `${findingId}|${c.authorEmail}|${createdAt.toISOString()}`;
    if (seen.has(key)) {
      skippedExisting += 1;
      continue;
    }
    seen.add(key);
    rows.push({
      findingId,
      authorEmail: c.authorEmail,
      authorName: c.authorName ?? null,
      body: c.body,
      createdAt
    });
  }

  if (rows.length > 0) {
    await db.insert(comments).values(rows);
  }
  return {
    inserted: rows.length,
    skippedExisting,
    noFinding: BPK_COMMENTS.length - rows.length - skippedExisting
  };
}

async function main() {
  const findingsResult = await seedFindings();
  console.log(
    `findings: inserted=${findingsResult.inserted} skipped=${findingsResult.skipped} (total mock: ${BPK_FINDINGS.length})`
  );

  const findingIds = await loadFindingIds();
  const activitiesResult = await seedActivities(findingIds);
  console.log(
    `activities: inserted=${activitiesResult.inserted} skipped=${activitiesResult.skippedExisting} batch-level=${activitiesResult.noFinding} (total mock: ${BPK_ADMIN_ACTIVITIES.length})`
  );

  const commentsResult = await seedComments(findingIds);
  console.log(
    `comments: inserted=${commentsResult.inserted} skipped=${commentsResult.skippedExisting} no-finding=${commentsResult.noFinding} (total mock: ${BPK_COMMENTS.length})`
  );
}

try {
  await main();
} catch (error) {
  console.error('seed failed:', error);
  process.exitCode = 1;
} finally {
  await pg.end();
}
