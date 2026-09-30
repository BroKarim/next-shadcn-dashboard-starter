'use server';

/**
 * Findings data access (task_plan.md §5, D23).
 *
 * Server Actions + Drizzle (AGENTS.md pattern 1). Every function authenticates
 * server-side before touching the database (D20) and returns plain typed data;
 * failures are domain errors (`NotFoundError`, `ForbiddenError`, …) translated
 * into safe toast messages by `toUserMessage` on the client (D21).
 *
 * All filtering, pagination, aggregation and the status-priority sort run in
 * SQL. There is no `status_priority` column — the default order is a `CASE`
 * expression mirroring `STATUS_PRIORITY` in `types.ts` (D11).
 */

import { and, asc, count, desc, eq, ilike, isNull, or, sql, type SQL } from 'drizzle-orm';

import { db } from '@/db/client';
import { activities, attachments, comments, findings } from '@/db/schema';
import { NotFoundError, ValidationError } from '@/lib/errors';
import { requireAuth, requireRole } from '@/lib/rbac';
import {
  STATUS_PRIORITY,
  toFindingSort,
  toFindingStatus,
  type Activity,
  type Finding,
  type FindingAttachment,
  type FindingComment,
  type FindingDetail,
  type FindingFilterOptions,
  type FindingFilters,
  type FindingSort,
  type FindingsPage,
  type FindingStatus,
  type OverviewMetric,
  type YearlyFinding,
  type YearlyValue
} from './types';

const MAX_PER_PAGE = 100;

/** Keep `STATUS_PRIORITY` (types.ts) and this CASE expression in sync. */
const STATUS_ORDER = (Object.entries(STATUS_PRIORITY) as [FindingStatus, number][]).toSorted(
  (a, b) => a[1] - b[1]
);

const statusPrioritySql = sql`(case ${findings.status} ${sql.raw(
  `${STATUS_ORDER.map(([status, priority]) => `when '${status}' then ${priority}`).join(' ')} else ${STATUS_ORDER.length} end`
)})`;

type FindingRow = typeof findings.$inferSelect;
type CommentRow = typeof comments.$inferSelect;
type AttachmentRow = typeof attachments.$inferSelect;

function toFindingDTO(row: FindingRow): Finding {
  return {
    id: row.id,
    kodeDisplay: row.kodeDisplay,
    noSatker: row.noSatker,
    tahun: row.tahun,
    kodeTemuan: row.kodeTemuan,
    kodeRekomendasi: row.kodeRekomendasi,
    judulPemeriksaan: row.judulPemeriksaan,
    uraianTemuan: row.uraianTemuan,
    uraianRekomendasi: row.uraianRekomendasi,
    nilaiTemuan: row.nilaiTemuan,
    status: toFindingStatus(row.status),
    deskripsiTindakLanjut: row.deskripsiTindakLanjut,
    alasanDitolak: row.alasanDitolak,
    tanggalTindakLanjut: row.tanggalTindakLanjut,
    tanggalTerakhirUpdate: row.tanggalTerakhirUpdate.toISOString(),
    unitKerja: row.unitKerja,
    deletedAt: row.deletedAt ? row.deletedAt.toISOString() : null
  };
}

function toActivityDTO(row: {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  actorEmail: string;
  occurredAt: Date;
  findingKode?: string | null;
}): Activity {
  return {
    id: row.id,
    entityType: row.entityType,
    entityId: row.entityId,
    action: toActivityAction(row.action),
    actorEmail: row.actorEmail,
    occurredAt: row.occurredAt.toISOString(),
    findingKode: row.findingKode ?? null
  };
}

function toActivityAction(value: string): Activity['action'] {
  const allowed: string[] = [
    'Impor XLSX',
    'Tambah Temuan',
    'Perbarui Temuan',
    'Hapus Temuan',
    'Pulihkan Temuan',
    'Unggah Berkas',
    'Perbarui Peran Pengguna'
  ];
  return allowed.includes(value) ? (value as Activity['action']) : 'Perbarui Temuan';
}

function toFileType(value: string): FindingAttachment['fileType'] {
  return ['pdf', 'xlsx', 'docx', 'image'].includes(value)
    ? (value as FindingAttachment['fileType'])
    : 'pdf';
}

function toCommentDTO(row: CommentRow): FindingComment {
  return {
    id: row.id,
    authorUserId: row.authorUserId,
    authorName: row.authorName,
    authorEmail: row.authorEmail,
    body: row.body,
    createdAt: row.createdAt.toISOString()
  };
}

function toAttachmentDTO(row: AttachmentRow): FindingAttachment {
  return {
    id: row.id,
    fileName: row.fileName,
    fileType: toFileType(row.fileType),
    mimeType: row.mimeType,
    sizeBytes: row.sizeBytes,
    uploadedByEmail: row.uploadedByEmail,
    uploadedAt: row.uploadedAt.toISOString()
  };
}

