import Link from 'next/link';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'glow' | 'inverse' | 'outline-inverse' | 'ghost-inverse';
type ButtonSize = 'sm' | 'md' | 'lg';

const base =
  'inline-flex items-center justify-center gap-2 rounded-control font-sans font-semibold whitespace-nowrap transition-all duration-200 active:scale-[0.98] disabled:opacity-55 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-offset-2';

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-evergreen text-paper shadow-soft hover:bg-evergreen-hover hover:shadow-lifted hover:-translate-y-px active:translate-y-0 focus-visible:outline-evergreen',
  secondary:
    'bg-paper text-ink border border-line hover:border-line-strong hover:bg-paper-raised focus-visible:outline-evergreen',
  ghost:
    'text-ink-body hover:text-ink hover:bg-paper-raised focus-visible:outline-evergreen',
  // The evergreen-deep bands. `glow` is the primary action there, `inverse` a
  // quieter solid, `outline-inverse` and `ghost-inverse` the secondary ones.
  glow:
    'bg-amber-glow text-evergreen-deep shadow-soft hover:bg-amber-glow-hover hover:shadow-lifted hover:-translate-y-px active:translate-y-0',
  inverse:
    'bg-paper text-evergreen-deep hover:bg-paper-raised shadow-soft hover:-translate-y-px active:translate-y-0',
  'outline-inverse':
    'border border-paper/25 bg-transparent text-paper hover:bg-paper/10 hover:border-paper/40',
  'ghost-inverse': 'text-paper/75 hover:text-paper hover:bg-paper/10',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'h-9 px-3.5 text-sm',
  md: 'h-11 px-5 text-[0.9375rem]',
  lg: 'h-13 px-6 text-base',
};

interface SharedProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
  className?: string;
  /** Stretch to the container width — the default on mobile for primary CTAs. */
  fullWidth?: boolean;
}

function classesFor({ variant = 'primary', size = 'md', fullWidth, className = '' }: SharedProps) {
  return [base, variants[variant], sizes[size], fullWidth ? 'w-full' : '', className]
    .filter(Boolean)
    .join(' ');
}

type ButtonAsLink = SharedProps & { href: string } & Omit<
    ComponentPropsWithoutRef<typeof Link>,
    'href' | 'className' | 'children'
  >;

type ButtonAsButton = SharedProps & { href?: undefined } & Omit<
    ComponentPropsWithoutRef<'button'>,
    'className' | 'children'
  >;

export function Button(props: ButtonAsLink | ButtonAsButton) {
  const { variant, size, children, className, fullWidth, ...rest } = props;
  const classes = classesFor({ variant, size, className, fullWidth, children });

  if (rest.href !== undefined) {
    const { href, ...linkProps } = rest as ButtonAsLink;
    const isExternal = /^(https?:|mailto:|tel:)/.test(href);

    if (isExternal) {
      return (
        <a href={href} className={classes} {...(linkProps as ComponentPropsWithoutRef<'a'>)}>
          {children}
        </a>
      );
    }

    return (
      <Link href={href} className={classes} {...linkProps}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...(rest as ComponentPropsWithoutRef<'button'>)}>
      {children}
    </button>
  );
}
