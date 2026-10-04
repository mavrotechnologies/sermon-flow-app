'use client';

import React from 'react';
import type { ScriptureReference } from '@/types';

interface ScriptureHighlightProps {
  text: string;
  references: ScriptureReference[];
  onReferenceClick?: (ref: ScriptureReference) => void;
}

/**
 * Highlights scripture references within a run of transcript text and makes
 * them clickable, to reveal the matching verse card.
 *
 * References are located by their `rawText` — the words the detector actually
 * matched. A reference whose `rawText` came from the normalised form of the
 * speech ("chapter four verse three" → "4:3") won't be found in the original
 * text; that simply renders as plain text rather than failing.
 */
export function ScriptureHighlight({ text, references, onReferenceClick }: ScriptureHighlightProps) {
  if (references.length === 0) {
    return <>{text}</>;
  }

  const haystack = text.toLowerCase();

  // Collect every occurrence of every reference, so a verse mentioned twice in
  // the same breath is clickable both times.
  const matches: { ref: ScriptureReference; start: number; end: number }[] = [];
  for (const ref of references) {
    const needle = ref.rawText?.toLowerCase();
    if (!needle) continue;

    let from = 0;
    for (;;) {
      const at = haystack.indexOf(needle, from);
      if (at === -1) break;
      matches.push({ ref, start: at, end: at + needle.length });
      from = at + needle.length;
    }
  }

  if (matches.length === 0) {
    return <>{text}</>;
  }

  // Earliest first; on a tie the longer match wins, so "John 3:16" beats "John 3".
  matches.sort((a, b) => a.start - b.start || b.end - a.end);

  const parts: React.ReactNode[] = [];
  let cursor = 0;

  matches.forEach(({ ref, start, end }, order) => {
    // Skip anything overlapping a match already emitted.
    if (start < cursor) return;

    if (start > cursor) {
      parts.push(text.slice(cursor, start));
    }

    const label = `${ref.book} ${ref.chapter}:${ref.verseStart}${
      ref.verseEnd && ref.verseEnd !== ref.verseStart ? `-${ref.verseEnd}` : ''
    }`;

    parts.push(
      <button
        key={`${ref.id}-${order}-${start}`}
        type="button"
        onClick={() => onReferenceClick?.(ref)}
        className="mx-px cursor-pointer rounded-[0.25rem] bg-evergreen-soft px-1 font-semibold text-evergreen underline decoration-evergreen/35 decoration-2 underline-offset-2 transition-colors hover:bg-evergreen hover:text-paper hover:decoration-transparent"
        title={`Jump to ${label}`}
      >
        {text.slice(start, end)}
      </button>
    );

    cursor = end;
  });

  if (cursor < text.length) {
    parts.push(text.slice(cursor));
  }

  return <>{parts}</>;
}
