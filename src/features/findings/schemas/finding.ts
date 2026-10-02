import { z } from 'zod';

import { FINDING_STATUSES, type FindingStatus } from '../api/types';

/**
 * Validation for manual finding create/update (Phase 5, D23).
 * Shared by the form (client) and the server action — the server always
 * re-validates, the client only mirrors the messages.
 */

const findingStatusSchema = z.custom<FindingStatus>(
  (value) => typeof value === 'string' && (FINDING_STATUSES as string[]).includes(value),
  'Status tindak lanjut tidak valid.'
);

export const findingSchema = z.object({
  noSatker: z.string().trim().min(1, 'No satker wajib diisi.'),
  tahun: z
    .number('Tahun wajib diisi.')
    .int('Tahun harus bilangan bulat.')
    .min(2000, 'Tahun minimal 2000.')
    .max(2100, 'Tahun maksimal 2100.'),
  kodeTemuan: z.string().trim().min(1, 'Kode temuan wajib diisi.'),
  kodeRekomendasi: z.string().trim().min(1, 'Kode rekomendasi wajib diisi.'),
  judulPemeriksaan: z.string().trim().min(3, 'Judul pemeriksaan minimal 3 karakter.'),
  uraianTemuan: z.string().trim().min(1, 'Uraian temuan wajib diisi.'),
  uraianRekomendasi: z.string().trim().min(1, 'Uraian rekomendasi wajib diisi.'),
  nilaiTemuan: z.number('Nilai temuan wajib diisi.').min(0, 'Nilai temuan tidak boleh negatif.'),
  status: findingStatusSchema,
  deskripsiTindakLanjut: z.string().trim().default(''),
  unitKerja: z.string().trim().min(1, 'Unit kerja wajib diisi.'),
  alasanDitolak: z.string().trim().optional(),
  // `YYYY-MM-DD` from `<Input type='date' />`; empty means "no date".
  tanggalTindakLanjut: z.string().trim().optional()
});

export type FindingFormValues = z.input<typeof findingSchema>;
