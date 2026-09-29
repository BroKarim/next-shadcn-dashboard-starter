import PageContainer from '@/components/layout/page-container';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';

import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { getAppRoleWithBootstrap } from '@/lib/rbac';
import {
  findingFilterOptionsQueryOptions,
  findingsByYearQueryOptions,
  findingsQueryOptions,
  findingsValueByYearQueryOptions,
  overviewMetricsQueryOptions,
  recentActivitiesQueryOptions
} from '@/features/findings/api/queries';
import {
  FINDING_STATUSES,
  type FindingFilters,
  type FindingStatus
} from '@/features/findings/api/types';
import { BpkOverview } from '@/features/overview/components/bpk-overview';
import type { SearchParams } from 'nuqs/server';

export const metadata = {
  title: 'Dashboard : Temuan BPK'
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function OverviewPage(props: PageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);

  const rawStatus = searchParamsCache.get('status');
  const status =
    rawStatus && (FINDING_STATUSES as string[]).includes(rawStatus)
      ? (rawStatus as FindingStatus)
      : undefined;

  // Prefetch happens with the URL filters; `await Promise.all` before
  // dehydrate so the hydration state always carries the data (D32).
  const filters: FindingFilters = {
    page: searchParamsCache.get('page'),
    perPage: searchParamsCache.get('perPage'),
    q: searchParamsCache.get('q') ?? undefined,
    status,
    tahun: searchParamsCache.get('tahun') ?? undefined,
    kodeTemuan: searchParamsCache.get('kodeTemuan') ?? undefined,
    kodeRekomendasi: searchParamsCache.get('kodeRekomendasi') ?? undefined,
    judul: searchParamsCache.get('judul') ?? undefined
  };

  const queryClient = getQueryClient();
  const appRole = await getAppRoleWithBootstrap();
  const isAdmin = appRole === 'admin';
  await Promise.all([
    queryClient.prefetchQuery(findingsQueryOptions(filters)),
    queryClient.prefetchQuery(overviewMetricsQueryOptions()),
    queryClient.prefetchQuery(findingsByYearQueryOptions()),
    queryClient.prefetchQuery(findingFilterOptionsQueryOptions()),
    // Only the region the role will actually render is prefetched.
    isAdmin
      ? queryClient.prefetchQuery(recentActivitiesQueryOptions())
      : queryClient.prefetchQuery(findingsValueByYearQueryOptions())
  ]);

  return (
    <PageContainer
      pageTitle='Dashboard Temuan BPK'
      pageDescription='Ringkasan tindak lanjut hasil pemeriksaan'
    >
      <HydrationBoundary state={dehydrate(queryClient)}>
        <BpkOverview appRole={appRole} />
      </HydrationBoundary>
    </PageContainer>
  );
}
