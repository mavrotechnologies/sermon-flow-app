import type { ReactNode } from 'react';
import { Reveal } from './Reveal';

interface SectionHeadingProps {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: 'center' | 'left';
  tone?: 'default' | 'inverse';
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'center',
  tone = 'default',
}: SectionHeadingProps) {
  const alignment = align === 'center' ? 'text-center mx-auto items-center' : 'text-left items-start';
  const eyebrowTone = tone === 'inverse' ? 'text-paper/60' : 'text-evergreen';
  const titleTone = tone === 'inverse' ? 'text-paper' : '';
  const descriptionTone = tone === 'inverse' ? 'text-paper/70' : 'text-ink-body';

  return (
    <div className={`flex max-w-2xl flex-col ${alignment}`}>
      {eyebrow && (
        <Reveal>
          <p className={`eyebrow mb-3.5 ${eyebrowTone}`}>{eyebrow}</p>
        </Reveal>
      )}
      <Reveal delay={eyebrow ? 60 : 0}>
        <h2 className={`text-[1.875rem] leading-[1.12] font-semibold sm:text-[2.375rem] lg:text-[2.875rem] ${titleTone}`}>
          {title}
        </h2>
      </Reveal>
      {description && (
        <Reveal delay={120}>
          <p className={`mt-4 text-[1.0625rem] leading-relaxed sm:text-lg ${descriptionTone}`}>{description}</p>
        </Reveal>
      )}
    </div>
  );
}
