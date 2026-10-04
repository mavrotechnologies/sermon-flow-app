import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { getCurrentUser } from '@/lib/auth/server';

/**
 * Auth gate for the whole signed-in app (`/admin` and `/admin/session`).
 *
 * This duplicates the redirect in proxy.ts on purpose — middleware can be
 * bypassed or misconfigured, and the live room is a client component that can't
 * check for itself. Belt and braces.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/admin');

  return <>{children}</>;
}
