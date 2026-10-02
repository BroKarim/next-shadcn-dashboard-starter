import { auth } from '@clerk/nextjs/server';
import { notFound, redirect } from 'next/navigation';

import PageContainer from '@/components/layout/page-container';
import { getCurrentUserId, getAppRoleWithBootstrap } from '@/lib/rbac';
import UserListingPage from '@/features/users/components/user-listing';
import { searchParamsCache } from '@/lib/searchparams';
import type { SearchParams } from 'nuqs/server';

export const metadata = {
  title: 'Dashboard: Users'
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function UsersPage(props: PageProps) {
  const { userId } = await auth();
  if (!userId) {
    redirect(process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL ?? '/sign-in');
  }

  const appRole = await getAppRoleWithBootstrap();
  if (appRole !== 'admin') {
    notFound();
  }

  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);
  const currentUserId = await getCurrentUserId();

  return (
    <PageContainer
      pageTitle='Pengguna'
      pageDescription='Kelola pengguna yang terdaftar di aplikasi dan role aksesnya.'
    >
      <UserListingPage currentUserId={currentUserId} />
    </PageContainer>
  );
}
