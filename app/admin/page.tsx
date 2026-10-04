import type { Metadata } from 'next';
import Link from 'next/link';
import { AccountMenu } from '@/components/account/AccountMenu';
import { AmbientGlow } from '@/components/ui/AmbientGlow';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { Logo } from '@/components/ui/Logo';
import { SoundWave } from '@/components/ui/SoundWave';
import { ArrowRightIcon, BookIcon, HistoryIcon, WaveformIcon } from '@/components/ui/icons';
import { USAGE_TRACKING_ENABLED, formatMinutes, getMonthlyUsage, getPlanForUser } from '@/lib/plan';
import { getCurrentUser } from '@/lib/auth/server';

export const metadata: Metadata = {
  title: 'Your account · SermonFlow',
};

export default async function AccountHomePage() {
  const user = await getCurrentUser();

  // Collected at sign-up in components/auth/AuthForm.tsx, stored on the Cognito user.
  const fullName = user?.name ?? null;
  const churchName = user?.churchName ?? null;
  const email = user?.email ?? null;
  const firstName = fullName?.split(/\s+/)[0] ?? null;

  const plan = getPlanForUser();
  const usage = getMonthlyUsage();

  const limitMinutes = plan.minutesPerMonth;
  const percentUsed =
    limitMinutes && limitMinutes > 0 ? Math.min(100, Math.round((usage.minutesUsed / limitMinutes) * 100)) : 0;

  return (
    <div className="parchment flex min-h-screen flex-col">
      <header className="border-b border-line bg-paper">
        <Container width="wide" className="flex h-16 items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Logo href="/admin" />
            <span className="hidden h-5 w-px shrink-0 bg-line sm:block" />
            <span className="hidden shrink-0 text-[0.875rem] font-semibold text-ink-muted sm:block">Account</span>
          </div>
          <AccountMenu email={email} name={fullName} />
        </Container>
      </header>

      <Container as="main" width="wide" className="flex-1 py-8 md:py-10">
        {/* Greeting */}
        <div className="animate-fade-in">
          <h1 className="text-[2rem] leading-tight font-semibold sm:text-[2.5rem]">
            {firstName ? `Welcome back, ${firstName}` : 'Welcome back'}
          </h1>
          <p className="mt-1.5 text-[0.9375rem] text-ink-body">
            {churchName ?? 'Ready when your next service is.'}
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:gap-5 lg:grid-cols-[1.7fr_1fr] lg:items-start">
          {/* Start a session */}
          <section className="band-deep animate-fade-in-up relative overflow-hidden rounded-card shadow-deep">
            <AmbientGlow />
            <div className="relative p-6 sm:p-8">
              <SoundWave
                bars={9}
                idle
                className="absolute top-8 right-8 hidden h-14 gap-1.5 text-paper/15 sm:flex [&>span]:w-1.5"
              />

              <span className="inline-flex items-center gap-2 rounded-full border border-amber-glow/30 bg-amber-glow/10 px-2.5 py-1 text-[0.75rem] font-semibold text-amber-glow">
                <span className="relative flex h-1.5 w-1.5 items-center justify-center">
                  <span className="animate-listening-ring absolute h-1.5 w-1.5 rounded-full bg-amber-glow/50" />
                  <span className="relative h-1.5 w-1.5 rounded-full bg-amber-glow" />
                </span>
                Ready when you are
              </span>

              <h2 className="mt-5 text-[1.75rem] leading-[1.1] font-semibold sm:text-[2.25rem]">
                Start a new <em className="verse text-amber-glow">sermon session</em>
              </h2>
              <p className="mt-3 max-w-md text-[0.9375rem] leading-relaxed text-paper/70">
                Opens the live room: your microphone, a rolling transcript, and every verse detected as it&rsquo;s
                spoken.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                <Button href="/admin/session" variant="glow" size="lg">
                  Start new session
                  <ArrowRightIcon />
                </Button>
                <p className="text-[0.8125rem] text-paper/50">
                  You&rsquo;ll be asked for microphone access the first time.
                </p>
              </div>
            </div>

            <div className="relative flex flex-col gap-3 border-t border-paper/10 bg-paper/[0.04] px-6 py-4 sm:flex-row sm:items-center sm:gap-6 sm:px-8">
              <p className="flex items-center gap-2 text-[0.8125rem] text-paper/70">
                <WaveformIcon className="h-4 w-4 shrink-0 text-amber-glow" />
                Detection in under a second
              </p>
              <p className="flex items-center gap-2 text-[0.8125rem] text-paper/70">
                <BookIcon className="h-4 w-4 shrink-0 text-amber-glow" />
                Reading in {plan.id === 'free' ? 'KJV, WEB and ASV' : 'any translation'}
              </p>
            </div>
          </section>

          {/* Usage rail */}
          <aside className="animate-fade-in-up delay-100 rounded-card border border-line bg-paper p-6 shadow-soft">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="eyebrow text-ink-muted">This month</h2>
              <span className="rounded-full border border-line bg-paper-raised px-2 py-0.5 text-[0.6875rem] font-semibold text-ink-muted">
                {plan.name}
              </span>
            </div>

            <p className="tabular mt-4 font-display text-[2.25rem] leading-none font-semibold text-ink">
              {formatMinutes(usage.minutesUsed)}
              <span className="ml-1.5 text-[0.9375rem] font-normal text-ink-muted">
                {limitMinutes === null ? 'listened' : `of ${formatMinutes(limitMinutes)}`}
              </span>
            </p>

            {limitMinutes !== null && (
              <div
                className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-paper-raised"
                role="progressbar"
                aria-valuenow={percentUsed}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Listening minutes used this month"
              >
                <div
                  className="animate-grow-x h-full rounded-full bg-evergreen transition-all"
                  style={{ width: `${percentUsed}%` }}
                />
              </div>
            )}

            <dl className="mt-5 space-y-2.5 border-t border-line pt-5">
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-[0.875rem] text-ink-body">Sessions</dt>
                <dd className="tabular text-[0.875rem] font-semibold text-ink">{usage.sessions}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-[0.875rem] text-ink-body">Remaining</dt>
                <dd className="tabular text-[0.875rem] font-semibold text-ink">
                  {limitMinutes === null ? 'Unlimited' : formatMinutes(Math.max(0, limitMinutes - usage.minutesUsed))}
                </dd>
              </div>
            </dl>

            {!USAGE_TRACKING_ENABLED && (
              <p className="mt-5 rounded-[0.5rem] border border-amber/20 bg-amber-soft px-3 py-2.5 text-[0.75rem] leading-relaxed text-amber">
                Usage tracking isn&rsquo;t live yet, so this reads zero. It starts counting once sessions are saved.
              </p>
            )}

            <Link
              href="/#pricing"
              className="mt-5 flex h-11 items-center justify-center rounded-control border border-line bg-paper text-[0.875rem] font-semibold text-ink transition-all hover:border-line-strong hover:bg-paper-raised active:scale-[0.98]"
            >
              See plans
            </Link>
          </aside>
        </div>

        {/* Past sessions — full width, outside the grid. The usage rail is short,
            so keeping history in the left column left a tall void beside it. A
            full measure also suits the session rows this becomes. */}
        <section className="animate-fade-in-up mt-4 delay-200 md:mt-5">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-[1.125rem] font-semibold">Past sessions</h2>
          </div>

          {/* TODO(persistence): nothing records sessions yet — no database table and
              no local storage. When session history lands, render the list here
              (date, duration, verse count, link to the transcript) and drop this
              empty state to the no-results case. Deliberately not seeded with
              sample data. */}
          <div className="mt-3 flex flex-col items-center justify-center rounded-card border border-dashed border-line-strong bg-paper-raised/35 px-6 py-12 text-center">
            <span className="animate-float flex h-12 w-12 items-center justify-center rounded-card bg-evergreen-soft text-evergreen/70">
              <HistoryIcon className="h-6 w-6" />
            </span>
            <p className="mt-4 text-[0.9375rem] font-medium text-ink">No sessions yet</p>
            <p className="mt-1 max-w-sm text-[0.875rem] leading-relaxed text-ink-muted">
              Sermon history is still being built. Once it&rsquo;s ready, every session you run will be listed here
              with its transcript and verses.
            </p>
          </div>
        </section>
      </Container>
    </div>
  );
}
