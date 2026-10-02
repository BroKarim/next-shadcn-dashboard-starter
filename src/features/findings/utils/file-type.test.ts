import { describe, expect, test } from 'bun:test';

import { resolveFile, sniffFileType } from './file-type';

const pdf = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37]);
const zip = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x00, 0x00]);
const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
const webp = new Uint8Array([
  0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50
]);

describe('sniffFileType', () => {
  test('detects the supported signatures', () => {
    expect(sniffFileType(pdf)).toBe('pdf');
    expect(sniffFileType(zip)).toBe('zip');
    expect(sniffFileType(png)).toBe('png');
    expect(sniffFileType(jpeg)).toBe('jpeg');
    expect(sniffFileType(webp)).toBe('webp');
  });

  test('returns null for unknown content', () => {
    expect(sniffFileType(new Uint8Array([0x00, 0x01, 0x02]))).toBeNull();
    expect(sniffFileType(new Uint8Array())).toBeNull();
  });
});

describe('resolveFile', () => {
  test('maps signatures to stored types and mime types', () => {
    expect(resolveFile(pdf, 'bukti.pdf')).toEqual({
      fileType: 'pdf',
      mimeType: 'application/pdf',
      extension: 'pdf'
    });
    expect(resolveFile(zip, 'temuan.xlsx')?.fileType).toBe('xlsx');
    expect(resolveFile(zip, 'berita-acara.docx')?.fileType).toBe('docx');
    expect(resolveFile(png, 'foto.png')).toEqual({
      fileType: 'image',
      mimeType: 'image/png',
      extension: 'png'
    });
  });

  test('rejects a file whose extension contradicts its content', () => {
    expect(resolveFile(png, 'palsu.pdf')).toBeNull();
    expect(resolveFile(zip, 'arsip.zip')).toBeNull();
    expect(resolveFile(new Uint8Array([0x00, 0x01]), 'apapun.pdf')).toBeNull();
  });
});
