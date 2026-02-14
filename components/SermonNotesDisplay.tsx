'use client';

import type { SermonNote } from '@/types';

interface SermonNotesDisplayProps {
  notes: SermonNote[];
  isGenerating: boolean;
}

export function SermonNotesDisplay({ notes, isGenerating }: SermonNotesDisplayProps) {
  if (notes.length === 0 && !isGenerating) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center">
        <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-4">
          <svg className="w-7 h-7 md:w-8 md:h-8 text-green-400/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </div>
        <p className="text-gray-400 text-sm">AI sermon notes will appear here</p>
        <p className="text-gray-500 text-xs mt-1">Notes are generated as the sermon progresses</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 md:space-y-4">
      {notes.map((note) => (
        <div
          key={note.id}
          className="rounded-xl bg-white/5 border border-white/5 border-l-4 border-l-green-500 p-4 md:p-5"
        >
          {/* Theme badge */}
          {note.theme && (
            <div className="mb-2.5 md:mb-3">
              <span className="px-2.5 py-1 bg-green-500/15 text-green-400 text-xs font-medium rounded-full border border-green-500/20">
                {note.theme}
              </span>
            </div>
          )}

          {/* Main point */}
          <h3 className="text-white font-semibold text-sm md:text-base mb-2.5 md:mb-3 leading-snug">
            {note.mainPoint}
          </h3>

          {/* Sub-points */}
          {note.subPoints.length > 0 && (
            <ul className="space-y-1.5 mb-2.5 md:mb-3">
              {note.subPoints.map((point, i) => (
                <li key={i} className="flex items-start gap-2 text-gray-400 text-xs md:text-sm">
                  <span className="w-1.5 h-1.5 bg-gray-500 rounded-full mt-1.5 shrink-0" />
                  {point}
                </li>
              ))}
            </ul>
          )}

          {/* Key quote */}
          {note.keyQuote && (
            <blockquote className="border-l-2 border-purple-500/50 pl-3 mb-2.5 md:mb-3 italic text-gray-300 text-xs md:text-sm">
              &ldquo;{note.keyQuote}&rdquo;
            </blockquote>
          )}

          {/* Scripture references */}
          {note.scriptureReferences.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {note.scriptureReferences.map((ref, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 bg-purple-500/15 text-purple-300 text-xs font-medium rounded-full border border-purple-500/20"
                >
                  {ref}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Generating indicator */}
      {isGenerating && (
        <div className="flex items-center gap-3 p-3 md:p-4 rounded-xl bg-green-500/5 border border-green-500/10">
          <div className="w-5 h-5 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-green-400 text-sm font-medium">Generating notes...</span>
        </div>
      )}
    </div>
  );
}
