'use client';

import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { Alert, AlertAction, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useRouter } from 'next/navigation';
import { useEffect, useTransition } from 'react';

export default function OverviewError({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    console.error(error);
  }, [error]);

  // Defer the refresh until the next render phase so React settles pending states first
  const retry = () => {
    startTransition(() => {
      router.refresh();
      reset();
    });
  };

  return (
    <div className='flex flex-1 items-start p-4 md:px-6'>
      <Alert variant='destructive' className='max-w-2xl'>
        <Icons.warning />
        <AlertTitle>Gagal memuat dashboard</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
        <AlertAction>
          <Button variant='outline' size='sm' onClick={retry} disabled={isPending}>
            {isPending ? (
              <>
                <Icons.spinner className='mr-2 h-4 w-4 animate-spin' aria-hidden='true' />
                Mencoba lagi…
              </>
            ) : (
              'Coba lagi'
            )}
          </Button>
          <span role='status' aria-live='polite' className='sr-only'>
            {isPending ? 'Mencoba lagi' : ''}
          </span>
        </AlertAction>
      </Alert>
    </div>
  );
}
