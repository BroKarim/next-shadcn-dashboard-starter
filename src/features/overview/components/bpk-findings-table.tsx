'use client';

import * as React from 'react';
import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import {
  parseAsBoolean,
  parseAsInteger,
  parseAsString,
  debounce,
  useQueryState,
  useQueryStates
} from 'nuqs';
import { flexRender, type ColumnDef, type Row } from '@tanstack/react-table';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Icons } from '@/components/icons';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle
} from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { DataTablePagination } from '@/components/ui/table/data-table-pagination';
import { useDataTable } from '@/hooks/use-data-table';
import {
  findingActivitiesOptions,
  findingFilterOptionsQueryOptions,
  findingsQueryOptions
} from '@/features/findings/api/queries';
import {
  restoreFindingMutation,
  softDeleteFindingMutation
} from '@/features/findings/api/mutations';
import { toUserMessage } from '@/lib/errors';
import {
  FINDING_STATUSES,
  type Activity,
  type Finding,
  type FindingFilters
} from '@/features/findings/api/types';
import { formatDateTime, formatRupiah } from '@/features/findings/utils/format';
import { cn } from '@/lib/utils';
import Link from 'next/link';

import { StatusBadge } from './bpk-status-badge';
import { BpkTableSkeleton } from './bpk-overview-skeletons';
import { FindingFormSheet } from './finding-form-sheet';
import { ImportXlsxSheet } from './import-xlsx-sheet';

const ALL_VALUE = 'all';
const FILTER_DEBOUNCE_MS = 400;

function FilterField({
  label,
  htmlFor,
  children
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className='flex flex-col gap-1.5'>
      <Label htmlFor={htmlFor} className='text-xs font-medium'>
        {label}
      </Label>
      {children}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className='flex flex-col gap-0.5'>
      <dt className='text-muted-foreground text-xs'>{label}</dt>
      <dd className='text-sm font-medium break-words'>{value}</dd>
    </div>
  );
}

function DrawerActivityItem({ activity }: { activity: Activity }) {
  return (
    <li className='flex flex-col gap-0.5 border-b pb-3 last:border-b-0 last:pb-0'>
      <div className='flex items-start justify-between gap-2'>
        <span className='text-sm font-medium'>{activity.action}</span>
        <span className='text-muted-foreground text-xs whitespace-nowrap tabular-nums'>
          {formatDateTime(activity.occurredAt)}
        </span>
      </div>
      <span className='text-muted-foreground truncate text-xs'>{activity.actorEmail}</span>
    </li>
  );
}

