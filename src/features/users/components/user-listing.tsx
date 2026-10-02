import { HydrationBoundary, dehydrate } from '@tanstack/react-query';

import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { usersQueryOptions } from '../api/queries';
import type { AppRole } from '../api/types';
import { UsersTable } from './users-table';

interface UserListingPageProps {
  currentUserId: string | null;
}

export default function UserListingPage({ currentUserId }: UserListingPageProps) {
  const page = searchParamsCache.get('page');
  const search = searchParamsCache.get('name');
  const pageLimit = searchParamsCache.get('perPage');
  const role = searchParamsCache.get('role');
  const sort = searchParamsCache.get('sort');
  const filters = {
    page,
    perPage: pageLimit,
    ...(search && { search }),
    ...(role === 'user' || role === 'admin' ? { role: role as AppRole } : {}),
    ...(sort && { sort })
  };

  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(usersQueryOptions(filters));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <UsersTable currentUserId={currentUserId} />
    </HydrationBoundary>
  );
}
