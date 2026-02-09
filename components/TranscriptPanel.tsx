'use client';

import { useEffect, useRef } from 'react';
import type { TranscriptSegment, ScriptureReference } from '@/types';
import { ScriptureHighlight } from './ScriptureHighlight';

interface TranscriptPanelProps {
  segments: TranscriptSegment[];
  interimText?: string;
  onScriptureClick?: (ref: ScriptureReference) => void;
  autoScroll?: boolean;
  className?: string;
}

/**
 * Panel displaying the live transcript with highlighted scripture references
 */
export function TranscriptPanel({
  segments,
  interimText = '',
  onScriptureClick,
  autoScroll = true,
  className = '',
}: TranscriptPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new content arrives
  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [segments, interimText, autoScroll]);

  const isEmpty = segments.length === 0 && !interimText;

  return (
    <div
      ref={containerRef}
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden flex flex-col ${className}`}
    >
      {/* Header */}
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          Live Transcript
        </h2>
      </div>

      {/* Transcript Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-[200px]">
        {isEmpty ? (
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
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
              <p className="text-sm">Start recording to see transcript...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Finalized segments */}
            {segments.map((segment) => (
              <TranscriptSegmentView
                key={segment.id}
                segment={segment}
                onScriptureClick={onScriptureClick}
              />
            ))}

            {/* Interim text (currently being spoken) */}
            {interimText && (
              <p className="text-gray-500 dark:text-gray-400 italic">
                {interimText}
              </p>
            )}

            {/* Scroll anchor */}
            <div ref={bottomRef} />
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Individual transcript segment with optional scripture highlighting
 */
function TranscriptSegmentView({
  segment,
  onScriptureClick,
}: {
  segment: TranscriptSegment;
  onScriptureClick?: (ref: ScriptureReference) => void;
}) {
  // If segment has scripture references, render with highlights
  if (segment.scriptureRefs && segment.scriptureRefs.length > 0) {
    return (
      <p className="text-gray-800 dark:text-gray-200 leading-relaxed">
        <ScriptureHighlight
          text={segment.text}
          references={segment.scriptureRefs}
          onReferenceClick={onScriptureClick}
        />
      </p>
    );
  }

  // Plain text without scripture references
  return (
    <p className="text-gray-800 dark:text-gray-200 leading-relaxed">
      {segment.text}
    </p>
  );
}
