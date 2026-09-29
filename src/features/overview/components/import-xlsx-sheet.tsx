'use client';

import * as React from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { LoadingButton } from '@/components/ui/loading-button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import {
  checkImportFileHashMutation,
  importFindingsXlsxMutation
} from '@/features/findings/api/mutations';
import type { ImportBatchHashMatch } from '@/features/findings/api/import-core';
import { toUserMessage } from '@/lib/errors';
import { cn } from '@/lib/utils';

interface ImportXlsxSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MAX_SIZE_BYTES = 10 * 1024 * 1024;

/** Same bytes → same hash; keeps the client and the server comparable. */
async function sha256Hex(buffer: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * XLSX import sheet (D18): upload the SILAHAP export, the server action
 * upserts it in one transaction and returns a per-batch summary. The result
 * panel stays open so the operator can read skipped/failed rows. A duplicate
 * file hash shows an inline warning only — the import is never blocked.
 */
export function ImportXlsxSheet({ open, onOpenChange }: ImportXlsxSheetProps) {
  const [file, setFile] = React.useState<File | null>(null);
  const [duplicateBatch, setDuplicateBatch] = React.useState<ImportBatchHashMatch | null>(null);

  const hashCheck = useMutation({ ...checkImportFileHashMutation });

  const mutation = useMutation({
    ...importFindingsXlsxMutation,
    onSuccess: (summary) => {
      setFile(null);
      setDuplicateBatch(null);
      toast.success(
        `Impor selesai: ${summary.created} baru, ${summary.updated} diperbarui, ${summary.unchanged} tidak berubah.`
      );
    },
    onError: (error) => toast.error(toUserMessage(error))
  });

  const summary = mutation.data;

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null;
    if (selected && selected.size > MAX_SIZE_BYTES) {
      toast.error('Ukuran berkas melebihi 10 MB.');
      event.target.value = '';
      setFile(null);
      setDuplicateBatch(null);
      return;
    }
    setFile(selected);
    setDuplicateBatch(null);
    if (!selected) return;

    // Cheap preflight: hash locally (no upload) and ask the server whether
    // an import batch with these exact bytes already exists.
    try {
      const fileHash = await sha256Hex(await selected.arrayBuffer());
      const matched = await hashCheck.mutateAsync(fileHash);
      setDuplicateBatch(matched ?? null);
    } catch (error) {
      // A failed preflight must not block the import — just skip the warning.
      console.error(error);
      setDuplicateBatch(null);
    }
  };

  const reset = () => {
    setFile(null);
    setDuplicateBatch(null);
    hashCheck.reset();
    mutation.reset();
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <SheetContent className='flex flex-col sm:max-w-xl'>
        <SheetHeader>
          <SheetTitle>Impor XLSX SILAHAP</SheetTitle>
          <SheetDescription>
            Baris dicocokkan dengan identitas NoSatker + Tahun + Kode Temuan + Kode Rekomendasi.
            Hanya kolom resmi SILAHAP yang diperbarui; komentar dan lampiran tidak tersentuh.
          </SheetDescription>
        </SheetHeader>

        <div className='flex-1 space-y-4 overflow-auto p-4'>
          <div className='flex flex-col gap-2'>
            <label htmlFor='import-xlsx-file' className='text-sm font-medium'>
              Berkas ekspor (.xlsx / .xls, maks 10 MB)
            </label>
            <input
              id='import-xlsx-file'
              type='file'
              accept='.xlsx,.xls'
              aria-label='Pilih berkas XLSX untuk diimpor'
              className={cn(
                'file:bg-muted file:text-foreground hover:file:bg-muted/80 rounded-md border p-2 text-sm file:mr-3 file:rounded-md file:border-0 file:px-3 file:py-1.5'
              )}
              onChange={(event) => {
                void handleFileChange(event);
              }}
            />
            {file && (
              <p className='text-muted-foreground text-xs'>
                {file.name} · {(file.size / 1024).toFixed(0)} KB
              </p>
            )}
            {duplicateBatch && (
              <p
                role='status'
                className='bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/40 dark:border-amber-900 dark:text-amber-200 rounded-md border px-3 py-2 text-xs'
              >
                Berkas ini identik dengan batch{' '}
                <span className='font-mono'>{duplicateBatch.id.slice(0, 8)}</span> (
                {duplicateBatch.fileName}, oleh {duplicateBatch.uploadedByEmail}). Periksa apakah
                ini memang revisi terbaru sebelum menjalankan impor.
              </p>
            )}
          </div>

          {summary && (
            <div className='rounded-lg border p-3'>
              <h3 className='text-sm font-medium'>Ringkasan impor</h3>
              <dl className='mt-2 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4'>
                <div>
                  <dt className='text-muted-foreground text-xs'>Total baris</dt>
                  <dd className='font-medium tabular-nums'>{summary.rowsTotal}</dd>
                </div>
                <div>
                  <dt className='text-muted-foreground text-xs'>Baru</dt>
                  <dd className='font-medium tabular-nums'>{summary.created}</dd>
                </div>
                <div>
                  <dt className='text-muted-foreground text-xs'>Diperbarui</dt>
                  <dd className='font-medium tabular-nums'>{summary.updated}</dd>
                </div>
                <div>
                  <dt className='text-muted-foreground text-xs'>Gagal / dilewati</dt>
                  <dd className='font-medium tabular-nums'>
                    {summary.failed + summary.skipped.length}
                  </dd>
                </div>
              </dl>

              {summary.staleActiveRows > 0 && (
                <p className='bg-muted text-muted-foreground mt-3 rounded-md px-3 py-2 text-xs'>
                  {summary.staleActiveRows} temuan aktif tidak ditemukan pada berkas ini. Mereka
                  tidak dihapus — periksa apakah memang sudah tidak ada di SILAHAP.
                </p>
              )}

              {summary.skipped.length > 0 && (
                <div className='mt-3'>
                  <h4 className='text-sm font-medium'>Baris dilewati</h4>
                  <ul className='text-muted-foreground mt-1 max-h-40 list-disc space-y-0.5 overflow-y-auto pl-4 text-xs'>
                    {summary.skipped.slice(0, 20).map((row) => (
                      <li key={`${row.rowNumber}-${row.reason}`}>
                        Baris {row.rowNumber}: {row.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <p className='text-muted-foreground mt-2 text-xs'>
                Batch <span className='font-mono'>{summary.batchId.slice(0, 8)}</span> · status{' '}
                {summary.status}
              </p>
            </div>
          )}
        </div>

        <SheetFooter>
          <LoadingButton
            loading={mutation.isPending}
            disabled={!file || mutation.isPending}
            onClick={() => {
              if (!file) return;
              const formData = new FormData();
              formData.append('file', file);
              mutation.mutate(formData);
            }}
          >
            <Icons.upload className='size-4' />
            Jalankan impor
          </LoadingButton>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Tutup
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
