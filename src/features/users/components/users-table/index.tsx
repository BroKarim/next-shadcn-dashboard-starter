'use client';

import * as React from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';

import { DataTable } from '@/components/ui/table/data-table';
import { DataTableToolbar } from '@/components/ui/table/data-table-toolbar';
import { useDataTable } from '@/hooks/use-data-table';
import { getSortingStateParser } from '@/lib/parsers';
import type { AppRole } from '../../api/types';
import { usersQueryOptions } from '../../api/queries';
import { getUserColumns } from './columns';

interface UsersTableProps {
  currentUserId: string | null;
}

export function UsersTable({ currentUserId }: UsersTableProps) {
  const columns = React.useMemo(() => getUserColumns(currentUserId), [currentUserId]);
  const columnIds = columns.map((column) => column.id).filter(Boolean) as string[];
  const [params] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    perPage: parseAsInteger.withDefault(10),
    name: parseAsString,
    role: parseAsString,
    sort: getSortingStateParser(columnIds).withDefault([])
  });

  const filters = {
    page: params.page,
    perPage: params.perPage,
    ...(params.name && { search: params.name }),
    ...(params.role === 'user' || params.role === 'admin' ? { role: params.role as AppRole } : {}),
    ...(params.sort.length > 0 && { sort: JSON.stringify(params.sort) })
  };

  const { data } = useSuspenseQuery(usersQueryOptions(filters));
  const table = useDataTable({
    data: data.items,
    columns,
    pageCount: data.pageCount,
    shallow: true,
    debounceMs: 500,
    initialState: { columnPinning: { right: ['actions'] } }
  }).table;

  return (
    <DataTable table={table}>
      <DataTableToolbar table={table} />
    </DataTable>
  );
}

export function UsersTableSkeleton() {
  return (
    <div className='flex flex-1 animate-pulse flex-col gap-4'>
      <div className='bg-muted h-10 w-full rounded' />
      <div className='bg-muted h-96 w-full rounded-lg' />
      <div className='bg-muted h-10 w-full rounded' />
    </div>
  );
}
