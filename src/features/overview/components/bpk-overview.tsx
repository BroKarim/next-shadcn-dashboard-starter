'use client';

import * as React from 'react';
import { Bar, BarChart, XAxis } from 'recharts';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type Row
} from '@tanstack/react-table';

import { Icons, type Icon } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig
} from '@/components/ui/chart';
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
import { cn } from '@/lib/utils';
import {
  BPK_ADMIN_ACTIVITIES,
  BPK_FINDINGS,
  BPK_KODE_REKOMENDASI,
  BPK_KODE_TEMUAN,
  BPK_STATUSES,
  BPK_YEARS,
  formatDateTime,
  formatRupiah,
  getActivitiesForFinding,
  getFindingsByYear,
  getOverviewMetrics,
  getStatusPriority,
  type AdminActivity,
  type BpkFinding,
  type BpkOverviewMetric,
  type BpkStatus
} from './bpk-overview-data';

/**
 * Permission seam for finding mutations. The overview is still dummy-data
 * driven, so the manage actions stay disabled; when the RBAC work lands
 * (task_plan.md Phase 5) this is replaced by the real server/client role check.
 */
const canManageFindings = false;

const MANAGE_ACTIONS_DISABLED_REASON =
  'Aksi pengelolaan temuan memerlukan hak akses yang belum disiapkan pada tahap ini.';

const METRIC_ICONS: Record<BpkOverviewMetric['key'], Icon> = {
  total: Icons.page,
  sesuai: Icons.badgeCheck,
  belumSesuai: Icons.warning,
  belumDitindaklanjuti: Icons.alertCircle
};

const STATUS_BADGE_VARIANT: Record<BpkStatus, 'default' | 'secondary' | 'outline'> = {
  'Belum Ditindaklanjuti': 'default',
  'Belum Sesuai': 'outline',
  'Sudah Ditindaklanjuti': 'secondary',
  'Sesuai Rekomendasi': 'secondary',
  'Tidak Dapat Ditindaklanjuti': 'outline'
};

const STATUS_BADGE_CLASS: Record<BpkStatus, string> = {
  'Belum Ditindaklanjuti': 'border-transparent',
  'Belum Sesuai': 'border-destructive/40 text-destructive',
  'Sudah Ditindaklanjuti': 'border-transparent',
  'Sesuai Rekomendasi': 'border-transparent',
  'Tidak Dapat Ditindaklanjuti': 'text-muted-foreground'
};

const ALL_VALUE = 'all';

const yearChartConfig = {
  jumlah: {
    label: 'Jumlah temuan',
    color: 'var(--chart-1)'
  }
} satisfies ChartConfig;

/** Hidden helper column ids used for filtering and the default sort. */
const HELPER_COLUMN_IDS = ['search', 'priority', 'updatedAt'] as const;

function StatusBadge({ status }: { status: BpkStatus }) {
  return (
    <Badge
      variant={STATUS_BADGE_VARIANT[status]}
      className={cn('gap-1.5', STATUS_BADGE_CLASS[status])}
    >
      <span aria-hidden='true' className='size-1.5 rounded-full bg-current' />
      {status}
    </Badge>
  );
}

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

