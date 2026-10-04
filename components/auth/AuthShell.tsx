import type { ReactNode } from 'react';
import { AmbientGlow } from '@/components/ui/AmbientGlow';
import { Logo } from '@/components/ui/Logo';
import { CheckIcon } from '@/components/ui/icons';

const reassurances = [
  'Verses on screen in under a second',
  'KJV, WEB and ASV free forever',
  'Works with the microphone you already have',
];

interface AuthShellProps {
  title: string;
  description: ReactNode;
  children: ReactNode;
  /** Rendered under the form — the link across to the other auth page. */
  footer: ReactNode;
}

export function AuthShell({ title, description, children, footer }: AuthShellProps) {
  return (
    <div className="parchment flex min-h-screen flex-col lg:grid lg:grid-cols-[1fr_minmax(0,44%)]">
      {/* Form side */}
      <div className="flex flex-1 flex-col">
        <header className="border-b border-line/70 lg:border-b-0">
          <div className="flex h-16 w-full items-center px-5 sm:px-6 lg:px-10">
            <Logo />
          </div>
        </header>

        <main className="flex flex-1 items-center justify-center px-5 py-10 sm:px-6 sm:py-14 lg:px-10">
          <div className="animate-fade-in-up w-full max-w-sm">
            <h1 className="text-[2rem] leading-tight font-semibold sm:text-[2.375rem]">{title}</h1>
            <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-ink-body">{description}</p>

            <div className="mt-8">{children}</div>

            <div className="mt-7 border-t border-line pt-6 text-center text-[0.9375rem] text-ink-body">{footer}</div>
          </div>
        </main>
      </div>

      {/* Reassurance panel — hidden on mobile, where the form is the whole point */}
      <aside className="band-deep relative hidden overflow-hidden p-10 lg:flex lg:flex-col lg:justify-center xl:p-14">
        <AmbientGlow grid />
        <div className="animate-fade-in relative max-w-md">
          <span aria-hidden="true" className="font-display block h-10 text-[4.5rem] leading-none text-amber-glow/70">
            &ldquo;
          </span>
          <blockquote className="verse mt-4 text-[1.875rem] leading-[1.25] text-paper xl:text-[2.25rem]">
            Thy word is a lamp unto my feet, and a light unto my path.
          </blockquote>
          <p className="mt-4 text-[0.875rem] font-semibold tracking-wide text-amber-glow">Psalm 119:105</p>

          <ul className="mt-10 space-y-3.5 border-t border-paper/15 pt-8">
            {reassurances.map((item) => (
              <li key={item} className="flex items-start gap-3 text-[0.9375rem] leading-relaxed text-paper/75">
                <CheckIcon className="mt-1 h-3.5 w-3.5 shrink-0 text-amber-glow" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
