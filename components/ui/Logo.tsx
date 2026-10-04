import Link from 'next/link';

interface LogoProps {
  /** `inverse` for use on the evergreen-deep footer and auth panel. */
  tone?: 'default' | 'inverse';
  href?: string;
  className?: string;
}

export function Logo({ tone = 'default', href = '/', className = '' }: LogoProps) {
  const mark = tone === 'inverse' ? 'bg-paper text-evergreen-deep' : 'bg-evergreen text-paper';
  const word = tone === 'inverse' ? 'text-paper' : 'text-ink';

  const content = (
    <>
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[0.5rem] ${mark}`}>
        {/* Open book with a soundwave spine — scripture + speech in one mark */}
        <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.7}
            d="M12 6.5C10.4 5.2 8.2 4.6 5.2 4.6a.7.7 0 0 0-.7.7v11.4c0 .4.3.7.7.7 3 0 5.2.6 6.8 1.9 1.6-1.3 3.8-1.9 6.8-1.9a.7.7 0 0 0 .7-.7V5.3a.7.7 0 0 0-.7-.7c-3 0-5.2.6-6.8 1.9Z"
          />
          <path strokeLinecap="round" strokeWidth={1.7} d="M12 6.9v11.6" />
        </svg>
      </span>
      <span className={`font-display text-[1.0625rem] font-semibold tracking-tight ${word}`}>SermonFlow</span>
    </>
  );

  const classes = `flex items-center gap-2.5 transition-opacity hover:opacity-85 ${className}`;

  if (!href) return <span className={classes}>{content}</span>;

  return (
    <Link href={href} className={classes} aria-label="SermonFlow home">
      {content}
    </Link>
  );
}
