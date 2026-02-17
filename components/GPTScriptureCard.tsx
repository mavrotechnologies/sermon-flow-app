'use client';

import type { GPTDetectedScripture } from '@/hooks/useGPTScriptureDetection';

interface GPTScriptureCardProps {
  scripture: GPTDetectedScripture;
  onSelect?: (scripture: GPTDetectedScripture) => void;
  renderActions?: (scripture: GPTDetectedScripture) => React.ReactNode;
}

/**
 * Display card for a GPT-detected Bible scripture
 */
export function GPTScriptureCard({ scripture, onSelect, renderActions }: GPTScriptureCardProps) {
  const reference = scripture.verseEnd
    ? `${scripture.book} ${scripture.chapter}:${scripture.verse}-${scripture.verseEnd}`
    : `${scripture.book} ${scripture.chapter}:${scripture.verse}`;

  const confidenceConfig = {
    high: {
      label: 'Direct Quote',
      borderColor: 'border-green-500',
      badgeColor: 'bg-green-500/20 text-green-400 border-green-500/30',
      iconBg: 'from-green-500/20 to-emerald-500/20',
    },
    medium: {
      label: 'Paraphrase',
      borderColor: 'border-blue-500',
      badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      iconBg: 'from-blue-500/20 to-cyan-500/20',
    },
    low: {
      label: 'Possible Reference',
      borderColor: 'border-gray-500',
      badgeColor: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      iconBg: 'from-gray-500/20 to-gray-600/20',
    },
  };

  const config = confidenceConfig[scripture.confidence];

  return (
    <div
      className={`glass rounded-xl p-5 border-l-4 ${config.borderColor} hover-lift cursor-pointer transition-all`}
      onClick={() => onSelect?.(scripture)}
    >
      {/* Header with reference and confidence */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${config.iconBg} flex items-center justify-center`}>
            <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div>
            <h4 className="font-semibold text-white text-lg">
              {reference}
            </h4>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {renderActions?.(scripture)}
          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${config.badgeColor}`}>
            {config.label}
          </span>
        </div>
      </div>

      {/* Reason/explanation */}
      <p className="text-sm text-gray-400 leading-relaxed">
        {scripture.reason}
      </p>

      {/* Verse text if available */}
      {scripture.text && (
        <div className="mt-3 p-3 bg-white/5 rounded-lg border-l-2 border-white/20">
          <p className="text-sm text-gray-300 leading-relaxed italic">
            &quot;{scripture.text}&quot;
          </p>
        </div>
      )}
    </div>
  );
}

interface GPTScriptureListProps {
  scriptures: GPTDetectedScripture[];
  isDetecting?: boolean;
  error?: string | null;
  onSelect?: (scripture: GPTDetectedScripture) => void;
  renderActions?: (scripture: GPTDetectedScripture) => React.ReactNode;
}

/**
 * List of GPT-detected scriptures with loading states
 */
export function GPTScriptureList({
  scriptures,
  isDetecting,
  error,
  onSelect,
  renderActions,
}: GPTScriptureListProps) {
  if (error) {
    return (
      <div className="glass border border-red-500/30 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-sm text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  if (scriptures.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-purple-400/50"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
        </div>
        <p className="text-gray-400 text-sm">
          {isDetecting ? 'Analyzing sermon...' : 'AI-detected references will appear here'}
        </p>
        <p className="text-gray-500 text-xs mt-1">
          {isDetecting ? 'Listening for scripture mentions' : 'Scripture will be detected automatically'}
        </p>
        {isDetecting && (
          <div className="mt-4 flex items-center gap-2 text-purple-400">
            <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs">Listening...</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {isDetecting && (
        <div className="flex items-center gap-2 text-xs text-purple-400 mb-2 px-2">
          <div className="w-3 h-3 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <span>Analyzing...</span>
        </div>
      )}

      {scriptures.map((scripture) => (
        <GPTScriptureCard
          key={scripture.id}
          scripture={scripture}
          onSelect={onSelect}
          renderActions={renderActions}
        />
      ))}
    </div>
  );
}
