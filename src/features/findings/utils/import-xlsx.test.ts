import { describe, expect, test } from 'bun:test';

import {
  diffOfficialFields,
  importIdentity,
  mapSheetRows,
  parseDateOnly,
  parseRupiah
} from './import-xlsx';

const baseRow = {
  NoSatker: 'USK-01',
  Tahun: 2024,
  'Kode Temuan': 'T-01',
  'Kode Rekomendasi': 'R-01',
  'Judul Pemeriksaan': 'Pemeriksaan Aset',
  'Uraian Temuan': 'uraian',
  'Uraian Rekomendasi': 'rekomendasi',
  'Nilai Temuan': 'Rp1.845.000.000',
  Status: 'Belum Sesuai',
  'Deskripsi Tindak Lanjut': 'tindak lanjut',
  'Alasan Ditolak': '',
  'Tanggal Tindak Lanjut': '22/08/2024',
  'Tanggal Terakhir Update': '2024-09-18T09:15:00+07:00',
  'Unit Kerja': 'Biro Umum'
};

describe('parseRupiah', () => {
  test('reads Indonesian formatted rupiah', () => {
    expect(parseRupiah('Rp1.845.000.000')).toBe(1_845_000_000);
    expect(parseRupiah('512.300.000')).toBe(512_300_000);
    expect(parseRupiah(620000000)).toBe(620_000_000);
    expect(parseRupiah('1845000000.00')).toBe(1_845_000_000);
    expect(parseRupiah('96.000.000,50')).toBe(96_000_000.5);
  });

  test('rejects unreadable values', () => {
    expect(parseRupiah('')).toBeNull();
    expect(parseRupiah('tidak ada')).toBeNull();
  });
});

describe('parseDateOnly', () => {
  test('keeps the written day regardless of the server timezone', () => {
    expect(parseDateOnly('2024-08-22T00:00:00+07:00')).toBe('2024-08-22');
    expect(parseDateOnly('2024-08-22')).toBe('2024-08-22');
    expect(parseDateOnly('22/08/2024')).toBe('2024-08-22');
    expect(parseDateOnly('22-08-2024')).toBe('2024-08-22');
    expect(parseDateOnly(new Date(2024, 7, 22))).toBe('2024-08-22');
    expect(parseDateOnly('')).toBeNull();
  });
});

describe('importIdentity', () => {
  test('is case/space insensitive on the four identity columns', () => {
    expect(
      importIdentity({
        noSatker: ' usk-01 ',
        tahun: 2024,
        kodeTemuan: 't-01',
        kodeRekomendasi: 'r-01'
      })
    ).toBe(
      importIdentity({
        noSatker: 'USK-01',
        tahun: 2024,
        kodeTemuan: 'T-01',
        kodeRekomendasi: 'R-01'
      })
    );
  });
});

describe('mapSheetRows', () => {
  test('maps an aliased header set into a finding record', () => {
    const { records, skipped } = mapSheetRows([baseRow]);

    expect(skipped).toEqual([]);
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({
      noSatker: 'USK-01',
      tahun: 2024,
      kodeTemuan: 'T-01',
      kodeRekomendasi: 'R-01',
      nilaiTemuan: 1_845_000_000,
      status: 'Belum Sesuai',
      alasanDitolak: null,
      tanggalTindakLanjut: '2024-08-22'
    });
  });

  test('skips rows without identity, with unknown status, or duplicated in-file', () => {
    const { records, skipped } = mapSheetRows([
      { ...baseRow },
      { ...baseRow, 'Kode Temuan': '' },
      { ...baseRow, 'Kode Temuan': 'T-02', Status: 'Status Aneh' },
      { ...baseRow, 'Nilai Temuan': 'bukan angka', 'Kode Temuan': 'T-03' },
      { ...baseRow }
    ]);

    expect(records).toHaveLength(1);
    expect(skipped.map((row) => row.rowNumber)).toEqual([3, 4, 5, 6]);
    expect(skipped[0].reason).toContain('Kolom wajib kosong');
    expect(skipped[1].reason).toContain('Status');
    expect(skipped[2].reason).toContain('Nilai temuan');
    expect(skipped[3].reason).toContain('Duplikat');
  });
});

describe('diffOfficialFields', () => {
  test('only reports the six official SILAHAP columns', () => {
    const before = {
      status: 'Belum Sesuai',
      alasanDitolak: null,
      deskripsiTindakLanjut: 'lama',
      tanggalTindakLanjut: '2024-01-01',
      tanggalTerakhirUpdate: '2024-01-01T00:00:00.000Z',
      nilaiTemuan: '100.00',
      unitKerja: 'Biro Umum',
      judulPemeriksaan: 'judul lama'
    };
    const after = {
      status: 'Sesuai Rekomendasi',
      alasanDitolak: null,
      deskripsiTindakLanjut: 'lama',
      tanggalTindakLanjut: '2024-01-01',
      tanggalTerakhirUpdate: '2024-01-01T00:00:00.000Z',
      nilaiTemuan: '100.00',
      unitKerja: 'Biro Keuangan',
      judulPemeriksaan: 'judul baru'
    };

    expect(diffOfficialFields(before, after)).toEqual({
      status: { from: 'Belum Sesuai', to: 'Sesuai Rekomendasi' }
    });
  });
});
