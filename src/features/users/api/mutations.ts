'use client';

import { mutationOptions } from '@tanstack/react-query';

import { setUserRole } from '@/features/access/api/service';
import { getQueryClient } from '@/lib/query-client';
import { deleteUser } from './service';
import { userKeys } from './queries';
import type { AppRole } from './types';
import { accessKeys } from '@/features/access/api/queries';

const invalidateUserQueries = () => {
  const queryClient = getQueryClient();
  void queryClient.invalidateQueries({ queryKey: userKeys.all });
  void queryClient.invalidateQueries({ queryKey: accessKeys.all });
};

export const setUserRoleMutation = mutationOptions({
  mutationFn: ({ userId, role }: { userId: string; role: AppRole }) => setUserRole(userId, role),
  onSettled: invalidateUserQueries
});

export const deleteUserMutation = mutationOptions({
  mutationFn: (userId: string) => deleteUser(userId),
  onSettled: invalidateUserQueries
});
