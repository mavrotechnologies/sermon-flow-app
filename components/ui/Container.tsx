import type { ElementType, ReactNode } from 'react';

const widths = {
  narrow: 'max-w-3xl',
  default: 'max-w-5xl',
  wide: 'max-w-6xl',
} as const;

interface ContainerProps {
  children: ReactNode;
  /** Content measure. `narrow` for prose, `wide` for card grids. */
  width?: keyof typeof widths;
  className?: string;
  as?: ElementType;
}

export function Container({ children, width = 'default', className = '', as: Tag = 'div' }: ContainerProps) {
  return <Tag className={`mx-auto w-full px-5 sm:px-6 lg:px-8 ${widths[width]} ${className}`}>{children}</Tag>;
}
