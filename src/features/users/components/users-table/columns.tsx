import type { Column, ColumnDef } from '@tanstack/react-table';

import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { Icons } from '@/components/icons';
import type { User } from '../../api/types';
import { CellAction } from './cell-action';

const ROLE_OPTIONS = [
  { value: 'user', label: 'User' },
  { value: 'admin', label: 'Admin' }
];

export function getUserColumns(currentUserId: string | null): ColumnDef<User>[] {
  return [
    {
      id: 'name',
      accessorFn: (row) => row.name ?? row.email,
      header: ({ column }: { column: Column<User, unknown> }) => (
        <DataTableColumnHeader column={column} title='Nama' />
      ),
      cell: ({ row }) => (
        <div className='flex flex-col'>
          <span className='font-medium'>{row.original.name ?? '—'}</span>
          <span className='text-muted-foreground text-xs'>{row.original.email}</span>
        </div>
      ),
      meta: {
        label: 'Nama atau email',
        placeholder: 'Cari user...',
        variant: 'text' as const,
        icon: Icons.text
      },
      enableColumnFilter: true
    },
    {
      accessorKey: 'role',
      header: ({ column }: { column: Column<User, unknown> }) => (
        <DataTableColumnHeader column={column} title='Role' />
      ),
      cell: ({ cell }) => (
        <Badge variant={cell.getValue<User['role']>() === 'admin' ? 'default' : 'outline'}>
          {cell.getValue<User['role']>()}
        </Badge>
      ),
      meta: {
        label: 'Role',
        variant: 'multiSelect' as const,
        options: ROLE_OPTIONS
      },
      enableColumnFilter: true
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }: { column: Column<User, unknown> }) => (
        <DataTableColumnHeader column={column} title='Terdaftar' />
      ),
      cell: ({ row }) => (
        <span className='text-muted-foreground whitespace-nowrap tabular-nums'>
          {new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(
            new Date(row.original.createdAt)
          )}
        </span>
      )
    },
    {
      id: 'actions',
      cell: ({ row }) => <CellAction data={row.original} currentUserId={currentUserId} />
    }
  ];
}