/** Table body, pagination and drawer — the only region that re-suspends on filter changes. */
function FindingsTableResult({
  filters,
  canManage,
  canRestore
}: {
  filters: FindingFilters;
  canManage: boolean;
  canRestore: boolean;
}) {
  const { data } = useSuspenseQuery(findingsQueryOptions(filters));
  const [selectedFinding, setSelectedFinding] = React.useState<Finding | null>(null);
  const [editingFinding, setEditingFinding] = React.useState<Finding | null>(null);
  const [deletingFinding, setDeletingFinding] = React.useState<Finding | null>(null);

  const deleteMutation = useMutation({
    ...softDeleteFindingMutation,
    onSuccess: () => {
      toast.success('Temuan dihapus (soft delete).');
      setDeletingFinding(null);
    },
    onError: (error) => toast.error(toUserMessage(error))
  });

  const restoreMutation = useMutation({
    ...restoreFindingMutation,
    onSuccess: () => toast.success('Temuan dipulihkan.'),
    onError: (error) => toast.error(toUserMessage(error))
  });

  const { data: relatedActivities } = useQuery({
    ...findingActivitiesOptions(selectedFinding ? selectedFinding.id : '', 3),
    enabled: selectedFinding !== null
  });

  const openFinding = React.useCallback((finding: Finding) => {
    setSelectedFinding(finding);
  }, []);

  const columns = React.useMemo<ColumnDef<Finding>[]>(
    () => [
      {
        accessorKey: 'kodeDisplay',
        header: 'ID',
        cell: ({ row }) => (
          <span className='font-medium whitespace-nowrap'>{row.original.kodeDisplay}</span>
        )
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <div className='flex items-center gap-1.5'>
            <StatusBadge status={row.original.status} />
            {row.original.deletedAt !== null && (
              <Badge variant='outline' className='text-muted-foreground'>
                Terhapus
              </Badge>
            )}
          </div>
        )
      },
      {
        accessorKey: 'tahun',
        header: 'Tahun',
        cell: ({ row }) => <span className='tabular-nums'>{row.original.tahun}</span>
      },
      {
        accessorKey: 'kodeTemuan',
        header: 'Kode Temuan',
        cell: ({ row }) => <span className='whitespace-nowrap'>{row.original.kodeTemuan}</span>
      },
      {
        accessorKey: 'kodeRekomendasi',
        header: 'Kode Rekomendasi',
        cell: ({ row }) => <span className='whitespace-nowrap'>{row.original.kodeRekomendasi}</span>
      },
      {
        accessorKey: 'judulPemeriksaan',
        header: 'Judul Pemeriksaan',
        cell: ({ row }) => (
          <span className='block min-w-[16rem]'>{row.original.judulPemeriksaan}</span>
        )
      },
      {
        accessorKey: 'nilaiTemuan',
        header: 'Nilai Temuan',
        cell: ({ row }) => (
          <span className='tabular-nums'>{formatRupiah(row.original.nilaiTemuan)}</span>
        )
      },
      {
        id: 'aksi',
        header: () => <span className='sr-only'>Aksi</span>,
        cell: ({ row }) => (
          <div className='flex items-center justify-end gap-1'>
            <Button
              variant='ghost'
              size='icon'
              className='size-8'
              aria-label={`Buka ringkasan temuan ${row.original.kodeDisplay}`}
              title='Ringkasan temuan'
              onClick={(event) => {
                event.stopPropagation();
                openFinding(row.original);
              }}
            >
              <Icons.eye className='size-4' />
            </Button>
            {canManage && row.original.deletedAt === null && (
              <Button
                variant='ghost'
                size='icon'
                className='size-8'
                aria-label={`Edit temuan ${row.original.kodeDisplay}`}
                title='Edit temuan'
                onClick={(event) => {
                  event.stopPropagation();
                  setEditingFinding(row.original);
                }}
              >
                <Icons.edit className='size-4' />
              </Button>
            )}
            {canManage && row.original.deletedAt === null && (
              <Button
                variant='ghost'
                size='icon'
                className='size-8 text-destructive'
                aria-label={`Hapus temuan ${row.original.kodeDisplay}`}
                title='Hapus temuan'
                onClick={(event) => {
                  event.stopPropagation();
                  setDeletingFinding(row.original);
                }}
              >
                <Icons.trash className='size-4' />
              </Button>
            )}
            {canRestore && row.original.deletedAt !== null && (
              <Button
                variant='outline'
                size='sm'
                disabled={restoreMutation.isPending}
                onClick={(event) => {
                  event.stopPropagation();
                  restoreMutation.mutate(row.original.kodeDisplay);
                }}
              >
                <Icons.restore className='size-4' />
                Pulihkan
              </Button>
            )}
            <Link
              href={`/dashboard/overview/temuan/${row.original.kodeDisplay}`}
              className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
            >
              Detail
            </Link>
          </div>
        )
      }
    ],
    [openFinding, canManage, canRestore, restoreMutation]
  );

  const table = useDataTable({
    data: data.items,
    columns,
    pageCount: data.pageCount,
    shallow: true,
    initialState: {
      columnPinning: { right: ['aksi'] }
    }
  }).table;

  return (
    <>
      <div className='rounded-lg border'>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    colSpan={header.colSpan}
                    className={cn(header.column.id === 'nilaiTemuan' && 'text-right')}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row: Row<Finding>) => (
                <TableRow
                  key={row.id}
                  className='cursor-pointer'
                  onClick={(event) => {
                    // Clicks inside the action cell (including the disabled
                    // detail placeholder) must not open the summary drawer.
                    if ((event.target as HTMLElement).closest('[data-row-action]')) return;
                    openFinding(row.original);
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      data-row-action={cell.column.id === 'aksi' ? '' : undefined}
                      className={cn(
                        cell.column.id === 'nilaiTemuan' && 'text-right font-medium tabular-nums'
                      )}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={table.getVisibleLeafColumns().length}
                  className='text-muted-foreground h-24 text-center'
                >
                  Tidak ada temuan yang cocok dengan filter.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination table={table} />

      <Drawer
        open={selectedFinding !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedFinding(null);
        }}
        swipeDirection='right'
      >
        <DrawerContent aria-label='Ringkasan temuan'>
          {selectedFinding && (
            <>
              <DrawerHeader className='relative pr-12'>
                <DrawerTitle>{selectedFinding.judulPemeriksaan}</DrawerTitle>
                <DrawerDescription>
                  Temuan {selectedFinding.kodeDisplay} · {selectedFinding.noSatker}
                </DrawerDescription>
                <DrawerClose
                  render={
                    <Button
                      variant='ghost'
                      size='icon'
                      className='absolute top-3 right-3 size-8'
                      aria-label='Tutup ringkasan temuan'
                      title='Tutup'
                    />
                  }
                >
                  <Icons.close className='size-4' />
                </DrawerClose>
              </DrawerHeader>

              <div className='min-h-0 flex-1 overflow-y-auto px-4 py-4'>
                <div className='flex flex-wrap items-center gap-2'>
                  <StatusBadge status={selectedFinding.status} />
                  <span className='text-muted-foreground text-sm tabular-nums'>
                    Tahun {selectedFinding.tahun}
                  </span>
                </div>

                <dl className='mt-4 grid grid-cols-2 gap-3'>
                  <DetailRow label='Kode Temuan' value={selectedFinding.kodeTemuan} />
                  <DetailRow label='Kode Rekomendasi' value={selectedFinding.kodeRekomendasi} />
                  <DetailRow
                    label='Nilai Temuan'
                    value={
                      <span className='tabular-nums'>
                        {formatRupiah(selectedFinding.nilaiTemuan)}
                      </span>
                    }
                  />
                  <DetailRow label='Unit Kerja' value={selectedFinding.unitKerja} />
                  <DetailRow
                    label='Update terakhir'
                    value={
                      <span className='tabular-nums'>
                        {formatDateTime(selectedFinding.tanggalTerakhirUpdate)}
                      </span>
                    }
                  />
                </dl>

                <div className='mt-4 flex flex-col gap-3'>
                  <div className='flex flex-col gap-1'>
                    <h3 className='text-sm font-medium'>Uraian Temuan</h3>
                    <p className='text-muted-foreground text-sm leading-relaxed'>
                      {selectedFinding.uraianTemuan}
                    </p>
                  </div>
                  <div className='flex flex-col gap-1'>
                    <h3 className='text-sm font-medium'>Tindak Lanjut Terakhir</h3>
                    <p className='text-muted-foreground text-sm leading-relaxed'>
                      {selectedFinding.deskripsiTindakLanjut}
                    </p>
                  </div>
                  {selectedFinding.alasanDitolak && (
                    <div className='flex flex-col gap-1'>
                      <h3 className='text-sm font-medium'>Alasan Tidak Dapat Ditindaklanjuti</h3>
                      <p className='text-muted-foreground text-sm leading-relaxed'>
                        {selectedFinding.alasanDitolak}
                      </p>
                    </div>
                  )}
                </div>

                <div className='mt-4 flex flex-col gap-2'>
                  <h3 className='text-sm font-medium'>Aktivitas Terkait</h3>
                  {relatedActivities && relatedActivities.length > 0 ? (
                    <ul className='flex flex-col gap-3'>
                      {relatedActivities.map((activity) => (
                        <DrawerActivityItem key={activity.id} activity={activity} />
                      ))}
                    </ul>
                  ) : (
                    <p className='text-muted-foreground text-sm'>
                      Belum ada aktivitas admin untuk temuan ini.
                    </p>
                  )}
                </div>
              </div>

              <DrawerFooter>
                <Link
                  href={`/dashboard/overview/temuan/${selectedFinding.kodeDisplay}`}
                  className={cn(buttonVariants({ variant: 'outline' }))}
                >
                  Lihat Detail
                </Link>
              </DrawerFooter>
            </>
          )}
        </DrawerContent>
      </Drawer>

      {canManage && (
        <FindingFormSheet
          finding={editingFinding ?? undefined}
          open={editingFinding !== null}
          onOpenChange={(open) => {
            if (!open) setEditingFinding(null);
          }}
        />
      )}

      <AlertDialog
        open={deletingFinding !== null}
        onOpenChange={(open) => {
          if (!open) setDeletingFinding(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus temuan {deletingFinding?.kodeDisplay}?</AlertDialogTitle>
            <AlertDialogDescription>
              Temuan tidak dihapus permanen: baris disembunyikan dari daftar, KPI, dan grafik, serta
              dapat dipulihkan oleh admin. Aksi ini tercatat pada Riwayat Aktivitas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Batal</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (deletingFinding) deleteMutation.mutate(deletingFinding.kodeDisplay);
              }}
            >
              <Icons.trash className='size-4' />
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/**
 * "Daftar Temuan" card: filter state lives in the URL (nuqs), data comes from
 * the server via React Query. Filter changes only re-suspend the table area,
 * so the card chrome and the filter inputs stay mounted (task_plan.md §7).
 */
export function BpkFindingsTable({
  canManage,
  canRestore
}: {
  canManage: boolean;
  canRestore: boolean;
}) {
  const [formOpen, setFormOpen] = React.useState(false);
  const [importOpen, setImportOpen] = React.useState(false);
  const [params, setParams] = useQueryStates({
    q: parseAsString.withOptions({ limitUrlUpdates: debounce(FILTER_DEBOUNCE_MS) }),
    status: parseAsString,
    tahun: parseAsInteger,
    kodeTemuan: parseAsString,
    kodeRekomendasi: parseAsString,
    judul: parseAsString.withOptions({ limitUrlUpdates: debounce(FILTER_DEBOUNCE_MS) })
  });
  // Same URL keys the data-table hook manages — page resets on filter change
  // propagate through the shared param.
  const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1));
  const [perPage] = useQueryState('perPage', parseAsInteger.withDefault(10));
  // Admin-only: include soft-deleted rows (server re-checks via requireRole).
  const [includeDeleted, setIncludeDeleted] = useQueryState(
    'includeDeleted',
    parseAsBoolean.withDefault(false)
  );
  // Distinct years/codes straight from the database (Phase 8 cleanup);
  // prefetched server-side, refreshed by `findingKeys.all` invalidations.
  const { data: filterOptions } = useQuery(findingFilterOptionsQueryOptions());

  const filters: FindingFilters = React.useMemo(
    () => ({
      page,
      perPage,
      ...(params.q && { q: params.q }),
      ...(params.status && { status: params.status as Finding['status'] }),
      ...(params.tahun && { tahun: params.tahun }),
      ...(params.kodeTemuan && { kodeTemuan: params.kodeTemuan }),
      ...(params.kodeRekomendasi && { kodeRekomendasi: params.kodeRekomendasi }),
      ...(params.judul && { judul: params.judul }),
      ...(includeDeleted && { includeDeleted: true })
    }),
    [params, page, perPage, includeDeleted]
  );

  // Every filter change returns to the first page (contract from Phase 3).
  const setFilter = React.useCallback(
    <K extends 'q' | 'status' | 'tahun' | 'kodeTemuan' | 'kodeRekomendasi' | 'judul'>(
      key: K,
      value: (typeof params)[K]
    ) => {
      void setPage(1);
      void setParams({ [key]: value } as never);
    },
    [setPage, setParams]
  );

  const tableArea = (
    <React.Suspense fallback={<BpkTableSkeleton />}>
      <FindingsTableResult filters={filters} canManage={canManage} canRestore={canRestore} />
    </React.Suspense>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daftar Temuan</CardTitle>
        <CardDescription>Klik baris untuk melihat ringkasan temuan</CardDescription>
        <CardAction className='flex flex-wrap items-center justify-end gap-2'>
          {canRestore && (
            <div className='text-muted-foreground flex items-center gap-2 text-xs'>
              <Switch
                aria-label='Tampilkan temuan yang dihapus'
                checked={includeDeleted}
                onCheckedChange={(checked) => {
                  void setIncludeDeleted(checked);
                }}
              />
              Tampilkan yang dihapus
            </div>
          )}
          <Button
            variant='outline'
            size='sm'
            disabled={!canManage}
            title={
              canManage
                ? 'Impor temuan dari ekspor XLSX SILAHAP.'
                : 'Aksi pengelolaan temuan memerlukan hak akses editor atau admin.'
            }
            onClick={() => setImportOpen(true)}
          >
            <Icons.fileTypeXls className='size-4' />
            Impor XLSX
          </Button>
          <Button
            size='sm'
            disabled={!canManage}
            title={
              canManage
                ? 'Tambah temuan secara manual.'
                : 'Aksi pengelolaan temuan memerlukan hak akses editor atau admin.'
            }
            onClick={() => setFormOpen(true)}
          >
            <Icons.add className='size-4' />
            Tambah Temuan
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className='flex flex-col gap-4'>
        <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'>
          <FilterField label='Cari ID / kode' htmlFor='bpk-filter-search'>
            <Input
              id='bpk-filter-search'
              value={params.q ?? ''}
              placeholder='ID, kode temuan, kode rekomendasi'
              onChange={(event) => setFilter('q', event.target.value || null)}
              aria-describedby='bpk-filter-search-hint'
            />
          </FilterField>

          <FilterField label='Status' htmlFor='bpk-filter-status'>
            <div className='flex'>
              <Select
                items={[
                  { value: ALL_VALUE, label: 'Semua status' },
                  ...FINDING_STATUSES.map((status) => ({ value: status, label: status }))
                ]}
                value={params.status ?? ALL_VALUE}
                onValueChange={(value) =>
                  setFilter('status', !value || value === ALL_VALUE ? null : value)
                }
              >
                <SelectTrigger id='bpk-filter-status' className='w-full flex-1 justify-start'>
                  <SelectValue placeholder='Semua status' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>Semua status</SelectItem>
                  {FINDING_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </FilterField>

          <FilterField label='Tahun' htmlFor='bpk-filter-tahun'>
            <div className='flex'>
              <Select
                items={[
                  { value: ALL_VALUE, label: 'Semua tahun' },
                  ...(filterOptions?.tahun ?? []).map((tahun) => ({
                    value: `${tahun}`,
                    label: `${tahun}`
                  }))
                ]}
                value={params.tahun ? `${params.tahun}` : ALL_VALUE}
                onValueChange={(value) =>
                  setFilter('tahun', !value || value === ALL_VALUE ? null : Number(value))
                }
              >
                <SelectTrigger id='bpk-filter-tahun' className='w-full flex-1 justify-start'>
                  <SelectValue placeholder='Semua tahun' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>Semua tahun</SelectItem>
                  {(filterOptions?.tahun ?? []).map((tahun) => (
                    <SelectItem key={tahun} value={`${tahun}`}>
                      {tahun}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </FilterField>

          <FilterField label='Kode Temuan' htmlFor='bpk-filter-kode-temuan'>
            <div className='flex'>
              <Select
                items={[
                  { value: ALL_VALUE, label: 'Semua kode' },
                  ...(filterOptions?.kodeTemuan ?? []).map((kode) => ({ value: kode, label: kode }))
                ]}
                value={params.kodeTemuan ?? ALL_VALUE}
                onValueChange={(value) =>
                  setFilter('kodeTemuan', !value || value === ALL_VALUE ? null : value)
                }
              >
                <SelectTrigger id='bpk-filter-kode-temuan' className='w-full flex-1 justify-start'>
                  <SelectValue placeholder='Semua kode' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>Semua kode</SelectItem>
                  {(filterOptions?.kodeTemuan ?? []).map((kode) => (
                    <SelectItem key={kode} value={kode}>
                      {kode}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </FilterField>

          <FilterField label='Kode Rekomendasi' htmlFor='bpk-filter-kode-rekomendasi'>
            <div className='flex'>
              <Select
                items={[
                  { value: ALL_VALUE, label: 'Semua kode' },
                  ...(filterOptions?.kodeRekomendasi ?? []).map((kode) => ({
                    value: kode,
                    label: kode
                  }))
                ]}
                value={params.kodeRekomendasi ?? ALL_VALUE}
                onValueChange={(value) =>
                  setFilter('kodeRekomendasi', !value || value === ALL_VALUE ? null : value)
                }
              >
                <SelectTrigger
                  id='bpk-filter-kode-rekomendasi'
                  className='w-full flex-1 justify-start'
                >
                  <SelectValue placeholder='Semua kode' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>Semua kode</SelectItem>
                  {(filterOptions?.kodeRekomendasi ?? []).map((kode) => (
                    <SelectItem key={kode} value={kode}>
                      {kode}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </FilterField>

          <FilterField label='Judul Pemeriksaan' htmlFor='bpk-filter-judul'>
            <Input
              id='bpk-filter-judul'
              value={params.judul ?? ''}
              placeholder='Cari judul pemeriksaan'
              onChange={(event) => setFilter('judul', event.target.value || null)}
            />
          </FilterField>
        </div>

        {tableArea}
      </CardContent>

      {canManage && <FindingFormSheet open={formOpen} onOpenChange={setFormOpen} />}
      {canManage && <ImportXlsxSheet open={importOpen} onOpenChange={setImportOpen} />}
    </Card>
  );
}
