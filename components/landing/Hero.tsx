import { AmbientGlow } from '@/components/ui/AmbientGlow';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { Reveal } from '@/components/ui/Reveal';
import { ArrowRightIcon, CheckIcon } from '@/components/ui/icons';
import { LiveDetectionPreview } from './LiveDetectionPreview';
import { SpokenTicker } from './SpokenTicker';

const assurances = ['No card required', 'Works with the mic you already have', 'KJV, WEB & ASV free forever'];

export function Hero() {
  return (
    // Pulled up under the sticky nav (h-16), which stays transparent until the
    // page scrolls — so the band runs to the top of the window.
    <section className="band-deep relative -mt-16 overflow-hidden pt-16">
      <AmbientGlow grid />
      {/* Parchment returns behind the lower half of the preview, so the card
          straddles the edge of the band instead of sitting inside it. */}
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-80 bg-paper" />

      <Container width="wide" className="relative pt-12 pb-10 sm:pt-16 md:pt-20 md:pb-14">
        <div className="mx-auto max-w-4xl text-center">
          <Reveal>
            <p className="inline-flex items-center gap-2.5 rounded-full border border-paper/15 bg-paper/[0.06] px-3.5 py-1.5 text-[0.8125rem] font-medium text-paper/85">
              <span className="relative flex h-2 w-2 items-center justify-center">
                <span className="animate-listening-ring absolute h-2 w-2 rounded-full bg-amber-glow/60" />
                <span className="relative h-1.5 w-1.5 rounded-full bg-amber-glow" />
              </span>
              Free while we&rsquo;re in beta
            </p>
          </Reveal>

          <Reveal delay={80}>
            <h1 className="mt-6 text-[2.5rem] leading-[1.04] font-semibold sm:text-[3.5rem] md:text-[4.25rem] lg:text-[4.75rem]">
              Scripture on screen, <br className="hidden sm:block" />
              <em className="verse text-amber-glow">the moment it&rsquo;s spoken.</em>
            </h1>
          </Reveal>

          <Reveal delay={160}>
            <p className="mx-auto mt-5 max-w-xl text-[1.0625rem] leading-relaxed text-paper/70 sm:mt-6 sm:text-lg">
              SermonFlow listens to the sermon, catches every verse the preacher mentions in under a second, and puts
              the full passage in front of your congregation. No slide operator, no scrambling.
            </p>
          </Reveal>

          <Reveal delay={240}>
            <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center">
              <Button href="/register" variant="glow" size="lg" className="sm:w-auto">
                Try it free
                <ArrowRightIcon />
              </Button>
              <Button href="#how-it-works" variant="outline-inverse" size="lg" className="sm:w-auto">
                See how it works
              </Button>
            </div>
          </Reveal>

          <Reveal delay={300}>
            <ul className="mt-7 flex flex-col items-center justify-center gap-x-6 gap-y-2 text-[0.875rem] text-paper/60 sm:flex-row sm:flex-wrap">
              {assurances.map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <CheckIcon className="h-3.5 w-3.5 text-amber-glow" />
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        <Reveal delay={360} className="mt-14 sm:mt-16">
          <LiveDetectionPreview />
        </Reveal>

        <Reveal delay={420} className="mt-9">
          <SpokenTicker />
        </Reveal>
      </Container>
    </section>
  );
}
