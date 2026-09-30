'use client';

import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

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
import { setUserRoleMutation } from '@/features/access/api/mutations';
import { appUsersQueryOptions } from '@/features/access/api/queries';
import type { AppUser } from '@/features/access/api/types';
import { toUserMessage } from '@/lib/errors';
import { formatDate } from '@/features/findings/utils/format';
import type { AppRole } from '@/types';

const ROLE_OPTIONS: { value: AppRole; label: string }[] = [
  { value: 'user', label: 'User (baca data + komentar)' },
  { value: 'admin', label: 'Admin (semua akses)' }
];

/**
 * Application-role table. Rows only exist for users who have already acted in
 * the app (lazy upsert) — an invited person appears after their first login
 * that writes data, except bootstrap admins from `INITIAL_ADMIN_EMAILS`.
 */
export function AccessTable() {
  const { data } = useSuspenseQuery(appUsersQueryOptions());

  const mutation = useMutation({
    ...setUserRoleMutation,
    onSuccess: (result) => {
      toast.success(result.updated ? 'Role diperbarui.' : 'Role tidak berubah.');
    },
    onError: (error) => toast.error(toUserMessage(error))
  });

  return (
    <div className='flex flex-col gap-4'>
      <p className='text-muted-foreground text-sm'>
        Role aplikasi disimpan pada tabel <span className='font-mono'>users</span> dan menjadi
        sumber kebenaran (bukan Clerk metadata). Pengguna baru muncul di sini setelah pertama kali
        melakukan aksi yang menulis data.
      </p>

      <div className='rounded-lg border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Nama</TableHead>
              <TableHead>Terdaftar</TableHead>
              <TableHead className='w-64'>Role</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className='text-muted-foreground h-24 text-center'>
                  Belum ada pengguna yang terdaftar di database.
                </TableCell>
              </TableRow>
            ) : (
              data.items.map((user: AppUser) => (
                <TableRow key={user.id}>
                  <TableCell className='font-medium'>{user.email}</TableCell>
                  <TableCell>{user.name ?? '—'}</TableCell>
                  <TableCell className='text-muted-foreground tabular-nums'>
                    {formatDate(user.createdAt)}
                  </TableCell>
                  <TableCell>
                    <Select
                      items={ROLE_OPTIONS}
                      value={user.role}
                      onValueChange={(value) =>
                        mutation.mutate({ userId: user.id, role: value as AppRole })
                      }
                    >
                      <SelectTrigger
                        className='w-full'
                        aria-label={`Role untuk ${user.email}`}
                        disabled={mutation.isPending}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
