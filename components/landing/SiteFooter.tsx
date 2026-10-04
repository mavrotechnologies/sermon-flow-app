import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Logo } from '@/components/ui/Logo';

const columns = [
  {
    heading: 'Product',
    links: [
      { label: 'How it works', href: '#how-it-works' },
      { label: 'Features', href: '#features' },
      { label: 'Pricing', href: '#pricing' },
    ],
  },
  {
    heading: 'Account',
    links: [
      { label: 'Log in', href: '/login' },
      { label: 'Create an account', href: '/register' },
    ],
  },
  {
    heading: 'Contact',
    links: [
      { label: 'Asare Daniel', href: null },
      { label: '+233 532 828 138', href: 'tel:+233532828138' },
      { label: 'Message on WhatsApp', href: 'https://wa.me/233532828138' },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-paper">
      <Container width="wide" className="py-12 sm:py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="max-w-xs">
            <Logo />
            <p className="mt-4 text-[0.9375rem] leading-relaxed text-ink-body">
              Scripture on screen, the moment it&rsquo;s spoken. Built for churches who&rsquo;d rather everyone stayed
              in the moment.
            </p>
          </div>

          {columns.map((column) => (
            <div key={column.heading}>
              <h3 className="eyebrow text-ink-muted">{column.heading}</h3>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    {link.href === null ? (
                      <span className="text-[0.9375rem] text-ink-body">{link.label}</span>
                    ) : link.href.startsWith('#') || /^(https?:|tel:|mailto:)/.test(link.href) ? (
                      <a
                        href={link.href}
                        className="text-[0.9375rem] text-ink-body transition-colors hover:text-evergreen"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-[0.9375rem] text-ink-body transition-colors hover:text-evergreen"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[0.8125rem] text-ink-muted">
            &copy; {new Date().getFullYear()} SermonFlow. Made for churches.
          </p>
          <p className="text-[0.8125rem] text-ink-muted">
            Scripture text from public domain translations and{' '}
            <a
              href="https://scripture.api.bible"
              target="_blank"
              rel="noreferrer"
              className="underline decoration-line-strong underline-offset-2 transition-colors hover:text-evergreen"
            >
              API.Bible
            </a>
            .
          </p>
        </div>
      </Container>
    </footer>
  );
}