function buildConditions(filters: FindingFilters): SQL[] {
  const conditions: SQL[] = [];

  if (!filters.includeDeleted) {
    conditions.push(isNull(findings.deletedAt));
  }

  if (filters.q) {
    const needle = `%${filters.q}%`;
    const qMatch = or(
      ilike(findings.kodeDisplay, needle),
      ilike(findings.noSatker, needle),
      ilike(findings.kodeTemuan, needle),
      ilike(findings.kodeRekomendasi, needle)
    );
    if (qMatch) {
      conditions.push(qMatch);
    }
  }

  if (filters.status) {
    conditions.push(eq(findings.status, filters.status));
  }
  if (filters.tahun !== undefined) {
    conditions.push(eq(findings.tahun, filters.tahun));
  }
  if (filters.kodeTemuan) {
    conditions.push(eq(findings.kodeTemuan, filters.kodeTemuan));
  }
  if (filters.kodeRekomendasi) {
    conditions.push(eq(findings.kodeRekomendasi, filters.kodeRekomendasi));
  }
  if (filters.judul) {
    conditions.push(ilike(findings.judulPemeriksaan, `%${filters.judul}%`));
  }

  return conditions;
}

function orderFor(sort: FindingSort): SQL[] {
  switch (sort) {
    case 'nilai_asc':
      return [asc(findings.nilaiTemuan)];
    case 'nilai_desc':
      return [desc(findings.nilaiTemuan)];
    case 'tahun_asc':
      return [asc(findings.tahun)];
    case 'tahun_desc':
      return [desc(findings.tahun)];
    case 'update_asc':
      return [asc(findings.tanggalTerakhirUpdate)];
    case 'update_desc':
      return [desc(findings.tanggalTerakhirUpdate)];
    default:
      // Default review order: status priority, then oldest update first (D11).
      return [statusPrioritySql, asc(findings.tanggalTerakhirUpdate)];
  }
}

function normalizePagination(filters: FindingFilters): {
  page: number;
  perPage: number;
  offset: number;
} {
  const page = Math.max(1, filters.page ?? 1);
  const perPage = Math.min(Math.max(1, filters.perPage ?? 10), MAX_PER_PAGE);
  return { page, perPage, offset: (page - 1) * perPage };
}

export async function listFindings(filters: FindingFilters): Promise<FindingsPage> {
  if (filters.includeDeleted) {
    await requireRole('admin');
  } else {
    await requireAuth();
  }

  const { page, perPage, offset } = normalizePagination(filters);
  const conditions = buildConditions(filters);
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [{ total }] = await db.select({ total: count() }).from(findings).where(where);

  const rows = await db
    .select()
    .from(findings)
    .where(where)
    .orderBy(...orderFor(toFindingSort(filters.sort)))
    .limit(perPage)
    .offset(offset);

  return {
    items: rows.map(toFindingDTO),
    total: Number(total),
    page,
    perPage,
    pageCount: Math.max(1, Math.ceil(Number(total) / perPage))
  };
}

export async function getOverviewMetrics(): Promise<OverviewMetric[]> {
  await requireAuth();

  const where = isNull(findings.deletedAt);
  const [overall] = await db
    .select({
      jumlah: count(),
      total: sql<string>`coalesce(sum(${findings.nilaiTemuan}), 0)::text`
    })
    .from(findings)
    .where(where);

  const rows = await db
    .select({
      status: findings.status,
      jumlah: count(),
      total: sql<string>`coalesce(sum(${findings.nilaiTemuan}), 0)::text`
    })
    .from(findings)
    .where(where)
    .groupBy(findings.status);

  const byStatus = new Map(rows.map((row) => [row.status, row]));
  const metric = (key: OverviewMetric['key'], status: string | null, label: string) => {
    const row = status === null ? null : byStatus.get(status);
    return {
      key,
      label,
      status: status === null ? null : toFindingStatus(status),
      count: row ? Number(row.jumlah) : 0,
      totalNilai: row ? row.total : '0.00'
    };
  };

  return [
    metric('total', null, 'Total Temuan'),
    metric('sesuai', 'Sesuai Rekomendasi', 'Sesuai Rekomendasi'),
    metric('belumSesuai', 'Belum Sesuai', 'Belum Sesuai'),
    metric('belumDitindaklanjuti', 'Belum Ditindaklanjuti', 'Belum Ditindaklanjuti')
  ].map((m) =>
    m.key === 'total'
      ? { ...m, count: Number(overall?.jumlah ?? 0), totalNilai: overall?.total ?? '0.00' }
      : m
  );
}

export async function getFindingsByYear(): Promise<YearlyFinding[]> {
  await requireAuth();

  const rows = await db
    .select({ tahun: findings.tahun, jumlah: count() })
    .from(findings)
    .where(isNull(findings.deletedAt))
    .groupBy(findings.tahun)
    .orderBy(asc(findings.tahun));

  return rows.map((row) => ({ tahun: row.tahun, jumlah: Number(row.jumlah) }));
}

