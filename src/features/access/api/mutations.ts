'use client';

import { mutationOptions } from '@tanstack/react-query';

import { getQueryClient } from '@/lib/query-client';
import type { AppRole } from '@/types';
import { accessKeys } from './queries';
import { setUserRole } from './service';

// `onSettled`, not `onSuccess`: the table call site spreads these options and
// overrides `onSuccess` with its toast, which would drop the invalidation.
export const setUserRoleMutation = mutationOptions({
  mutationFn: ({ userId, role }: { userId: string; role: AppRole }) => setUserRole(userId, role),
  onSettled: () => {
    getQueryClient().invalidateQueries({ queryKey: accessKeys.all });
  }
});
