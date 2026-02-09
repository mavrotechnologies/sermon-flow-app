'use client';

import { useEffect, useRef } from 'react';
import type { DetectedScripture } from '@/types';
import { VerseCard } from './VerseCard';

interface ScripturePanelProps {
  scriptures: DetectedScripture[];
  highlightedId?: string;
  onRemove?: (id: string) => void;
  autoScroll?: boolean;
  className?: string;
}

/**
 * Panel displaying all detected scripture references
 */
export function ScripturePanel({
  scriptures,
  highlightedId,
  onRemove,
  autoScroll = true,
  className = '',
}: ScripturePanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll when new scriptures are added
  useEffect(() => {
    if (autoScroll && bottomRef.current && scriptures.length > 0) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [scriptures, autoScroll]);

  // Scroll to highlighted scripture
  useEffect(() => {
    if (highlightedId) {
      const element = document.getElementById(`scripture-${highlightedId}`);
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlightedId]);

  return (
    <div
      ref={containerRef}
      className={`bg-gray-50 dark:bg-gray-900 rounded-lg shadow-lg overflow-hidden flex flex-col ${className}`}
    >
      {/* Header */}
      <div className="px-4 py-3 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          Detected Scriptures
        </h2>
        {scriptures.length > 0 && (
          <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-sm rounded-full">
            {scriptures.length}
          </span>
        )}
      </div>

      {/* Scripture List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[200px]">
        {scriptures.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500">
            <div className="text-center">
              <svg
                className="w-12 h-12 mx-auto mb-2 opacity-50"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
              <p className="text-sm">Scripture references will appear here...</p>
            </div>
          </div>
        ) : (
          <>
            {scriptures.map((scripture) => (
              <div
                key={scripture.id}
                id={`scripture-${scripture.id}`}
              >
                <VerseCard
                  scripture={scripture}
                  isHighlighted={scripture.id === highlightedId}
                  onClose={onRemove ? () => onRemove(scripture.id) : undefined}
                />
              </div>
            ))}
            <div ref={bottomRef} />
          </>
        )}
      </div>
    </div>
  );
}
