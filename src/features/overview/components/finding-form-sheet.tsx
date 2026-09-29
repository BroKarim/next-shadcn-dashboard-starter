'use client';

import * as React from 'react';
import { useMutation } from '@tanstack/react-query';
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
import { createFindingMutation, updateFindingMutation } from '@/features/findings/api/mutations';
import { FINDING_STATUSES, type Finding } from '@/features/findings/api/types';
import { findingSchema, type FindingFormValues } from '@/features/findings/schemas/finding';

const STATUS_OPTIONS = FINDING_STATUSES.map((status) => ({ value: status, label: status }));

interface FindingFormSheetProps {
  finding?: Finding;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function toFormValues(finding?: Finding): FindingFormValues {
  return {
    noSatker: finding?.noSatker ?? '',
    tahun: finding?.tahun ?? new Date().getFullYear(),
    kodeTemuan: finding?.kodeTemuan ?? '',
    kodeRekomendasi: finding?.kodeRekomendasi ?? '',
    judulPemeriksaan: finding?.judulPemeriksaan ?? '',
    uraianTemuan: finding?.uraianTemuan ?? '',
    uraianRekomendasi: finding?.uraianRekomendasi ?? '',
    nilaiTemuan: finding ? Number(finding.nilaiTemuan) : 0,
    status: finding?.status ?? 'Belum Ditindaklanjuti',
    deskripsiTindakLanjut: finding?.deskripsiTindakLanjut ?? '',
    unitKerja: finding?.unitKerja ?? '',
    alasanDitolak: finding?.alasanDitolak ?? '',
    tanggalTindakLanjut: finding?.tanggalTindakLanjut ?? ''
  };
}

/**
 * Create/edit sheet for a finding. The server action re-validates and enforces
 * `requireRole('editor')`; the form only mirrors the same Zod schema.
 */
export function FindingFormSheet({ finding, open, onOpenChange }: FindingFormSheetProps) {
  const isEdit = finding !== undefined;

  const createMutation = useMutation({
    ...createFindingMutation,
    onSuccess: (result) => {
      toast.success(`Temuan ${result.kodeDisplay} dibuat.`);
      onOpenChange(false);
    },
    onError: (error) => toast.error(toUserMessage(error))
  });

  const updateMutation = useMutation({
    ...updateFindingMutation,
    onSuccess: (result) => {
      toast.success(result.changed ? 'Temuan diperbarui.' : 'Tidak ada perubahan.');
      onOpenChange(false);
    },
    onError: (error) => toast.error(toUserMessage(error))
  });

  const form = useAppForm({
    defaultValues: toFormValues(finding),
    validators: { onSubmit: findingSchema },
    onSubmit: async ({ value }) => {
      if (isEdit) {
        await updateMutation.mutateAsync({ kodeDisplay: finding.kodeDisplay, values: value });
      } else {
        await createMutation.mutateAsync(value);
      }
    }
  });

  // The sheet stays mounted while it toggles, so the fields must be rebuilt
  // whenever it opens for a different row (or for a fresh create).
  const findingKey = finding?.kodeDisplay ?? 'new';
  React.useEffect(() => {
    if (open) {
      form.reset(toFormValues(finding));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only on open/target change
  }, [open, findingKey]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='flex flex-col sm:max-w-xl'>
        <SheetHeader>
          <SheetTitle>{isEdit ? `Edit Temuan ${finding.kodeDisplay}` : 'Tambah Temuan'}</SheetTitle>
          <SheetDescription>
            {isEdit
              ? 'Perubahan dicatat pada Riwayat Aktivitas beserta nilai sebelum dan sesudahnya.'
              : 'Temuan baru mendapat kode tampilan otomatis dari sistem.'}
          </SheetDescription>
        </SheetHeader>

        <div className='flex-1 overflow-auto'>
          <form
            className='space-y-4 p-4'
            onSubmit={(event) => {
              event.preventDefault();
              form.handleSubmit();
            }}
          >
            <FieldGroup>
              <div className='grid grid-cols-2 gap-4'>
                <form.AppField
                  name='noSatker'
                  children={(field) => (
                    <field.TextField label='No Satker' required placeholder='USK-01' />
                  )}
                />
                <form.AppField
                  name='tahun'
                  children={(field) => (
                    <field.TextField label='Tahun' type='number' required placeholder='2024' />
                  )}
                />
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <form.AppField
                  name='kodeTemuan'
                  children={(field) => (
                    <field.TextField label='Kode Temuan' required placeholder='T-01' />
                  )}
                />
                <form.AppField
                  name='kodeRekomendasi'
                  children={(field) => (
                    <field.TextField label='Kode Rekomendasi' required placeholder='R-01' />
                  )}
                />
              </div>

              <form.AppField
                name='judulPemeriksaan'
                children={(field) => <field.TextField label='Judul Pemeriksaan' required />}
              />

              <form.AppField
                name='uraianTemuan'
                children={(field) => (
                  <field.TextareaField label='Uraian Temuan' required rows={3} />
                )}
              />

              <form.AppField
                name='uraianRekomendasi'
                children={(field) => (
                  <field.TextareaField label='Uraian Rekomendasi' required rows={3} />
                )}
              />

              <div className='grid grid-cols-2 gap-4'>
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
                <form.AppField
                  name='status'
                  children={(field) => (
                    <field.SelectField
                      label='Status Tindak Lanjut'
                      required
                      options={STATUS_OPTIONS}
                    />
                  )}
                />
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <form.AppField
                  name='unitKerja'
                  children={(field) => (
                    <field.TextField label='Unit Kerja' required placeholder='Biro Umum' />
                  )}
                />
                <form.AppField
                  name='tanggalTindakLanjut'
                  children={(field) => (
                    <field.TextField label='Tanggal Tindak Lanjut' type='date' />
                  )}
                />
              </div>

              <form.AppField
                name='deskripsiTindakLanjut'
                children={(field) => (
                  <field.TextareaField label='Deskripsi Tindak Lanjut' rows={2} />
                )}
              />

              <form.AppField
                name='alasanDitolak'
                children={(field) => (
                  <field.TextareaField
                    label='Alasan Tidak Dapat Ditindaklanjuti'
                    rows={2}
                    description='Isi hanya bila status Tidak Dapat Ditindaklanjuti.'
                  />
                )}
              />
            </FieldGroup>

            <SheetFooter className='px-0'>
              <form.SubmitButton>{isEdit ? 'Simpan Perubahan' : 'Simpan Temuan'}</form.SubmitButton>
            </SheetFooter>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
