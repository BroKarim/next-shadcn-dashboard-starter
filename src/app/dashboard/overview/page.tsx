import PageContainer from '@/components/layout/page-container';
import { BpkOverview } from '@/features/overview/components/bpk-overview';

export const metadata = {
  title: 'Dashboard : Temuan BPK'
};

export default function OverviewPage() {
  return (
    <PageContainer
      pageTitle='Dashboard Temuan BPK'
      pageDescription='Ringkasan tindak lanjut hasil pemeriksaan'
    >
      <BpkOverview />
    </PageContainer>
  );
}
