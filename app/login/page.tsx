import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthForm } from '@/components/auth/AuthForm';
import { AuthShell } from '@/components/auth/AuthShell';
import { safeInternalPath } from '@/lib/redirects';

export const metadata: Metadata = {
  title: 'Log in · SermonFlow',
  description: 'Log in to SermonFlow to run live scripture detection during your service.',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <AuthShell
      title="Welcome back"
      description="Log in to pick up where you left off."
      footer={
        <>
          New to SermonFlow?{' '}
          <Link href="/register" className="font-semibold text-evergreen transition-opacity hover:opacity-75">
            Create an account
          </Link>
        </>
      }
    >
      <AuthForm mode="login" next={safeInternalPath(next)} />
    </AuthShell>
  );
}
