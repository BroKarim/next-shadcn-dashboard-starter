'use client';

import * as React from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Icons } from '@/components/icons';
import { LoadingButton } from '@/components/ui/loading-button';
import { toUserMessage } from '@/lib/errors';
import { importFindingsMutation } from '../api/mutations';

export function ImportFindingsButton() {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const mutation = useMutation({
    ...importFindingsMutation,
    onSuccess: (summary) => {
      const detail = `${summary.created} baru · ${summary.updated} diperbarui · ${summary.unchanged} tetap`;
      toast.success(`Impor ${summary.fileName} selesai. ${detail}`, {
        description:
          summary.failed > 0 || summary.skipped.length > 0
            ? `${summary.failed + summary.skipped.length} baris perlu diperiksa.`
            : undefined
      });
    },
    onError: (error) => toast.error(toUserMessage(error))
  });

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    mutation.mutate(formData);
  }

  return (
    <>
      <input
        ref={inputRef}
        type='file'
        accept='.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        className='hidden'
        aria-label='Pilih berkas impor XLSX'
        onChange={handleFileChange}
      />
      <LoadingButton
        variant='outline'
        loading={mutation.isPending}
        onClick={() => inputRef.current?.click()}
        title='Impor data temuan dari XLSX'
      >
        <Icons.upload className='size-4' />
        Impor XLSX
      </LoadingButton>
    </>
  );
}
