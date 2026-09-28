import { notFound } from 'next/navigation';

import PageContainer from '@/components/layout/page-container';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { BpkFindingDetail } from '@/features/overview/components/bpk-finding-detail';
import { BPK_FINDINGS, getFindingById } from '@/features/overview/components/bpk-overview-data';
import { StatusBadge } from '@/features/overview/components/bpk-status-badge';
import { canManageFindings, MANAGE_ACTIONS_DISABLED_REASON } from '@/features/overview/permissions';

export const metadata = {
  title: 'Dashboard : Detail Temuan'
};

type PageProps = { params: Promise<{ id: string }> };

export default async function TemuanDetailPage({ params }: PageProps) {
  const { id } = await params;
  const finding = getFindingById(BPK_FINDINGS, id);

  if (!finding) notFound();

  return (
    <PageContainer
      pageTitle={`Detail Temuan ${finding.id}`}
      pageDescription={finding.judulPemeriksaan}
      pageHeaderAction={
        <div className='flex items-center gap-2'>
          <StatusBadge status={finding.status} />
          <Button
            variant='outline'
            disabled={!canManageFindings}
            title={canManageFindings ? undefined : MANAGE_ACTIONS_DISABLED_REASON}
          >
            <Icons.edit className='size-4' />
            Edit Temuan
          </Button>
        </div>
      }
    >
      <BpkFindingDetail finding={finding} />
    </PageContainer>
  );
}
