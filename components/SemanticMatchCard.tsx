'use client';

import type { SemanticMatch } from '@/lib/semanticSearch';

interface SemanticMatchCardProps {
  match: SemanticMatch;
  onSelect?: (match: SemanticMatch) => void;
}

/**
 * Display card for a semantic Bible verse match
 * Shows confidence indicator and similarity score
 */
export function SemanticMatchCard({ match, onSelect }: SemanticMatchCardProps) {
  const reference = `${match.book} ${match.chapter}:${match.verse}`;

  const confidenceConfig = {
    high: {
      label: 'High match',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      borderColor: 'border-green-300 dark:border-green-700',
      badgeColor: 'bg-green-500',
      textColor: 'text-green-700 dark:text-green-400',
    },
    medium: {
      label: 'Possible match',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      borderColor: 'border-yellow-300 dark:border-yellow-700',
      badgeColor: 'bg-yellow-500',
      textColor: 'text-yellow-700 dark:text-yellow-400',
    },
    low: {
      label: 'Low confidence',
      bgColor: 'bg-gray-50 dark:bg-gray-800/50',
      borderColor: 'border-gray-300 dark:border-gray-700',
      badgeColor: 'bg-gray-400',
      textColor: 'text-gray-600 dark:text-gray-400',
    },
  };

  const config = confidenceConfig[match.confidence];
  const percentage = Math.round(match.similarity * 100);

  return (
    <div
      className={`rounded-lg border-2 ${config.borderColor} ${config.bgColor} p-4 cursor-pointer hover:shadow-md transition-shadow`}
      onClick={() => onSelect?.(match)}
    >
      {/* Header with reference and confidence */}
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-bold text-gray-800 dark:text-gray-200">
          {reference}
        </h4>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium ${config.textColor}`}>
            {percentage}%
          </span>
          <span
            className={`w-2 h-2 rounded-full ${config.badgeColor}`}
            title={config.label}
          />
        </div>
      </div>

      {/* Verse text */}
      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
        {match.text}
      </p>

      {/* Confidence label */}
      <div className="mt-2 flex items-center gap-1">
        <span className={`text-xs ${config.textColor}`}>
          {config.label}
        </span>
      </div>
    </div>
  );
}

interface SemanticMatchesListProps {
  matches: SemanticMatch[];
  isSearching?: boolean;
  isLoading?: boolean;
  loadingProgress?: string;
  onSelect?: (match: SemanticMatch) => void;
}

/**
 * List of semantic matches with loading states
 */
export function SemanticMatchesList({
  matches,
  isSearching,
  isLoading,
  loadingProgress,
  onSelect,
}: SemanticMatchesListProps) {
  if (isLoading) {
    return (
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <div>
            <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
              Loading AI Model
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-500">
              {loadingProgress || 'Preparing semantic search...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <svg
          className="w-10 h-10 mx-auto mb-2 opacity-50"
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
        <p className="text-sm">
          {isSearching ? 'Searching...' : 'AI-detected verses will appear here'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {isSearching && (
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-2">
          <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          <span>Analyzing...</span>
        </div>
      )}

      {matches.map((match, index) => (
        <SemanticMatchCard
          key={`${match.book}-${match.chapter}-${match.verse}-${index}`}
          match={match}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
