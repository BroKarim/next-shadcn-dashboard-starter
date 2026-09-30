import AppSidebar from '@/components/layout/app-sidebar';
import Header from '@/components/layout/header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { auth } from '@clerk/nextjs/server';
import { getAppRoleWithBootstrap } from '@/lib/rbac';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Next Shadcn Dashboard Starter',
  description: 'Basic dashboard with Next.js and Shadcn',
  robots: {
    index: false,
    follow: false
  }
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Gate the whole /dashboard segment: redirect to sign-in when signed out.
  await auth.protect();
  // Belt and braces: on a Clerk dev instance `auth.protect()` can let the
  // request through (reason `dev-browser-missing`) and the role read below
  // would throw an unhandled UnauthenticatedError into the logs.
  const { userId } = await auth();
  if (!userId) {
    redirect(process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL ?? '/sign-in');
  }
  // Application role comes from the database (D27/D15); the bootstrap
  // exception creates the first admin's row on first visit when their email
  // is listed in INITIAL_ADMIN_EMAILS.
  const appRole = await getAppRoleWithBootstrap();
  // Persisting the sidebar state in the cookie.
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get('sidebar_state')?.value === 'true';
  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <a
        href='#main-content'
        className='bg-background ring-ring sr-only rounded-md px-3 py-2 text-sm font-medium shadow focus:not-sr-only focus:absolute focus:top-2 focus:start-2 focus:z-50 focus:ring-2'
      >
        Skip to content
      </a>
      <AppSidebar appRole={appRole} />
      <SidebarInset id='main-content' tabIndex={-1} className='scroll-mt-16'>
        <Header />
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
