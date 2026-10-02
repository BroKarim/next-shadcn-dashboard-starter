'use client';

import * as React from 'react';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { toast } from 'sonner';

import { FieldGroup } from '@/components/ui/field';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import { useAppForm } from '@/lib/form';
import { toUserMessage } from '@/lib/errors';
import { updateFindingValueMutation } from '@/features/findings/api/mutations';
import type { Finding } from '@/features/findings/api/types';

const findingValueSchema = z.object({
  nilaiTemuan: z.number('Nilai temuan wajib diisi.').min(0, 'Nilai temuan tidak boleh negatif.')
});

type FindingValueFormValues = z.input<typeof findingValueSchema>;

interface FindingFormSheetProps {
  finding: Finding;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function toFormValues(finding: Finding): FindingValueFormValues {
  return { nilaiTemuan: Number(finding.nilaiTemuan) };
}

/** Admin edit sheet: `nilaiTemuan` is deliberately the only editable field. */
export function FindingFormSheet({ finding, open, onOpenChange }: FindingFormSheetProps) {
  const updateMutation = useMutation({
    ...updateFindingValueMutation,
    onSuccess: (result) => {
      toast.success(result.changed ? 'Nilai temuan diperbarui.' : 'Tidak ada perubahan.');
      onOpenChange(false);
    },
    onError: (error) => toast.error(toUserMessage(error))
  });

  const form = useAppForm({
    defaultValues: toFormValues(finding),
    validators: { onSubmit: findingValueSchema },
    onSubmit: async ({ value }) => {
      await updateMutation.mutateAsync({
        kodeDisplay: finding.kodeDisplay,
        nilaiTemuan: value.nilaiTemuan
      });
    }
  });

  React.useEffect(() => {
    if (open) {
      form.reset(toFormValues(finding));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only on open/target change
  }, [open, finding.kodeDisplay]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='flex flex-col sm:max-w-md'>
        <SheetHeader>
          <SheetTitle>Edit Nilai Temuan {finding.kodeDisplay}</SheetTitle>
          <SheetDescription>
            Admin hanya dapat mengubah kolom Nilai Temuan. Perubahan dicatat pada Riwayat Aktivitas.
          </SheetDescription>
        </SheetHeader>

        <form
          className='flex-1 space-y-4 p-4'
          onSubmit={(event) => {
            event.preventDefault();
            form.handleSubmit();
          }}
        >
          <FieldGroup>
            <form.AppField
              name='nilaiTemuan'
              children={(field) => (
                <field.TextField
                  label='Nilai Temuan (Rp)'
                  type='number'
                  required
                  description='Angka rupiah penuh, tanpa titik atau koma.'
                />
              )}
            />
          </FieldGroup>

          <SheetFooter className='px-0'>
            <form.AppForm>
              <form.SubmitButton>Simpan Nilai Temuan</form.SubmitButton>
            </form.AppForm>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
