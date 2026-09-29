'use client';

import { mutationOptions } from '@tanstack/react-query';

import { getQueryClient } from '@/lib/query-client';
import type { AppRole } from '@/types';
import { accessKeys } from './queries';
import { setUserRole } from './service';

export const setUserRoleMutation = mutationOptions({
  mutationFn: ({ userId, role }: { userId: string; role: AppRole }) => setUserRole(userId, role),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: accessKeys.all });
  }
});
