'use client';

import { useEffect } from 'react';
import { AlertIcon } from '@/components/ui/icons';

interface ConfirmDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmVariant?: 'danger' | 'primary';
}

export function ConfirmDialog({
  isOpen,
  onConfirm,
  onCancel,
  title,
  message,
  confirmLabel = 'Confirm',
  confirmVariant = 'danger',
}: ConfirmDialogProps) {
  // Escape to dismiss — expected of any modal.
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const isDanger = confirmVariant === 'danger';

  return (
    <div
      className="parchment animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-evergreen-deep/45 p-4 backdrop-blur-sm"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="animate-scale-in w-full max-w-sm rounded-card border border-line bg-paper p-6 shadow-deep"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.625rem] ${
              isDanger ? 'bg-danger-soft text-danger' : 'bg-evergreen-soft text-evergreen'
            }`}
          >
            <AlertIcon className="h-5 w-5" />
          </span>
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>

        <p className="mt-4 text-[0.9375rem] leading-relaxed text-ink-body">{message}</p>

        <div className="mt-6 flex items-center justify-end gap-2.5">
          <button
            onClick={onCancel}
            className="flex h-11 items-center rounded-control border border-line bg-paper px-4 text-[0.9375rem] font-semibold text-ink transition-all hover:border-line-strong hover:bg-paper-raised active:scale-[0.98]"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex h-11 items-center rounded-control px-4 text-[0.9375rem] font-semibold text-paper shadow-soft transition-all active:scale-[0.98] ${
              isDanger ? 'bg-danger hover:bg-danger-hover' : 'bg-evergreen hover:bg-evergreen-hover'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
