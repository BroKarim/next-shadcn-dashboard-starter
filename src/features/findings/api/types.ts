/**
 * Canonical data types for the findings feature (task_plan.md §5).
 *
 * These mirror the DB rows, JSON-safe for server actions: money stays a
 * string (D8), timestamps arrive as ISO strings, date-only columns as
 * `YYYY-MM-DD`. The mock file keeps its own structurally-compatible types
 * until the follow-up cleanup phase (§12).
 */

export type FindingStatus =
  | 'Sesuai Rekomendasi'
  | 'Belum Sesuai'
  | 'Belum Ditindaklanjuti'
  | 'Sudah Ditindaklanjuti'
  | 'Tidak Dapat Ditindaklanjuti';

export const FINDING_STATUSES: FindingStatus[] = [
  'Sesuai Rekomendasi',
  'Belum Sesuai',
  'Belum Ditindaklanjuti',
  'Sudah Ditindaklanjuti',
  'Tidak Dapat Ditindaklanjuti'
];

/**
 * Default review order (D11): findings that still need action first, closed
 * findings last. Mirrored by the `CASE` expression in the service query —
 * keep both in sync. There is no `status_priority` column or index (D11).
 */
export const STATUS_PRIORITY: Record<FindingStatus, number> = {
  'Belum Ditindaklanjuti': 0,
  'Belum Sesuai': 1,
  'Sudah Ditindaklanjuti': 2,
  'Sesuai Rekomendasi': 3,
  'Tidak Dapat Ditindaklanjuti': 4
};

export type FindingSort =
  | 'default'
  | 'nilai_asc'
  | 'nilai_desc'
  | 'tahun_asc'
  | 'tahun_desc'
  | 'update_asc'
  | 'update_desc';

export const FINDING_SORTS: FindingSort[] = [
  'default',
  'nilai_asc',
  'nilai_desc',
  'tahun_asc',
  'tahun_desc',
  'update_asc',
  'update_desc'
];

export function toFindingStatus(value: string): FindingStatus {
  return (FINDING_STATUSES as string[]).includes(value)
    ? (value as FindingStatus)
    : 'Belum Ditindaklanjuti';
}

export function toFindingSort(value: string | undefined): FindingSort {
  return value && (FINDING_SORTS as string[]).includes(value) ? (value as FindingSort) : 'default';
}

export interface Finding {
  id: string;
  kodeDisplay: string;
  noSatker: string;
  tahun: number;
  kodeTemuan: string;
  kodeRekomendasi: string;
  judulPemeriksaan: string;
  uraianTemuan: string;
  uraianRekomendasi: string;
  /** Exact numeric string; formatted only at render time (D8/T3). */
  nilaiTemuan: string;
  status: FindingStatus;
  deskripsiTindakLanjut: string;
  alasanDitolak: string | null;
  /** `YYYY-MM-DD` or null. */
  tanggalTindakLanjut: string | null;
  tanggalTerakhirUpdate: string;
  unitKerja: string;
  /** ISO timestamp when soft-deleted; null for live rows. */
  deletedAt: string | null;
}

export interface FindingFilters {
  page?: number;
  perPage?: number;
  q?: string;
  status?: FindingStatus;
  tahun?: number;
  kodeTemuan?: string;
  kodeRekomendasi?: string;
  judul?: string;
  includeDeleted?: boolean;
  sort?: FindingSort;
}

export interface FindingsPage {
  items: Finding[];
  total: number;
  page: number;
  perPage: number;
  pageCount: number;
}

export type OverviewMetricKey = 'total' | 'sesuai' | 'belumSesuai' | 'belumDitindaklanjuti';

export interface OverviewMetric {
  key: OverviewMetricKey;
  label: string;
  status: FindingStatus | null;
  count: number;
  /** Exact numeric string (D8/T3). */
  totalNilai: string;
}

export interface YearlyFinding {
  tahun: number;
  jumlah: number;
}

export interface YearlyValue {
  tahun: number;
  /** Exact numeric string of SUM(nilai_temuan) for that year (D8/T3). */
  totalNilai: string;
}

/** Distinct filter option lists, sourced from the database (Phase 8 cleanup). */
export interface FindingFilterOptions {
  tahun: number[];
  kodeTemuan: string[];
  kodeRekomendasi: string[];
}

export type ActivityAction =
  | 'Impor XLSX'
  | 'Tambah Temuan'
  | 'Perbarui Temuan'
  | 'Hapus Temuan'
  | 'Pulihkan Temuan'
  | 'Unggah Berkas'
  | 'Perbarui Peran Pengguna'
  | 'Hapus Pengguna';

export interface Activity {
  id: string;
  entityType: string;
  entityId: string;
  action: ActivityAction;
  actorEmail: string;
  occurredAt: string;
  /** Display code (e.g. `BPK-2024-001`) when the entity is a finding. */
  findingKode: string | null;
}

export interface FindingComment {
  id: string;
  /** Local `users.id`; null for seed rows (author_user_id is nullable). */
  authorUserId: string | null;
  authorName: string | null;
  authorEmail: string;
  body: string;
  createdAt: string;
  adminReply: string | null;
  adminReplyAt: string | null;
  adminReplyByEmail: string | null;
}

export interface FindingAttachment {
  id: string;
  fileName: string;
  fileType: 'pdf' | 'xlsx' | 'docx' | 'image';
  mimeType: string | null;
  sizeBytes: number;
  uploadedByEmail: string;
  uploadedAt: string;
}

export interface FindingDetail {
  finding: Finding;
  attachments: FindingAttachment[];
  comments: FindingComment[];
  activities: Activity[];
}
