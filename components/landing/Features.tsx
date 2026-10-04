import type { ReactNode } from 'react';
import { AmbientGlow } from '@/components/ui/AmbientGlow';
import { Container } from '@/components/ui/Container';
import { Reveal } from '@/components/ui/Reveal';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { TRANSLATIONS } from '@/types';
import { ArchiveIcon, BookIcon, BoltIcon, NotesIcon, ShieldIcon, WaveformIcon, WhatsAppIcon } from '@/components/ui/icons';

const freeTranslations = TRANSLATIONS.filter((translation) => translation.isPublicDomain);
const proTranslations = TRANSLATIONS.filter((translation) => !translation.isPublicDomain);

type Feature = {
  icon: (props: { className?: string }) => ReactNode;
  title: string;
  body: ReactNode;
  status?: 'coming-soon';
  detail?: ReactNode;
  /** Bento placement on large screens. */
  span: string;
  /** The headline feature — rendered as an evergreen-deep card. */
  lead?: boolean;
};

const features: Feature[] = [
  {
    icon: WaveformIcon,
    title: 'Live scripture detection',
    body: (
      <>
        Spoken references become full verses in under a second — including numbers said out loud, book names dropped
        mid-sentence, and passages quoted without a reference at all.
      </>
    ),
    detail: (
      <div className="mt-6 rounded-[0.75rem] border border-paper/10 bg-paper/[0.06] p-4">
        <p className="text-[0.875rem] text-paper/60">
          &ldquo;…as it says in first Corinthians thirteen, verse four…&rdquo;
        </p>
        <p className="mt-2.5 flex items-center gap-2 text-[0.875rem] font-semibold text-amber-glow">
          <BoltIcon className="h-4 w-4" />
          1 Corinthians 13:4 on screen
        </p>
      </div>
    ),
    span: 'md:col-span-2 lg:col-span-4',
    lead: true,
  },
  {
    icon: BookIcon,
    title: `${TRANSLATIONS.length} Bible translations`,
    body: (
      <>
        {freeTranslations.map((translation) => translation.code).join(', ')} are free forever and work offline.{' '}
        {proTranslations.map((translation) => translation.code).join(', ')} come with Church Pro. Switch mid-service
        without stopping.
      </>
    ),
    detail: (
      <div className="mt-5 flex flex-wrap gap-2">
        {TRANSLATIONS.map((translation) => (
          <span
            key={translation.code}
            className={`rounded-full border px-2.5 py-1 text-[0.75rem] font-semibold ${
              translation.isPublicDomain
                ? 'border-evergreen/25 bg-evergreen-soft text-evergreen'
                : 'border-line bg-paper text-ink-muted'
            }`}
            title={translation.fullName}
          >
            {translation.code}
          </span>
        ))}
      </div>
    ),
    span: 'md:col-span-2 lg:col-span-2',
  },
  {
    icon: NotesIcon,
    title: 'AI sermon notes',
    status: 'coming-soon',
    body: (
      <>
        Every service turns into a clean outline — the main points, the verses referenced, and the takeaways — ready
        before people reach the car park.
      </>
    ),
    span: 'lg:col-span-3',
  },
  {
    icon: WhatsAppIcon,
    title: 'WhatsApp summaries',
    status: 'coming-soon',
    body: (
      <>
        Send the week&rsquo;s summary and verse list straight to your church WhatsApp group — the one message your
        members will actually open.
      </>
    ),
    span: 'lg:col-span-3',
  },
];

const supporting = [
  {
    icon: ArchiveIcon,
    title: 'Searchable sermon archive',
    body: 'Every transcript and verse list in one place, arriving with Church Pro.',
  },
  {
    icon: ShieldIcon,
    title: 'Nothing recorded by default',
    body: 'Audio is transcribed as it happens. You choose what gets saved.',
  },
  {
    icon: BoltIcon,
    title: 'Runs in the browser',
    body: 'Nothing to install. Add it to your desktop if you prefer an app.',
  },
];

export function Features() {
  return (
    <section id="features" className="scroll-mt-16 border-t border-line">
      <Container width="wide" className="py-16 sm:py-20 md:py-28">
        <SectionHeading
          eyebrow="Features"
          title={<>Everything the service needs, and nothing it doesn&rsquo;t</>}
          description="Built around how churches actually run a Sunday — not around a feature checklist."
        />

        <div className="mt-12 grid gap-4 sm:mt-16 sm:gap-5 md:grid-cols-2 lg:grid-cols-6">
          {features.map((feature, index) => (
            <Reveal key={feature.title} delay={index * 90} className={feature.span}>
              {feature.lead ? (
                <article className="band-deep relative flex h-full flex-col overflow-hidden rounded-card p-6 shadow-deep sm:p-8">
                  <AmbientGlow />
                  <div className="relative flex h-full flex-col">
                    <span className="flex h-11 w-11 items-center justify-center rounded-[0.75rem] bg-amber-glow text-evergreen-deep">
                      <feature.icon className="h-[22px] w-[22px]" />
                    </span>
                    <h3 className="mt-5 text-[1.375rem] font-semibold sm:text-[1.625rem]">{feature.title}</h3>
                    <p className="mt-2.5 max-w-xl text-[0.9375rem] leading-relaxed text-paper/70 sm:text-base">
                      {feature.body}
                    </p>
                    <div className="mt-auto">{feature.detail}</div>
                  </div>
                </article>
              ) : (
                <article className="group flex h-full flex-col rounded-card border border-line bg-paper p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-line-strong hover:shadow-lifted sm:p-7">
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-[0.75rem] bg-evergreen-soft text-evergreen transition-colors duration-300 group-hover:bg-evergreen group-hover:text-paper">
                      <feature.icon className="h-[22px] w-[22px]" />
                    </span>
                    {feature.status === 'coming-soon' && (
                      <span className="rounded-full border border-amber/25 bg-amber-soft px-2.5 py-1 text-[0.6875rem] font-semibold tracking-wide text-amber">
                        Coming soon
                      </span>
                    )}
                  </div>
                  <h3 className="mt-5 text-lg font-semibold sm:text-xl">{feature.title}</h3>
                  <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-ink-body">{feature.body}</p>
                  {feature.detail}
                </article>
              )}
            </Reveal>
          ))}
        </div>

        <div className="mt-4 grid gap-4 sm:mt-5 sm:gap-5 md:grid-cols-3">
          {supporting.map((item, index) => (
            <Reveal key={item.title} delay={index * 90}>
              <div className="flex h-full items-start gap-3.5 rounded-card border border-line bg-paper-raised/45 p-5 transition-colors duration-300 hover:border-line-strong hover:bg-paper-raised/80">
                <span className="mt-0.5 text-evergreen">
                  <item.icon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-[0.9375rem] font-semibold">{item.title}</h3>
                  <p className="mt-1 text-[0.875rem] leading-relaxed text-ink-body">{item.body}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
