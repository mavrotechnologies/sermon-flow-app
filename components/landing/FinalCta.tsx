import { AmbientGlow } from '@/components/ui/AmbientGlow';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { Reveal } from '@/components/ui/Reveal';
import { ArrowRightIcon } from '@/components/ui/icons';

export function FinalCta() {
  return (
    <section className="band-deep relative overflow-hidden">
      <AmbientGlow grid />

      <Container width="default" className="relative py-16 text-center sm:py-20 md:py-24">
        <Reveal>
          <h2 className="mx-auto max-w-3xl text-[2rem] leading-[1.1] font-semibold sm:text-[2.625rem] lg:text-[3.25rem]">
            Try it on <em className="verse text-amber-glow">this Sunday&rsquo;s</em> sermon.
          </h2>
        </Reveal>
        <Reveal delay={100}>
          <p className="mx-auto mt-4 max-w-lg text-[1.0625rem] leading-relaxed text-paper/70">
            Create a free account in under a minute — five hours of listening a month, no card required — and run it on
            this Sunday&rsquo;s sermon.
          </p>
        </Reveal>
        <Reveal delay={180}>
          <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <Button href="/register" variant="glow" size="lg" className="sm:w-auto">
              Try it free
              <ArrowRightIcon />
            </Button>
            <Button href="#pricing" variant="outline-inverse" size="lg" className="sm:w-auto">
              See pricing
            </Button>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
