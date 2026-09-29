'use client';

import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import type { Finding } from '@/features/findings/api/types';
import { FindingFormSheet } from './finding-form-sheet';

/**
 * Header actions on the finding detail page: edit sheet plus soft delete.
 * A client component so the sheet state stays local to the header.
 */
export function FindingDetailActions({ finding }: { finding: Finding; isAdmin: boolean }) {
  const [formOpen, setFormOpen] = React.useState(false);

  return (
    <>
      <Button variant='outline' onClick={() => setFormOpen(true)}>
        <Icons.edit className='size-4' />
        Edit Temuan
      </Button>
      <FindingFormSheet finding={finding} open={formOpen} onOpenChange={setFormOpen} />
    </>
  );
}
