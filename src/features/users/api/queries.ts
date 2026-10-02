import { queryOptions } from '@tanstack/react-query';

import { getUsers } from './service';
import type { UserFilters } from './types';

export const userKeys = {
  all: ['users'] as const,
  list: (filters: UserFilters) => [...userKeys.all, 'list', filters] as const
};

export const usersQueryOptions = (filters: UserFilters) =>
  queryOptions({
    queryKey: userKeys.list(filters),
    queryFn: () => getUsers(filters)
  });
