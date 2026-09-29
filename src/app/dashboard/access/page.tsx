import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { notFound } from 'next/navigation';

import PageContainer from '@/components/layout/page-container';
import { appUsersQueryOptions } from '@/features/access/api/queries';
import { AccessTable } from '@/features/access/components/access-table';
import { getQueryClient } from '@/lib/query-client';
import { getAppRoleWithBootstrap } from '@/lib/rbac';

export const metadata = {
  title: 'Dashboard : Akses & Peran'
};

export default async function AccessPage() {
  const appRole = await getAppRoleWithBootstrap();
  if (appRole !== 'admin') {
    // Server-side guard: the nav item is hidden for non-admins, and the route
    // itself refuses to render (defense in depth).
    notFound();
  }

  const queryClient = getQueryClient();
  await queryClient.prefetchQuery(appUsersQueryOptions());

  return (
    <PageContainer pageTitle='Akses & Peran' pageDescription='Kelola role aplikasi pengguna'>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <AccessTable />
      </HydrationBoundary>
    </PageContainer>
  );
}
