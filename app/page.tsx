import { Features } from '@/components/landing/Features';
import { FinalCta } from '@/components/landing/FinalCta';
import { Hero } from '@/components/landing/Hero';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { Pricing } from '@/components/landing/Pricing';
import { SiteFooter } from '@/components/landing/SiteFooter';
import { SiteNav } from '@/components/landing/SiteNav';

export default function Home() {
  return (
    <div className="parchment min-h-screen">
      <SiteNav />
      <main>
        <Hero />
        <HowItWorks />
        <Features />
        <Pricing />
        <FinalCta />
      </main>
      <SiteFooter />
    </div>
  );
}
