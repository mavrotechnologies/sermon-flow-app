import type { ReactNode } from 'react';
import { Container } from '@/components/ui/Container';
import { Reveal } from '@/components/ui/Reveal';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { SoundWave } from '@/components/ui/SoundWave';
import { ArrowRightIcon, MicIcon } from '@/components/ui/icons';

const steps: { title: string; body: ReactNode; visual: ReactNode }[] = [
  {
    title: 'The preacher speaks',
    body: (
      <>
        Open the dashboard and press start. Any microphone works &mdash; handheld, lapel, the sound desk feed, or the
        laptop&rsquo;s own mic.
      </>
    ),
    visual: (
      <div className="flex items-center gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-evergreen text-paper shadow-soft">
          <MicIcon className="h-5 w-5" />
        </span>
        <SoundWave bars={18} className="h-10 gap-1 text-evergreen/70 [&>span]:w-1" />
      </div>
    ),
  },
  {
    title: 'SermonFlow finds the verse',
    body: (
      <>
        A layered detector catches references the way they are actually spoken &mdash; &ldquo;second Timothy three
        sixteen&rdquo;, &ldquo;the twenty-third psalm&rdquo; &mdash; then pulls the full passage.
      </>
    ),
    visual: (
      <div className="flex flex-col items-start gap-2.5">
        <p className="text-[0.875rem] text-ink-muted">
          &ldquo;&hellip;in{' '}
          <mark className="bg-amber-soft font-medium text-ink decoration-amber/60 decoration-2 underline-offset-4 [text-decoration-line:underline]">
            second Timothy three sixteen
          </mark>
          &rdquo;
        </p>
        <p className="flex items-center gap-2 text-[0.875rem] font-semibold text-evergreen">
          <ArrowRightIcon className="h-3.5 w-3.5 text-amber" />
          <span className="rounded-full border border-evergreen/20 bg-evergreen-soft px-2.5 py-0.5">2 Timothy 3:16</span>
        </p>
      </div>
    ),
  },
  {
    title: 'The congregation follows along',
    body: (
      <>
        The verse appears on screen in the translation your church reads, while the transcript keeps rolling
        underneath.
      </>
    ),
    visual: (
      <div className="band-deep w-full rounded-[0.75rem] px-4 py-3 shadow-deep">
        <p className="font-display text-[0.9375rem] font-semibold text-paper">2 Timothy 3:16</p>
        <p className="verse mt-1 text-[0.875rem] leading-snug text-paper/85">
          All scripture is given by inspiration of God&hellip;
        </p>
      </div>
    ),
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-16 border-t border-line bg-paper-raised/45">
      <Container width="wide" className="py-16 sm:py-20 md:py-28">
        <SectionHeading
          eyebrow="How it works"
          title="Three steps, and nobody has to touch a slide"
          description="Setup takes about a minute. From there the service runs the way it always has — SermonFlow just keeps up."
        />

        <ol className="mt-12 grid gap-5 sm:mt-16 md:grid-cols-3">
          {steps.map((step, index) => (
            <Reveal key={step.title} delay={index * 120} as="li">
              <div className="group flex h-full flex-col overflow-hidden rounded-card border border-line bg-paper shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-line-strong hover:shadow-lifted">
                {/* A small picture of the step */}
                <div className="flex h-32 items-center border-b border-line bg-paper-raised/60 px-6">{step.visual}</div>

                <div className="relative flex-1 p-6">
                  <span
                    aria-hidden="true"
                    className="tabular absolute top-4 right-5 font-display text-[2.75rem] leading-none font-semibold text-evergreen/15 transition-colors duration-300 group-hover:text-amber/45"
                  >
                    0{index + 1}
                  </span>
                  <p className="eyebrow text-evergreen">Step {index + 1}</p>
                  <h3 className="mt-2 max-w-[14ch] text-xl font-semibold sm:text-[1.375rem]">{step.title}</h3>
                  <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-body">{step.body}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </ol>
      </Container>
    </section>
  );
}
