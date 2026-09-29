import { readFile } from 'node:fs/promises';

import { auth } from '@clerk/nextjs/server';

import { getAttachmentById } from '@/features/findings/api/service';

/**
 * Authenticated attachment download/preview (task_plan.md §2).
 *
 * Files live under `storage/attachments/` (outside `public/`), so every read
 * goes through this handler and requires a signed-in dashboard user. A row
 * whose file is missing returns a readable 404 instead of crashing.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { id } = await params;
  const attachment = await getAttachmentById(id);
  if (!attachment) {
    return new Response('Lampiran tidak ditemukan.', { status: 404 });
  }

  let file: Buffer;
  try {
    file = await readFile(attachment.storagePath);
  } catch {
    return new Response('Berkas lampiran tidak tersedia di penyimpanan.', { status: 404 });
  }

  return new Response(new Uint8Array(file), {
    headers: {
      'Content-Type': attachment.mimeType ?? 'application/octet-stream',
      'Content-Disposition': `inline; filename="${encodeURIComponent(attachment.fileName)}"`,
      'Cache-Control': 'private, max-age=60'
    }
  });
}
