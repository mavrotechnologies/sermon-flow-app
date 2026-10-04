'use client';

import type { ElementType, ReactNode } from 'react';
import { useInView } from '@/hooks/useInView';

interface RevealProps {
  children: ReactNode;
  /** Stagger in milliseconds, for sibling cards revealing in sequence. */
  delay?: number;
  className?: string;
  as?: ElementType;
}

/**
 * Fades and lifts its children into view once. Falls back to plain visible
 * content when the user prefers reduced motion (handled in globals.css).
 */
export function Reveal({ children, delay = 0, className = '', as: Tag = 'div' }: RevealProps) {
  const [ref, inView] = useInView<HTMLDivElement>({ threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

  return (
    <Tag
      ref={ref}
      className={`reveal ${inView ? 'reveal-visible' : ''} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
