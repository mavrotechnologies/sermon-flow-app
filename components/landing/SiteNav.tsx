'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { Logo } from '@/components/ui/Logo';

const links = [
  { href: '#how-it-works', label: 'How it works' },
  { href: '#features', label: 'Features' },
  { href: '#pricing', label: 'Pricing' },
];

export function SiteNav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // At the top of the page the bar is see-through over the evergreen-deep hero
  // (which runs up underneath it); once the page moves it becomes a parchment
  // bar over the content.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Prevent the page scrolling behind the open mobile panel.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  // The open mobile panel is parchment, so the bar above it has to match.
  const solid = scrolled || open;

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-colors duration-300 ${
        solid ? 'border-line/70 bg-paper/95 backdrop-blur-md' : 'band-deep border-transparent bg-transparent'
      }`}
    >
      <Container width="wide">
        <div className="flex h-16 items-center justify-between gap-4">
          <Logo tone={solid ? 'default' : 'inverse'} />

          <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={`rounded-control px-3 py-2 text-[0.9375rem] font-medium transition-colors ${
                  solid
                    ? 'text-ink-body hover:bg-paper-raised hover:text-ink'
                    : 'text-paper/75 hover:bg-paper/10 hover:text-paper'
                }`}
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <Button href="/login" variant={solid ? 'ghost' : 'ghost-inverse'} size="sm">
              Log in
            </Button>
            <Button href="/register" variant={solid ? 'primary' : 'glow'} size="sm">
              Try it free
            </Button>
          </div>

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className={`-mr-1.5 flex h-11 w-11 items-center justify-center rounded-control transition-colors md:hidden ${
              solid ? 'text-ink hover:bg-paper-raised' : 'text-paper hover:bg-paper/10'
            }`}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? 'Close menu' : 'Open menu'}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 8h16M4 16h16" />}
            </svg>
          </button>
        </div>
      </Container>

      {open && (
        <div id="mobile-nav" className="animate-fade-in border-t border-line bg-paper md:hidden">
          <Container width="wide">
            <nav className="flex flex-col py-3" aria-label="Mobile">
              {links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="rounded-control px-1 py-3.5 text-base font-medium text-ink-body transition-colors hover:text-ink"
                >
                  {link.label}
                </a>
              ))}
              <div className="mt-3 flex flex-col gap-2.5 border-t border-line pt-4 pb-2">
                <Button href="/register" size="lg" fullWidth onClick={() => setOpen(false)}>
                  Try it free
                </Button>
                <Button href="/login" variant="secondary" size="lg" fullWidth onClick={() => setOpen(false)}>
                  Log in
                </Button>
              </div>
            </nav>
          </Container>
        </div>
      )}
    </header>
  );
}
