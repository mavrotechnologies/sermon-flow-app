'use client';

import React from 'react';
import type { ScriptureReference } from '@/types';

interface ScriptureHighlightProps {
  text: string;
  references: ScriptureReference[];
  onReferenceClick?: (ref: ScriptureReference) => void;
}

/**
 * Highlights scripture references within text
 * Makes them clickable to scroll to the verse
 */
export function ScriptureHighlight({
  text,
  references,
  onReferenceClick,
}: ScriptureHighlightProps) {
  if (references.length === 0) {
    return <>{text}</>;
  }

  // Sort references by their position in the text
  const sortedRefs = [...references].sort((a, b) => {
    const aIndex = text.toLowerCase().indexOf(a.rawText.toLowerCase());
    const bIndex = text.toLowerCase().indexOf(b.rawText.toLowerCase());
    return aIndex - bIndex;
  });

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  sortedRefs.forEach((ref, index) => {
    const refIndex = text.toLowerCase().indexOf(ref.rawText.toLowerCase(), lastIndex);

    if (refIndex === -1) return;

    // Add text before the reference
    if (refIndex > lastIndex) {
      parts.push(text.slice(lastIndex, refIndex));
    }

    // Add the highlighted reference
    const actualText = text.slice(refIndex, refIndex + ref.rawText.length);
    parts.push(
      <button
        key={`${ref.id}-${index}`}
        onClick={() => onReferenceClick?.(ref)}
        className="inline-block px-1.5 py-0.5 mx-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded font-medium hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-colors cursor-pointer"
        title={`Click to view ${ref.book} ${ref.chapter}:${ref.verseStart}${ref.verseEnd ? `-${ref.verseEnd}` : ''}`}
      >
        {actualText}
      </button>
    );

    lastIndex = refIndex + ref.rawText.length;
  });

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return <>{parts}</>;
}