function ActivityItem({ activity }: { activity: AdminActivity }) {
  return (
    <li className='flex flex-col gap-0.5 border-b pb-3 last:border-b-0 last:pb-0'>
      <div className='flex items-start justify-between gap-2'>
        <span className='text-sm font-medium'>{activity.action}</span>
        <span className='text-muted-foreground text-xs whitespace-nowrap tabular-nums'>
          {formatDateTime(activity.occurredAt)}
        </span>
      </div>
      <span className='text-muted-foreground truncate text-xs'>{activity.actorEmail}</span>
      {activity.findingId && (
        <span className='text-muted-foreground text-xs'>Temuan {activity.findingId}</span>
      )}
      {activity.detail && <span className='line-clamp-2 text-xs'>{activity.detail}</span>}
    </li>
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

export function BpkOverview() {
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [selectedFinding, setSelectedFinding] = React.useState<BpkFinding | null>(null);

  const metrics = React.useMemo(() => getOverviewMetrics(BPK_FINDINGS), []);
  const findingsByYear = React.useMemo(() => getFindingsByYear(BPK_FINDINGS), []);
  const latestActivities = React.useMemo(
    () => BPK_ADMIN_ACTIVITIES.toSorted((a, b) => (a.occurredAt < b.occurredAt ? 1 : -1)),
    []
  );
  const relatedActivities = React.useMemo(
    () =>
      selectedFinding ? getActivitiesForFinding(BPK_ADMIN_ACTIVITIES, selectedFinding.id) : [],
    [selectedFinding]
  );

  const openFinding = React.useCallback((finding: BpkFinding) => {
    setSelectedFinding(finding);
  }, []);

  const columns = React.useMemo<ColumnDef<BpkFinding>[]>(
    () => [
      {
        id: 'search',
        accessorFn: (row) => `${row.id} ${row.kodeTemuan} ${row.kodeRekomendasi}`,
        filterFn: 'includesString'
      },
      {
        id: 'priority',
        accessorFn: (row) => getStatusPriority(row.status)
      },
      {
        id: 'updatedAt',
        accessorFn: (row) => new Date(row.tanggalTerakhirUpdate).getTime()
      },
      {
        accessorKey: 'id',
        header: 'ID',
        cell: ({ row }) => <span className='font-medium whitespace-nowrap'>{row.original.id}</span>
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} />
      },
      {
        accessorKey: 'tahun',
        header: 'Tahun',
        // Tahun is numeric, but the filter value comes from a Select as a string;
        // the default 'auto' filterFn for numbers is `inNumberRange` and expects a
        // [min, max] tuple, so compare stringified values explicitly.
        filterFn: (row, columnId, filterValue: string) =>
          String(row.getValue(columnId)) === String(filterValue),
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
              aria-label={`Buka ringkasan temuan ${row.original.id}`}
              title='Ringkasan temuan'
              onClick={(event) => {
                event.stopPropagation();
                openFinding(row.original);
              }}
            >
              <Icons.eye className='size-4' />
            </Button>
            {/* Placeholder: the detail route (/dashboard/overview/temuan/[id]) is Phase 4. */}
            <Button
              variant='outline'
              size='sm'
              disabled
              title='Halaman detail temuan dikerjakan pada fase berikutnya.'
            >
              Detail
            </Button>
          </div>
        )
      }
    ],
    [openFinding]
  );

  const table = useReactTable({
    data: BPK_FINDINGS,
    columns,
    getRowId: (row) => row.id,
    state: { columnFilters },
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      pagination: { pageSize: 10 },
      columnVisibility: Object.fromEntries(HELPER_COLUMN_IDS.map((id) => [id, false])),
      sorting: [
        { id: 'priority', desc: false },
        { id: 'updatedAt', desc: false }
      ]
    }
  });

  const setFilter = React.useCallback(
    (id: string, value: string | undefined) => {
      setColumnFilters((filters) => {
        const withoutCurrent = filters.filter((filter) => filter.id !== id);
        return value ? [...withoutCurrent, { id, value }] : withoutCurrent;
      });
      table.setPageIndex(0);
    },
    [table]
  );

  const filterValue = (id: string) => (table.getColumn(id)?.getFilterValue() as string) ?? '';

  return (
    <div className='flex flex-1 flex-col gap-4'>
      <div className='*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs md:grid-cols-2 lg:grid-cols-4'>
        {metrics.map((metric) => {
          const MetricIcon = METRIC_ICONS[metric.key];

          return (
            <Card key={metric.key} className='@container/card'>
              <CardHeader>
                <CardDescription>{metric.label}</CardDescription>
                <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                  {metric.count}
                </CardTitle>
                <CardAction>
                  <div className='bg-muted text-muted-foreground rounded-md p-1.5'>
                    <MetricIcon className='size-4' />
                  </div>
                </CardAction>
              </CardHeader>
              <CardFooter className='flex-col items-start gap-1.5 text-sm'>
                <div className='line-clamp-1 font-medium tabular-nums'>
                  {formatRupiah(metric.totalNilai)}
                </div>
                <div className='text-muted-foreground'>Total nilai temuan</div>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <div className='grid grid-cols-1 gap-4 lg:grid-cols-4'>
        <Card className='lg:col-span-3'>
          <CardHeader>
            <CardTitle>Temuan per Tahun</CardTitle>
            <CardDescription>Jumlah temuan berdasarkan tahun pemeriksaan</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={yearChartConfig}
              className='aspect-auto h-56 w-full md:h-64'
              role='img'
              aria-label='Grafik batang jumlah temuan per tahun pemeriksaan'
            >
              <BarChart accessibilityLayer data={findingsByYear}>
                <XAxis dataKey='tahun' tickLine={false} tickMargin={10} axisLine={false} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator='dashed' />} />
                <Bar dataKey='jumlah' fill='var(--color-jumlah)' radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className='flex flex-col lg:col-span-1'>
          <CardHeader>
            <CardTitle>Aktivitas Admin</CardTitle>
            <CardDescription>Riwayat perubahan data temuan</CardDescription>
          </CardHeader>
          <CardContent className='min-h-0 flex-1'>
            <ul className='flex max-h-56 flex-col gap-3 overflow-y-auto pr-1 [scrollbar-width:none] md:max-h-64 [&::-webkit-scrollbar]:hidden'>
              {latestActivities.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Temuan</CardTitle>
          <CardDescription>Klik baris untuk melihat ringkasan temuan</CardDescription>
          <CardAction className='flex flex-wrap items-center justify-end gap-2'>
            <Button
              variant='outline'
              size='sm'
              disabled={!canManageFindings}
              title={MANAGE_ACTIONS_DISABLED_REASON}
            >
              <Icons.fileTypeXls className='size-4' />
              Impor XLSX
            </Button>
            <Button size='sm' disabled={!canManageFindings} title={MANAGE_ACTIONS_DISABLED_REASON}>
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
                value={filterValue('search')}
                placeholder='ID, kode temuan, kode rekomendasi'
                onChange={(event) => setFilter('search', event.target.value || undefined)}
              />
            </FilterField>

            <FilterField label='Status' htmlFor='bpk-filter-status'>
              <div className='flex'>
                <Select
                  items={[
                    { value: ALL_VALUE, label: 'Semua status' },
                    ...BPK_STATUSES.map((status) => ({ value: status, label: status }))
                  ]}
                  value={filterValue('status') || ALL_VALUE}
                  onValueChange={(value) =>
                    setFilter('status', !value || value === ALL_VALUE ? undefined : value)
                  }
                >
                  <SelectTrigger id='bpk-filter-status' className='w-full flex-1 justify-start'>
                    <SelectValue placeholder='Semua status' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_VALUE}>Semua status</SelectItem>
                    {BPK_STATUSES.map((status) => (
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
                    ...BPK_YEARS.map((tahun) => ({ value: `${tahun}`, label: `${tahun}` }))
                  ]}
                  value={filterValue('tahun') || ALL_VALUE}
                  onValueChange={(value) =>
                    setFilter('tahun', !value || value === ALL_VALUE ? undefined : value)
                  }
                >
                  <SelectTrigger id='bpk-filter-tahun' className='w-full flex-1 justify-start'>
                    <SelectValue placeholder='Semua tahun' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_VALUE}>Semua tahun</SelectItem>
                    {BPK_YEARS.map((tahun) => (
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
                    ...BPK_KODE_TEMUAN.map((kode) => ({ value: kode, label: kode }))
                  ]}
                  value={filterValue('kodeTemuan') || ALL_VALUE}
                  onValueChange={(value) =>
                    setFilter('kodeTemuan', !value || value === ALL_VALUE ? undefined : value)
                  }
                >
                  <SelectTrigger
                    id='bpk-filter-kode-temuan'
                    className='w-full flex-1 justify-start'
                  >
                    <SelectValue placeholder='Semua kode' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_VALUE}>Semua kode</SelectItem>
                    {BPK_KODE_TEMUAN.map((kode) => (
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
                    ...BPK_KODE_REKOMENDASI.map((kode) => ({ value: kode, label: kode }))
                  ]}
                  value={filterValue('kodeRekomendasi') || ALL_VALUE}
                  onValueChange={(value) =>
                    setFilter('kodeRekomendasi', !value || value === ALL_VALUE ? undefined : value)
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
                    {BPK_KODE_REKOMENDASI.map((kode) => (
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
                value={filterValue('judulPemeriksaan')}
                placeholder='Cari judul pemeriksaan'
                onChange={(event) => setFilter('judulPemeriksaan', event.target.value || undefined)}
              />
            </FilterField>
          </div>

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
                  table.getRowModel().rows.map((row: Row<BpkFinding>) => (
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
                            cell.column.id === 'nilaiTemuan' &&
                              'text-right font-medium tabular-nums'
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
        </CardContent>
      </Card>

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
                  Temuan {selectedFinding.id} · {selectedFinding.noSatker}
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
                  <DetailRow label='PIC' value={selectedFinding.pic} />
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
                  {relatedActivities.length > 0 ? (
                    <ul className='flex flex-col gap-3'>
                      {relatedActivities.map((activity) => (
                        <ActivityItem key={activity.id} activity={activity} />
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
                {/* Placeholder: the detail route is implemented in Phase 4. */}
                <Button
                  variant='outline'
                  disabled
                  title='Halaman detail temuan dikerjakan pada fase berikutnya.'
                >
                  Lihat Detail
                </Button>
              </DrawerFooter>
            </>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
}