/** Sum of finding values per year — the non-admin overview chart. */
export async function getFindingsValueByYear(): Promise<YearlyValue[]> {
  await requireAuth();

  const rows = await db
    .select({
      tahun: findings.tahun,
      totalNilai: sql<string>`coalesce(sum(${findings.nilaiTemuan}), 0)::text`
    })
    .from(findings)
    .where(isNull(findings.deletedAt))
    .groupBy(findings.tahun)
    .orderBy(asc(findings.tahun));

  return rows.map((row) => ({ tahun: row.tahun, totalNilai: row.totalNilai }));
}

/**
 * Distinct filter option lists for the findings table — one SQL round-trip
 * (array_agg with DISTINCT + ORDER BY) instead of three queries. Replaces the
 * mock constants (`BPK_YEARS`, `BPK_KODE_TEMUAN`, `BPK_KODE_REKOMENDASI`).
 */
export async function getFindingFilterOptions(): Promise<FindingFilterOptions> {
  await requireAuth();

  const [row] = await db
    .select({
      tahun: sql<number[] | null>`array_agg(distinct ${findings.tahun} order by ${findings.tahun})`,
      kodeTemuan: sql<
        string[] | null
      >`array_agg(distinct ${findings.kodeTemuan} order by ${findings.kodeTemuan})`,
      kodeRekomendasi: sql<
        string[] | null
      >`array_agg(distinct ${findings.kodeRekomendasi} order by ${findings.kodeRekomendasi})`
    })
    .from(findings)
    .where(isNull(findings.deletedAt));

  return {
    tahun: row?.tahun ?? [],
    kodeTemuan: row?.kodeTemuan ?? [],
    kodeRekomendasi: row?.kodeRekomendasi ?? []
  };
}

export async function listRecentActivities(limit?: number): Promise<Activity[]> {
  await requireAuth();

  // No limit by default — the overview panel shows every activity in a
  // scrollable area without a visible scrollbar (D34). The display code is
  // joined in so the panel never shows raw uuids.
  const query = db
    .select({
      id: activities.id,
      entityType: activities.entityType,
      entityId: activities.entityId,
      action: activities.action,
      actorEmail: activities.actorEmail,
      occurredAt: activities.occurredAt,
      findingKode: findings.kodeDisplay
    })
    .from(activities)
    .leftJoin(
      findings,
      and(eq(activities.entityType, 'finding'), eq(activities.entityId, findings.id))
    )
    .orderBy(desc(activities.occurredAt));

  const rows = limit === undefined ? await query : await query.limit(limit);
  return rows.map(toActivityDTO);
}

export async function listFindingActivities(
  findingId: string,
  limit?: number
): Promise<Activity[]> {
  await requireAuth();

  if (!findingId) {
    throw new ValidationError('id temuan wajib diisi.');
  }

  const query = db
    .select()
    .from(activities)
    .where(and(eq(activities.entityType, 'finding'), eq(activities.entityId, findingId)))
    .orderBy(desc(activities.occurredAt));

  const rows = limit === undefined ? await query : await query.limit(limit);
  return rows.map(toActivityDTO);
}

export async function getFindingDetail(id: string): Promise<FindingDetail> {
  await requireAuth();

  if (!id) {
    throw new ValidationError('id temuan wajib diisi.');
  }

  const [row] = await db
    .select()
    .from(findings)
    .where(and(eq(findings.kodeDisplay, id), isNull(findings.deletedAt)));

  if (!row) {
    throw new NotFoundError(`Temuan ${id} tidak ditemukan.`);
  }

  const [attachmentRows, commentRows, activityRows] = await Promise.all([
    db
      .select()
      .from(attachments)
      .where(eq(attachments.findingId, row.id))
      .orderBy(desc(attachments.uploadedAt)),
    db
      .select()
      .from(comments)
      .where(eq(comments.findingId, row.id))
      .orderBy(asc(comments.createdAt)),
    db
      .select()
      .from(activities)
      .where(and(eq(activities.entityType, 'finding'), eq(activities.entityId, row.id)))
      .orderBy(desc(activities.occurredAt))
  ]);

  return {
    finding: toFindingDTO(row),
    attachments: attachmentRows.map(toAttachmentDTO),
    comments: commentRows.map(toCommentDTO),
    activities: activityRows.map(toActivityDTO)
  };
}

/** Single attachment row for the authenticated download route. */
export async function getAttachmentById(id: string): Promise<{
  id: string;
  fileName: string;
  storagePath: string;
  mimeType: string | null;
} | null> {
  await requireAuth();

  if (!id) {
    return null;
  }

  const [row] = await db
    .select({
      id: attachments.id,
      fileName: attachments.fileName,
      storagePath: attachments.storagePath,
      mimeType: attachments.mimeType
    })
    .from(attachments)
    .where(eq(attachments.id, id));

  return row ?? null;
}
