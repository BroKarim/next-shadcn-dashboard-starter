/**
 * Pure helpers for the XLSX import (task_plan.md D18/D19, §5).
 *
 * Deliberately framework-free: header mapping, identity key, in-file dedupe and
 * the "official columns only" diff are unit tested without a database
 * (`import-xlsx.test.ts`).
 *
 * Identity for matching: `NoSatker + Tahun + KodeTemuan + KodeRekomendasi`
 * (context.md). Only the six official SILAHAP columns may be overwritten by an
 * import; internal data (comments, attachments) is never touched.
 */

import type { FindingFormValues } from '../schemas/finding';
import type { FieldDiff } from './diff';

/** Canonical field -> accepted header spellings (normalised, lowercased). */
const HEADER_ALIASES: Record<keyof ImportedFinding, string[]> = {
  noSatker: ['nosatker', 'no satker', 'kode satker', 'kodesatker', 'satker'],
  tahun: ['tahun', 'tahun pemeriksaan', 'tahunpemeriksaan'],
  kodeTemuan: ['kodetemuan', 'kode temuan'],
  kodeRekomendasi: ['koderekomendasi', 'kode rekomendasi'],
  judulPemeriksaan: ['judulpemeriksaan', 'judul pemeriksaan', 'judul'],
  uraianTemuan: ['uraiantemuan', 'uraian temuan'],
  uraianRekomendasi: ['uraianrekomendasi', 'uraian rekomendasi'],
  nilaiTemuan: ['nilaitemuan', 'nilai temuan', 'nilai'],
  status: ['status', 'status tindak lanjut', 'statustindaklanjut'],
  deskripsiTindakLanjut: ['deskripsitindaklanjut', 'deskripsi tindak lanjut', 'tindak lanjut'],
  alasanDitolak: ['alasanditolak', 'alasan ditolak'],
  tanggalTindakLanjut: ['tangaltindaklanjut', 'tanggal tindak lanjut', 'tanggal tindaklanjut'],
  tanggalTerakhirUpdate: ['tangalterakhirupdate', 'tanggal terakhir update', 'update terakhir'],
  unitKerja: ['unitkerja', 'unit kerja']
};

/** Official SILAHAP columns an import may overwrite (context.md). */
export const OFFICIAL_IMPORT_FIELDS = [
  'status',
  'alasanDitolak',
  'deskripsiTindakLanjut',
  'tanggalTindakLanjut',
  'tanggalTerakhirUpdate',
  'nilaiTemuan'
] as const;

export interface ImportedFinding {
  noSatker: string;
  tahun: number;
  kodeTemuan: string;
  kodeRekomendasi: string;
  judulPemeriksaan: string;
  uraianTemuan: string;
  uraianRekomendasi: string;
  nilaiTemuan: number;
  status: FindingFormValues['status'];
  deskripsiTindakLanjut: string;
  alasanDitolak: string | null;
  tanggalTindakLanjut: string | null;
  tanggalTerakhirUpdate: Date;
  unitKerja: string;
}

export interface SkippedRow {
  rowNumber: number;
  reason: string;
}

export interface MappedSheet {
  records: ImportedFinding[];
  skipped: SkippedRow[];
}

export function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/[_.]/g, ' ').replace(/\s+/g, ' ');
}

function buildHeaderLookup(): Map<string, keyof ImportedFinding> {
  const lookup = new Map<string, keyof ImportedFinding>();
  for (const [field, aliases] of Object.entries(HEADER_ALIASES) as [
    keyof ImportedFinding,
    string[]
  ][]) {
    for (const alias of aliases) {
      lookup.set(normalizeHeader(alias), field);
    }
  }
  return lookup;
}

const HEADER_LOOKUP = buildHeaderLookup();

function pickValue(row: Record<string, unknown>, field: keyof ImportedFinding): unknown {
  for (const [key, value] of Object.entries(row)) {
    if (HEADER_LOOKUP.get(normalizeHeader(key)) === field) {
      return value;
    }
  }
  return undefined;
}

