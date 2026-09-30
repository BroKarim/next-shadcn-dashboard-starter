import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { createUser, updateUser, deleteUser } from './service';
import { userKeys } from './queries';
import type { UserMutationPayload } from './types';

export const createUserMutation = mutationOptions({
  mutationFn: (data: UserMutationPayload) => createUser(data),
  // `onSettled`: call sites override onSuccess with their own toast.
  onSettled: () => {
    getQueryClient().invalidateQueries({ queryKey: userKeys.all });
  }
});

export const updateUserMutation = mutationOptions({
  mutationFn: ({ id, values }: { id: number; values: UserMutationPayload }) =>
    updateUser(id, values),
  // `onSettled`: call sites override onSuccess with their own toast.
  onSettled: () => {
    getQueryClient().invalidateQueries({ queryKey: userKeys.all });
  }
});

export const deleteUserMutation = mutationOptions({
  mutationFn: (id: number) => deleteUser(id),
  // `onSettled`: call sites override onSuccess with their own toast.
  onSettled: () => {
    getQueryClient().invalidateQueries({ queryKey: userKeys.all });
  }
});
