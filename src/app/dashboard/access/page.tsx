import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { auth } from '@clerk/nextjs/server';
import { notFound, redirect } from 'next/navigation';

import PageContainer from '@/components/layout/page-container';
import { appUsersQueryOptions } from '@/features/access/api/queries';
import { AccessTable } from '@/features/access/components/access-table';
import { getQueryClient } from '@/lib/query-client';
import { getAppRoleWithBootstrap } from '@/lib/rbac';

export const metadata = {
  title: 'Dashboard : Akses & Peran'
};

export default async function AccessPage() {
  // Pages render in parallel with the dashboard layout; redirect here too so a
  // signed-out render never falls into the notFound() branch below.
  const { userId } = await auth();
  if (!userId) {
    redirect(process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL ?? '/sign-in');
  }

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
