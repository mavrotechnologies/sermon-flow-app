'use client';

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
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onCancel}
    >
      <div
        className="relative p-[1px] rounded-2xl bg-gradient-to-b from-red-500/30 via-red-500/10 to-transparent max-w-sm mx-4 animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-[#0c0c10] rounded-2xl p-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${
              confirmVariant === 'danger'
                ? 'bg-red-500/10 border border-red-500/20'
                : 'bg-blue-500/10 border border-blue-500/20'
            }`}>
              <svg className={`w-5 h-5 ${confirmVariant === 'danger' ? 'text-red-400' : 'text-blue-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">{title}</h3>
            </div>
          </div>

          {/* Message */}
          <p className="text-gray-400 text-sm mb-6 leading-relaxed">{message}</p>

          {/* Buttons */}
          <div className="flex items-center gap-3 justify-end">
            <button
              onClick={onCancel}
              className="px-4 py-2.5 glass border border-white/10 hover:border-white/20 hover:bg-white/10 text-gray-300 text-sm font-medium rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className={`px-4 py-2.5 text-white text-sm font-semibold rounded-xl transition-all shadow-lg ${
                confirmVariant === 'danger'
                  ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 shadow-red-500/20'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 shadow-blue-500/20'
              }`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
