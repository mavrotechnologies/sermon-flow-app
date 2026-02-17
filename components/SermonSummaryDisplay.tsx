'use client';

import type { SermonSummary } from '@/types';

interface SermonSummaryDisplayProps {
  summary: SermonSummary | null;
  isGenerating: boolean;
}

export function SermonSummaryDisplay({ summary, isGenerating }: SermonSummaryDisplayProps) {
  if (!summary && !isGenerating) return null;

  if (isGenerating && !summary) {
    return (
      <div className="rounded-2xl p-6 md:p-8 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-blue-500/5 border border-blue-500/20 mb-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 border-3 border-blue-400 border-t-transparent rounded-full animate-spin shrink-0" />
          <div>
            <h3 className="text-white font-semibold text-base">Generating Sermon Summary...</h3>
            <p className="text-gray-400 text-sm mt-0.5">Analyzing all notes to create a comprehensive overview</p>
          </div>
        </div>
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="rounded-2xl overflow-hidden border border-blue-500/20 mb-4">
      {/* Header with gradient */}
      <div className="px-5 md:px-6 py-4 md:py-5 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-blue-600/20 border-b border-blue-500/10">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="min-w-0">
            <h2 className="text-lg md:text-xl font-bold text-white leading-snug">{summary.title}</h2>
            <p className="text-blue-300/60 text-xs mt-1">Sermon Summary</p>
          </div>
        </div>
      </div>

      <div className="px-5 md:px-6 py-4 md:py-5 space-y-5 bg-[#0c0c10]/80">
        {/* Overview */}
        {summary.overview && (
          <p className="text-gray-300 text-sm md:text-base leading-relaxed">{summary.overview}</p>
        )}

        {/* Theme badges */}
        {summary.mainThemes.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {summary.mainThemes.map((theme, i) => (
              <span
                key={i}
                className="px-3 py-1 bg-gradient-to-r from-blue-500/15 to-purple-500/15 text-blue-300 text-xs font-medium rounded-full border border-blue-500/20"
              >
                {theme}
              </span>
            ))}
          </div>
        )}

        {/* Key Points */}
        {summary.keyPoints.length > 0 && (
          <div>
            <h4 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              Key Points
            </h4>
            <div className="space-y-2.5">
              {summary.keyPoints.map((kp, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-gray-300 text-sm leading-relaxed">{kp.point}</p>
                    {kp.scripture && (
                      <span className="inline-block mt-1 px-2 py-0.5 bg-purple-500/15 text-purple-300 text-xs font-medium rounded-full border border-purple-500/20">
                        {kp.scripture}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Key Quotes */}
        {summary.keyQuotes.length > 0 && (
          <div>
            <h4 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Key Quotes
            </h4>
            <div className="space-y-2.5">
              {summary.keyQuotes.map((quote, i) => (
                <blockquote
                  key={i}
                  className="border-l-2 border-purple-500/50 pl-3 py-1 italic text-gray-300 text-sm leading-relaxed"
                >
                  &ldquo;{quote}&rdquo;
                </blockquote>
              ))}
            </div>
          </div>
        )}

        {/* All Scriptures */}
        {summary.scripturesSummary.length > 0 && (
          <div>
            <h4 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Scriptures Referenced
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {summary.scripturesSummary.map((ref, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 bg-blue-500/10 text-blue-300 text-xs font-medium rounded-full border border-blue-500/20"
                >
                  {ref}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Closing Thought */}
        {summary.closingThought && (
          <div className="rounded-xl p-4 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-blue-500/5 border border-white/5">
            <p className="text-gray-200 text-sm md:text-base leading-relaxed font-medium">
              {summary.closingThought}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
