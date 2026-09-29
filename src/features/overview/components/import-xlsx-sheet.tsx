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
import { importFindingsXlsxMutation } from '@/features/findings/api/mutations';
import { toUserMessage } from '@/lib/errors';
import { cn } from '@/lib/utils';

interface ImportXlsxSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MAX_SIZE_BYTES = 10 * 1024 * 1024;

/**
 * XLSX import sheet (D18): upload the SILAHAP export, the server action
 * upserts it in one transaction and returns a per-batch summary. The result
 * panel stays open so the operator can read skipped/failed rows.
 */
export function ImportXlsxSheet({ open, onOpenChange }: ImportXlsxSheetProps) {
  const [file, setFile] = React.useState<File | null>(null);

  const mutation = useMutation({
    ...importFindingsXlsxMutation,
    onSuccess: (summary) => {
      setFile(null);
      toast.success(
        `Impor selesai: ${summary.created} baru, ${summary.updated} diperbarui, ${summary.unchanged} tidak berubah.`
      );
    },
    onError: (error) => toast.error(toUserMessage(error))
  });

  const summary = mutation.data;

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) mutation.reset();
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
                const selected = event.target.files?.[0] ?? null;
                if (selected && selected.size > MAX_SIZE_BYTES) {
                  toast.error('Ukuran berkas melebihi 10 MB.');
                  event.target.value = '';
                  setFile(null);
                  return;
                }
                setFile(selected);
              }}
            />
            {file && (
              <p className='text-muted-foreground text-xs'>
                {file.name} · {(file.size / 1024).toFixed(0)} KB
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
