/**
 * Magic-byte sniffing for attachment uploads (Phase 5).
 *
 * Extensions alone are not trusted: the signature decides, and the extension
 * only distinguishes the two ZIP-based office formats (`.xlsx` vs `.docx`).
 * Pure and dependency-free so it is unit tested directly.
 */

export type SniffedType = 'pdf' | 'zip' | 'png' | 'jpeg' | 'gif' | 'webp' | 'bmp';

function startsWith(bytes: Uint8Array, signature: number[], offset = 0): boolean {
  if (bytes.length < offset + signature.length) return false;
  return signature.every((byte, index) => bytes[offset + index] === byte);
}

export function sniffFileType(bytes: Uint8Array): SniffedType | null {
  if (startsWith(bytes, [0x25, 0x50, 0x44, 0x46])) return 'pdf'; // %PDF
  if (startsWith(bytes, [0x50, 0x4b, 0x03, 0x04])) return 'zip'; // PK..
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47])) return 'png';
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return 'jpeg';
  if (startsWith(bytes, [0x47, 0x49, 0x46, 0x38])) return 'gif';
  if (startsWith(bytes, [0x42, 0x4d])) return 'bmp';
  if (
    startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) && // RIFF
    startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8) // WEBP
  ) {
    return 'webp';
  }
  return null;
}

export type AttachmentFileType = 'pdf' | 'xlsx' | 'docx' | 'image';

export interface ResolvedFile {
  fileType: AttachmentFileType;
  mimeType: string;
  extension: string;
}

const IMAGE_MIME: Partial<
  Record<SniffedType, { mimeType: string; extension: string; accepted: string[] }>
> = {
  png: { mimeType: 'image/png', extension: 'png', accepted: ['png'] },
  jpeg: { mimeType: 'image/jpeg', extension: 'jpg', accepted: ['jpg', 'jpeg'] },
  gif: { mimeType: 'image/gif', extension: 'gif', accepted: ['gif'] },
  webp: { mimeType: 'image/webp', extension: 'webp', accepted: ['webp'] },
  bmp: { mimeType: 'image/bmp', extension: 'bmp', accepted: ['bmp'] }
};

/**
 * Resolve the stored file type from content + file name, rejecting a name
 * that contradicts the signature (e.g. a PNG renamed to `.pdf`).
 */
export function resolveFile(bytes: Uint8Array, fileName: string): ResolvedFile | null {
  const sniffed = sniffFileType(bytes);
  if (!sniffed) return null;

  const extension = fileName.toLowerCase().split('.').pop() ?? '';

  if (sniffed === 'pdf') {
    return extension === 'pdf'
      ? { fileType: 'pdf', mimeType: 'application/pdf', extension: 'pdf' }
      : null;
  }

  if (sniffed === 'zip') {
    if (extension === 'xlsx') {
      return {
        fileType: 'xlsx',
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        extension: 'xlsx'
      };
    }
    if (extension === 'docx') {
      return {
        fileType: 'docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        extension: 'docx'
      };
    }
    return null;
  }

  const image = IMAGE_MIME[sniffed];
  if (image) {
    // The extension must still agree with the signature (a PNG called `.pdf`
    // is rejected above, a PNG called `.txt` is rejected here).
    if (!image.accepted.includes(extension)) {
      return null;
    }
    return { fileType: 'image', mimeType: image.mimeType, extension: image.extension };
  }

  return null;
}
