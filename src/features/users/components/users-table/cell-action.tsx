'use client';

import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';

import { Icons } from '@/components/icons';
import { AlertModal } from '@/components/modal/alert-modal';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { toUserMessage } from '@/lib/errors';
import { deleteUserMutation, setUserRoleMutation } from '../../api/mutations';
import type { User } from '../../api/types';

interface CellActionProps {
  data: User;
  currentUserId: string | null;
}

export function CellAction({ data, currentUserId }: CellActionProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const isCurrentUser = currentUserId === data.id;

  const roleMutation = useMutation({
    ...setUserRoleMutation,
    onSuccess: (result) => {
      toast.success(result.updated ? 'Role pengguna diperbarui.' : 'Role tidak berubah.');
    },
    onError: (error) => toast.error(toUserMessage(error))
  });

  const deleteMutation = useMutation({
    ...deleteUserMutation,
    onSuccess: () => {
      toast.success('Pengguna dihapus dari aplikasi.');
      setDeleteOpen(false);
    },
    onError: (error) => toast.error(toUserMessage(error))
  });

  return (
    <>
      <AlertModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => deleteMutation.mutate(data.id)}
        loading={deleteMutation.isPending}
      />
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger render={<Button variant='ghost' className='h-8 w-8 p-0' />}>
          <span className='sr-only'>Buka menu pengguna</span>
          <Icons.ellipsis className='h-4 w-4' />
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuGroup>
            <DropdownMenuLabel>Aksi</DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuGroup>
            {data.role !== 'admin' && (
              <DropdownMenuItem
                disabled={roleMutation.isPending}
                onClick={() => roleMutation.mutate({ userId: data.id, role: 'admin' })}
              >
                <Icons.userPen className='mr-2 h-4 w-4' />
                Jadikan Admin
              </DropdownMenuItem>
            )}
            {data.role === 'admin' && !isCurrentUser && (
              <DropdownMenuItem
                disabled={roleMutation.isPending}
                onClick={() => roleMutation.mutate({ userId: data.id, role: 'user' })}
              >
                <Icons.userPen className='mr-2 h-4 w-4' />
                Ubah ke User
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              disabled={isCurrentUser || deleteMutation.isPending}
              onClick={() => setDeleteOpen(true)}
            >
              <Icons.trash className='mr-2 h-4 w-4 text-destructive' />
              {isCurrentUser ? 'Akun aktif tidak dapat dihapus' : 'Hapus Pengguna'}
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
