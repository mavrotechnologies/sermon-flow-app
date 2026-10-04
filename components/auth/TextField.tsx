'use client';

import { useId, useState, type ComponentPropsWithoutRef, type ReactNode } from 'react';

interface TextFieldProps extends Omit<ComponentPropsWithoutRef<'input'>, 'className' | 'id'> {
  label: string;
  error?: string;
  hint?: ReactNode;
  /** Adds a show/hide toggle. Use with type="password". */
  revealable?: boolean;
}

export function TextField({ label, error, hint, revealable, type = 'text', ...props }: TextFieldProps) {
  const id = useId();
  const [revealed, setRevealed] = useState(false);
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  const inputType = revealable && revealed ? 'text' : type;

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[0.875rem] font-semibold text-ink">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={inputType}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`h-12 w-full rounded-control border bg-paper px-3.5 text-[0.9375rem] text-ink transition-all placeholder:text-ink-muted/70 focus:shadow-[0_0_0_4px_rgba(31,93,76,0.10)] ${
            revealable ? 'pr-16' : ''
          } ${error ? 'border-danger/50' : 'border-line hover:border-line-strong focus:border-evergreen'}`}
          {...props}
        />
        {revealable && (
          <button
            type="button"
            onClick={() => setRevealed((value) => !value)}
            className="absolute inset-y-0 right-0 px-3.5 text-[0.8125rem] font-semibold text-ink-muted transition-colors hover:text-evergreen"
          >
            {revealed ? 'Hide' : 'Show'}
          </button>
        )}
      </div>
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-[0.8125rem] text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-[0.8125rem] text-ink-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
