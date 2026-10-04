import { AmbientGlow } from '@/components/ui/AmbientGlow';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { Reveal } from '@/components/ui/Reveal';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { TRANSLATIONS } from '@/types';
import { CheckIcon } from '@/components/ui/icons';

const publicDomain = TRANSLATIONS.filter((translation) => translation.isPublicDomain)
  .map((translation) => translation.code)
  .join(', ');

const premium = TRANSLATIONS.filter((translation) => !translation.isPublicDomain)
  .map((translation) => translation.code)
  .join(', ');

// TODO(billing): no payment provider is wired up yet. Church Pro is presented
// as "Coming soon" and its price is indicative — replace the placeholder amount
// and point the CTA at a real checkout session once billing exists.
const CHURCH_PRO_PRICE = 'GH₵99';

const tiers = [
  {
    name: 'Free',
    price: 'GH₵0',
    cadence: 'forever',
    tagline: 'Enough to run a service and see whether it earns its place.',
    features: [
      '5 hours of listening a month',
      'Live scripture detection',
      `${publicDomain} — public domain, works offline`,
      'Live transcript and verse panel',
      'One account',
    ],
    cta: { label: 'Start free', href: '/register', variant: 'primary' as const },
    footnote: 'No card required.',
    featured: false,
  },
  {
    name: 'Church Pro',
    price: CHURCH_PRO_PRICE,
    cadence: 'per month, per church',
    tagline: 'For churches running it every Sunday, with the whole team on it.',
    features: [
      'Unlimited listening',
      `All ${TRANSLATIONS.length} translations, including ${premium}`,
      'WhatsApp sermon summaries',
      'AI sermon notes after every service',
      'Searchable sermon archive',
      'Up to 5 team members',
    ],
    cta: { label: 'Ask about early access', href: 'https://wa.me/233532828138', variant: 'glow' as const },
    footnote: 'Indicative price. Nothing to pay until billing opens.',
    featured: true,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="scroll-mt-16 border-t border-line bg-paper-raised/45">
      <Container width="wide" className="py-16 sm:py-20 md:py-28">
        <SectionHeading
          eyebrow="Pricing"
          title="Free to start. Fair when you grow."
          description="Churches are not software companies. The free tier is genuinely usable, and Church Pro is priced per church — not per person in the building."
        />

        <div className="mx-auto mt-12 grid max-w-4xl gap-5 sm:mt-16 md:grid-cols-2">
          {tiers.map((tier, index) => (
            <Reveal key={tier.name} delay={index * 120}>
              <div
                className={`relative flex h-full flex-col overflow-hidden rounded-card p-6 transition-all duration-300 hover:-translate-y-1 sm:p-8 ${
                  tier.featured
                    ? 'band-deep shadow-deep'
                    : 'border border-line bg-paper shadow-soft hover:border-line-strong hover:shadow-lifted'
                }`}
              >
                {tier.featured && <AmbientGlow />}
                <div className="relative flex items-center justify-between gap-3">
                  <h3 className={`font-display text-xl font-semibold ${tier.featured ? 'text-paper' : 'text-ink'}`}>
                    {tier.name}
                  </h3>
                  {tier.featured && (
                    <span className="rounded-full border border-amber-glow/30 bg-amber-glow/10 px-2.5 py-1 text-[0.6875rem] font-semibold tracking-wide text-amber-glow">
                      Coming soon
                    </span>
                  )}
                </div>

                <p className={`relative mt-2 text-[0.9375rem] leading-relaxed ${tier.featured ? 'text-paper/65' : 'text-ink-body'}`}>
                  {tier.tagline}
                </p>

                <div className="relative mt-6 flex items-baseline gap-2">
                  <span
                    className={`tabular font-display text-[3.25rem] leading-none font-semibold ${
                      tier.featured ? 'text-paper' : 'text-ink'
                    }`}
                  >
                    {tier.price}
                  </span>
                  <span className={`text-[0.875rem] ${tier.featured ? 'text-paper/55' : 'text-ink-muted'}`}>
                    {tier.cadence}
                  </span>
                </div>

                <div className={`relative mt-6 border-t pt-6 ${tier.featured ? 'border-paper/15' : 'border-line'}`}>
                  <ul className="space-y-3">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5 text-[0.9375rem] leading-relaxed">
                        <CheckIcon
                          className={`mt-1 h-3.5 w-3.5 shrink-0 ${tier.featured ? 'text-amber-glow' : 'text-evergreen'}`}
                        />
                        <span className={tier.featured ? 'text-paper/80' : 'text-ink-body'}>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="relative mt-8 pt-2 md:mt-auto md:pt-8">
                  <Button href={tier.cta.href} variant={tier.cta.variant} size="lg" fullWidth>
                    {tier.cta.label}
                  </Button>
                  <p className={`mt-3 text-center text-[0.8125rem] ${tier.featured ? 'text-paper/50' : 'text-ink-muted'}`}>
                    {tier.footnote}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={240}>
          <p className="mx-auto mt-8 max-w-xl text-center text-[0.875rem] leading-relaxed text-ink-muted">
            Billing isn&rsquo;t switched on yet, so Church Pro pricing is indicative while we finish it. Start on the
            free tier and you&rsquo;ll keep everything you&rsquo;ve done.
          </p>
        </Reveal>
      </Container>
    </section>
  );
}
