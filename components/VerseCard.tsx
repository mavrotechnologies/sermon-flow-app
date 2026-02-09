'use client';

import type { DetectedScripture } from '@/types';
import { formatReference } from '@/lib/scriptureDetector';

interface VerseCardProps {
  scripture: DetectedScripture;
  isHighlighted?: boolean;
  onClose?: () => void;
}

/**
 * Card displaying a detected scripture verse with full text
 */
export function VerseCard({
  scripture,
  isHighlighted = false,
  onClose,
}: VerseCardProps) {
  const reference = formatReference(scripture);
  const translation = scripture.verses[0]?.translation || 'KJV';

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden transition-all ${
        isHighlighted
          ? 'ring-2 ring-blue-500 shadow-blue-500/20'
          : ''
      }`}
    >
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">{reference}</h3>
          <span className="text-xs text-blue-200">{translation}</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 text-blue-200 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Verse Text */}
      <div className="p-4">
        {scripture.verses.length > 0 ? (
          <div className="space-y-2">
            {scripture.verses.map((verse) => (
              <p
                key={`${verse.chapter}-${verse.verse}`}
                className="text-gray-800 dark:text-gray-200 leading-relaxed"
              >
                <span className="text-blue-600 dark:text-blue-400 font-semibold mr-2">
                  {verse.verse}
                </span>
                {verse.text}
              </p>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 italic">
            Verse text not available
          </p>
        )}
      </div>
    </div>
  );
}
