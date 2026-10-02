import { describe, expect, test } from 'bun:test';

import { diffFields, hasChanges } from './diff';

describe('diffFields', () => {
  test('reports only the fields that changed, as from/to strings', () => {
    const before = { status: 'Belum Sesuai', unitKerja: 'Biro Umum', nilaiTemuan: '620000000.00' };
    const after: Record<string, unknown> = {
      status: 'Sesuai Rekomendasi',
      unitKerja: 'Biro Umum',
      nilaiTemuan: '620000000.00'
    };

    expect(diffFields(before, after, ['status', 'unitKerja', 'nilaiTemuan'])).toEqual({
      status: { from: 'Belum Sesuai', to: 'Sesuai Rekomendasi' }
    });
  });

  test('normalises null/undefined and dates', () => {
    const before: Record<string, unknown> = { alasanDitolak: null, tanggalTindakLanjut: null };
    const after: Record<string, unknown> = {
      alasanDitolak: 'di luar kewenangan',
      tanggalTindakLanjut: new Date('2024-08-22T00:00:00.000Z')
    };

    expect(diffFields(before, after, ['alasanDitolak', 'tanggalTindakLanjut'])).toEqual({
      alasanDitolak: { from: null, to: 'di luar kewenangan' },
      tanggalTindakLanjut: { from: null, to: '2024-08-22T00:00:00.000Z' }
    });
  });

  test('ignores fields outside the given list', () => {
    const before = { status: 'Belum Sesuai', unitKerja: 'Biro Umum' };
    const after: Record<string, unknown> = { status: 'Belum Sesuai', unitKerja: 'Biro Keuangan' };

    expect(diffFields(before, after, ['status'])).toEqual({});
    expect(hasChanges(diffFields(before, after, ['status']))).toBe(false);
  });
});
