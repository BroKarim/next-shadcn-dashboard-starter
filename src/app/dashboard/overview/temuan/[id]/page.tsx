import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';

import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { BpkFindingDetail } from '@/features/overview/components/bpk-finding-detail';
import { StatusBadge } from '@/features/overview/components/bpk-status-badge';
import { FindingDetailActions } from '@/features/overview/components/finding-detail-actions';
import { findingDetailOptions } from '@/features/findings/api/queries';
import { NotFoundError } from '@/lib/errors';
import { getQueryClient } from '@/lib/query-client';
import { getAppRoleWithBootstrap, getCurrentUserId } from '@/lib/rbac';

export const metadata = {
  title: 'Dashboard : Detail Temuan'
};

type PageProps = { params: Promise<{ id: string }> };

export default async function TemuanDetailPage({ params }: PageProps) {
  const { id } = await params;

  // `fetchQuery` below throws (unlike `prefetchQuery`), so guard before it and
  // let the sign-in redirect happen without logging an UnauthenticatedError.
  const { userId } = await auth();
  if (!userId) {
    redirect(process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL ?? '/sign-in');
  }

  const queryClient = getQueryClient();
  const [appRole, currentUserId] = await Promise.all([
    getAppRoleWithBootstrap(),
    getCurrentUserId()
  ]);
  const canManage = appRole === 'admin';

  let detail;
  try {
    // `fetchQuery` fills the cache for the client component *and* gives this
    // page the header data (title, status) without a second round trip.
    detail = await queryClient.fetchQuery(findingDetailOptions(id));
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound();
    }
    throw error;
  }

  return (
    <PageContainer
      pageTitle={`Detail Temuan ${detail.finding.kodeDisplay}`}
      pageDescription={detail.finding.judulPemeriksaan}
      pageHeaderAction={
        <div className='flex items-center gap-2'>
          <StatusBadge status={detail.finding.status} />
          {canManage ? (
            <FindingDetailActions finding={detail.finding} />
          ) : (
            <Button
              variant='outline'
              disabled
              title='Aksi pengelolaan temuan memerlukan hak akses admin.'
            >
              Edit Temuan
            </Button>
          )}
        </div>
      }
    >
      <HydrationBoundary state={dehydrate(queryClient)}>
        <BpkFindingDetail
          kodeDisplay={detail.finding.kodeDisplay}
          canManage={canManage}
          canDeleteComment={appRole === 'admin'}
          currentUserId={currentUserId}
        />
      </HydrationBoundary>
    </PageContainer>
  );
}