function toText(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

/** Accepts `1.845.000.000`, `Rp1.845.000.000`, `1845000000`, `1845000000.00`. */
export function parseRupiah(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  const text = toText(value);
  if (!text) return null;

  const cleaned = text.replace(/rp/gi, '').replace(/\s/g, '');
  // Indonesian format uses `.` as thousands separator and `,` as decimal.
  const normalized = cleaned.includes(',')
    ? cleaned.replace(/\./g, '').replace(',', '.')
    : cleaned.replace(/\.(?=\d{3}\b)/g, '');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Accepts a Date, an ISO string, or `DD/MM/YYYY` / `DD-MM-YYYY`. */
export function parseDate(value: unknown): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  const text = toText(value);
  if (!text) return null;

  const dmy = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmy) {
    const [, day, month, year] = dmy;
    const parsed = new Date(Number(year), Number(month) - 1, Number(day));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * `YYYY-MM-DD` for a `date` column. Date-only semantics: a string keeps the
 * day exactly as written (`2024-08-22T00:00:00+07:00` -> `2024-08-22`, never
 * shifted by the server timezone), while a real Date (Excel cell) uses its
 * wall-clock parts.
 */
export function parseDateOnly(value: unknown): string | null {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${value.getFullYear()}-${month}-${day}`;
  }

  const text = toText(value);
  if (!text) return null;

  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    return `${iso[1]}-${iso[2]}-${iso[3]}`;
  }

  const dmy = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmy) {
    const [, day, month, year] = dmy;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  const parsed = parseDate(text);
  if (!parsed) return null;
  return parseDateOnly(parsed);
}

export function importIdentity(record: {
  noSatker: string;
  tahun: number;
  kodeTemuan: string;
  kodeRekomendasi: string;
}): string {
  return [record.noSatker, record.tahun, record.kodeTemuan, record.kodeRekomendasi]
    .map((part) => String(part).trim().toUpperCase())
    .join('|');
}

function parseStatus(value: unknown): ImportedFinding['status'] | null {
  const text = toText(value);
  const allowed: ImportedFinding['status'][] = [
    'Sesuai Rekomendasi',
    'Belum Sesuai',
    'Belum Ditindaklanjuti',
    'Sudah Ditindaklanjuti',
    'Tidak Dapat Ditindaklanjuti'
  ];
  const match = allowed.find((status) => normalizeHeader(status) === normalizeHeader(text));
  return match ?? null;
}

/**
 * Map raw sheet rows (header -> cell) into findings.
 * Rows that cannot be identified, carry an unknown status, or duplicate an
 * identity already seen in the same file are skipped with a reason.
 */
export function mapSheetRows(rows: Record<string, unknown>[]): MappedSheet {
  const records: ImportedFinding[] = [];
  const skipped: SkippedRow[] = [];
  const seen = new Set<string>();

  rows.forEach((row, index) => {
    const rowNumber = index + 2; // +1 header row, +1 for 1-based numbering

    const noSatker = toText(pickValue(row, 'noSatker'));
    const kodeTemuan = toText(pickValue(row, 'kodeTemuan'));
    const kodeRekomendasi = toText(pickValue(row, 'kodeRekomendasi'));
    const tahun = Number(toText(pickValue(row, 'tahun')));
    const status = parseStatus(pickValue(row, 'status'));
    const nilaiTemuan = parseRupiah(pickValue(row, 'nilaiTemuan'));

    const missing = [
      !noSatker && 'NoSatker',
      !kodeTemuan && 'KodeTemuan',
      !kodeRekomendasi && 'KodeRekomendasi',
      (!tahun || Number.isNaN(tahun)) && 'Tahun'
    ].filter(Boolean);

    if (missing.length > 0) {
      skipped.push({ rowNumber, reason: `Kolom wajib kosong: ${missing.join(', ')}` });
      return;
    }
    if (!status) {
      skipped.push({ rowNumber, reason: 'Status tindak lanjut tidak dikenal' });
      return;
    }
    if (nilaiTemuan === null) {
      skipped.push({ rowNumber, reason: 'Nilai temuan tidak dapat dibaca' });
      return;
    }

    const identity = importIdentity({ noSatker, tahun, kodeTemuan, kodeRekomendasi });
    if (seen.has(identity)) {
      skipped.push({ rowNumber, reason: 'Duplikat di dalam berkas (baris pertama dipakai)' });
      return;
    }
    seen.add(identity);

    const tanggalTerakhirUpdate = parseDate(pickValue(row, 'tanggalTerakhirUpdate')) ?? new Date();

    records.push({
      noSatker,
      tahun,
      kodeTemuan,
      kodeRekomendasi,
      judulPemeriksaan: toText(pickValue(row, 'judulPemeriksaan')),
      uraianTemuan: toText(pickValue(row, 'uraianTemuan')),
      uraianRekomendasi: toText(pickValue(row, 'uraianRekomendasi')),
      nilaiTemuan,
      status,
      deskripsiTindakLanjut: toText(pickValue(row, 'deskripsiTindakLanjut')),
      alasanDitolak: toText(pickValue(row, 'alasanDitolak')) || null,
      tanggalTindakLanjut: parseDateOnly(pickValue(row, 'tanggalTindakLanjut')),
      tanggalTerakhirUpdate,
      unitKerja: toText(pickValue(row, 'unitKerja'))
    });
  });

  return { records, skipped };
}

/**
 * Diff of the official columns only (context.md): internal data such as
 * comments and attachments can never be clobbered by an import.
 */
export function diffOfficialFields(
  before: Record<string, unknown>,
  after: Record<string, unknown>
): FieldDiff {
  const diff: FieldDiff = {};
  for (const field of OFFICIAL_IMPORT_FIELDS) {
    const from =
      before[field] === null || before[field] === undefined ? null : String(before[field]);
    const to = after[field] === null || after[field] === undefined ? null : String(after[field]);
    if (from !== to) {
      diff[field] = { from, to };
    }
  }
  return diff;
}
