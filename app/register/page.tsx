import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthForm } from '@/components/auth/AuthForm';
import { AuthShell } from '@/components/auth/AuthShell';

export const metadata: Metadata = {
  title: 'Create your account · SermonFlow',
  description: 'Start free — five hours of live scripture detection a month, no card required.',
};

export default function RegisterPage() {
  return (
    <AuthShell
      title="Start free"
      description="Five hours of listening a month, live scripture detection, and the public domain translations — no card required."
      footer={
        <>
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-evergreen transition-opacity hover:opacity-75">
            Log in
          </Link>
        </>
      }
    >
      <AuthForm mode="register" />
    </AuthShell>
  );
}
