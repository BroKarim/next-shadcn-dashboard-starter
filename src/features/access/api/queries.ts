import { queryOptions } from '@tanstack/react-query';

import { listAppUsers } from './service';

export const accessKeys = {
  all: ['access'] as const,
  users: () => [...accessKeys.all, 'users'] as const
};

export const appUsersQueryOptions = () =>
  queryOptions({
    queryKey: accessKeys.users(),
    queryFn: listAppUsers
  });
