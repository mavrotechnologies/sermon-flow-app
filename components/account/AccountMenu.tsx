'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { logoutAction } from '@/app/auth/actions';
import { forgetAccessToken } from '@/lib/api';

interface AccountMenuProps {
  email: string | null;
  name: string | null;
}

export function AccountMenu({ email, name }: AccountMenuProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Dismiss on outside click or Escape.
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  async function handleSignOut() {
    setSigningOut(true);
    forgetAccessToken();
    await logoutAction();

    router.push('/login');
    router.refresh();
  }

  const label = name || email || 'Account';

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex h-10 max-w-[13rem] items-center gap-2 rounded-control border border-line bg-paper px-2.5 text-[0.875rem] font-medium text-ink transition-colors hover:border-line-strong hover:bg-paper-raised"
      >
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-evergreen text-[0.6875rem] font-semibold text-paper">
          {initialsOf(label)}
        </span>
        <span className="hidden truncate sm:inline">{label}</span>
        <svg
          className={`h-3.5 w-3.5 shrink-0 text-ink-muted transition-transform ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M5.5 8 10 12.5 14.5 8" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="animate-scale-in absolute right-0 z-50 mt-2 w-60 origin-top-right overflow-hidden rounded-card border border-line bg-paper shadow-lifted"
        >
          <div className="border-b border-line px-3.5 py-3">
            {name && <p className="truncate text-[0.875rem] font-semibold text-ink">{name}</p>}
            {email && <p className="truncate text-[0.8125rem] text-ink-muted">{email}</p>}
          </div>
          <div className="p-1.5">
            <Link
              href="/"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block rounded-[0.375rem] px-2 py-2 text-[0.875rem] text-ink-body transition-colors hover:bg-paper-raised hover:text-ink"
            >
              Back to site
            </Link>
            <button
              type="button"
              role="menuitem"
              onClick={handleSignOut}
              disabled={signingOut}
              className="block w-full rounded-[0.375rem] px-2 py-2 text-left text-[0.875rem] font-medium text-danger transition-colors hover:bg-danger-soft disabled:opacity-60"
            >
              {signingOut ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function initialsOf(label: string): string {
  const parts = label.trim().split(/[\s@.]+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}
