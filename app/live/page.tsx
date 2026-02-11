'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { TranscriptPanel } from '@/components/TranscriptPanel';
import { ScripturePanel } from '@/components/ScripturePanel';
import { SSEClient } from '@/lib/broadcast';
import type { TranscriptSegment, DetectedScripture } from '@/types';

export default function LivePage() {
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
  const [scriptures, setScriptures] = useState<DetectedScripture[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Connect to SSE stream
  useEffect(() => {
    const client = new SSEClient('/api/stream', {
      onConnect: () => {
        setIsConnected(true);
        setError(null);
      },
      onDisconnect: () => {
        setIsConnected(false);
      },
      onTranscript: (segment) => {
        setTranscript((prev) => [...prev, segment]);
      },
      onScripture: (scripture) => {
        setScriptures((prev) => [...prev, scripture]);
      },
      onStatus: (status) => {
        setIsRecording(status.isRecording);
      },
      onClear: () => {
        setTranscript([]);
        setScriptures([]);
      },
      onError: (err) => {
        setError(err);
      },
    });

    client.connect();

    return () => {
      client.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#030303]">
      {/* Background - matching landing page dark atmosphere */}
      <div className="fixed inset-0 z-0">
        {/* Very dark base */}
        <div className="absolute inset-0 bg-[#030303]" />
        {/* Subtle top gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-950/30 via-transparent to-transparent" />
        {/* Subtle center purple glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-950/20 via-transparent to-transparent" />
        {/* Floating orbs - more visible */}
        <div className="absolute top-1/4 right-1/4 w-[600px] h-[600px] bg-purple-900/[0.12] rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-blue-900/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className={`glass border-b border-white/5 ${mounted ? 'animate-fade-in' : 'opacity-0'}`}>
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <span className="text-lg font-semibold text-white">SermonFlow</span>
              </Link>
              <span className="px-2.5 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-medium rounded-full flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse" />
                Live
              </span>
            </div>

            {/* Status - Combined indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 glass rounded-full border border-white/10">
              <span className={`w-2 h-2 rounded-full ${isConnected ? (isRecording ? 'bg-red-500 animate-pulse' : 'bg-purple-400') : 'bg-gray-500'}`} />
              <span className="text-xs font-medium text-gray-300">
                {!isConnected ? (
                  'Connecting...'
                ) : isRecording ? (
                  <span className="text-red-400">Recording</span>
                ) : (
                  <>
                    <span className="text-purple-400">Connected</span>
                    <span className="text-gray-500 mx-1">·</span>
                    <span className="text-gray-400">Waiting</span>
                  </>
                )}
              </span>
            </div>
          </div>
        </header>

        {/* Connection Error */}
        {error && (
          <div className={`max-w-7xl mx-auto px-4 md:px-6 py-4 ${mounted ? 'animate-fade-in' : 'opacity-0'}`}>
            <div className="rounded-xl p-4 bg-[#0c0c10] border border-red-500/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <p className="text-red-400 text-sm font-medium">{error}</p>
                  <p className="text-red-400/60 text-xs mt-0.5">Trying to reconnect...</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Waiting for connection */}
        {!isConnected && !error && (
          <div className={`flex-1 flex items-center justify-center ${mounted ? 'animate-fade-in' : 'opacity-0'}`}>
            {/* Glow behind card */}
            <div className="absolute w-[400px] h-[300px] bg-purple-800/20 rounded-full blur-[100px]" />
            <div className="relative p-[1px] rounded-2xl bg-gradient-to-b from-purple-500/20 via-purple-500/10 to-purple-500/5">
              <div className="rounded-2xl p-12 md:p-16 text-center max-w-md bg-[#0c0c10]">
                <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-6 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                  <div className="w-8 h-8 md:w-10 md:h-10 border-3 border-purple-500 border-t-transparent rounded-full animate-spin" />
                </div>
                <h2 className="text-2xl md:text-3xl font-semibold text-white mb-3">Connecting...</h2>
                <p className="text-gray-400 text-base md:text-lg">Establishing connection to live stream</p>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        {isConnected && (
          <main className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-6 py-6">
            {/* Waiting for sermon */}
            {!isRecording && transcript.length === 0 && (
              <div className={`flex items-center justify-center min-h-[calc(100vh-250px)] ${mounted ? 'animate-fade-in-up' : 'opacity-0'}`}>
                {/* Glow behind card - more visible */}
                <div className="absolute w-[500px] h-[400px] bg-purple-800/20 rounded-full blur-[120px]" />
                <div className="relative p-[1px] rounded-2xl bg-gradient-to-b from-purple-500/20 via-purple-500/10 to-purple-500/5">
                  <div className="rounded-2xl px-10 md:px-14 pt-10 md:pt-12 pb-8 md:pb-10 text-center max-w-xl bg-[#0c0c10]">
                    <div className="w-18 h-18 md:w-20 md:h-20 mx-auto mb-5 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center animate-breathe">
                      <svg
                        className="w-9 h-9 md:w-10 md:h-10 text-purple-400"
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
                    </div>
                    <h2 className="text-xl md:text-2xl font-semibold text-white mb-2">
                      Waiting for sermon to begin...
                    </h2>
                    <p className="text-gray-400 text-sm md:text-base">
                      The transcript will appear here when the pastor starts speaking.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Two-Column Layout */}
            {(isRecording || transcript.length > 0) && (
              <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 ${mounted ? 'animate-fade-in-up' : 'opacity-0'}`}>
                {/* Transcript Panel */}
                <div className="relative p-[1px] rounded-2xl bg-gradient-to-b from-purple-500/20 via-purple-500/10 to-purple-500/5">
                  <div className="rounded-2xl overflow-hidden flex flex-col h-[calc(100vh-200px)] bg-[#0c0c10]">
                    <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div>
                          <h2 className="text-lg font-semibold text-white">Live Transcript</h2>
                          <p className="text-xs text-gray-500">{transcript.length} segments</p>
                        </div>
                      </div>
                      {isRecording && (
                        <div className="sound-wave text-red-500">
                          <span /><span /><span /><span /><span />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 overflow-y-auto p-6">
                      <div className="space-y-4">
                        {transcript.map((segment) => (
                          <div key={segment.id} className="group">
                            <p className="text-gray-300 leading-relaxed">{segment.text}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Scripture Panel */}
                <div className="relative p-[1px] rounded-2xl bg-gradient-to-b from-purple-500/20 via-purple-500/10 to-purple-500/5">
                  <div className="rounded-2xl overflow-hidden flex flex-col h-[calc(100vh-200px)] bg-[#0c0c10]">
                    <div className="px-6 py-4 border-b border-white/5 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                        <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-white">Detected Scriptures</h2>
                        <p className="text-xs text-gray-500">{scriptures.length} verses</p>
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6">
                      {scriptures.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center">
                          <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4">
                            <svg className="w-8 h-8 text-purple-400/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                          </div>
                          <p className="text-gray-400 text-sm">Waiting for scripture references...</p>
                          <p className="text-gray-500 text-xs mt-1">Verses will appear as they&apos;re mentioned</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {scriptures.map((scripture) => (
                            <div
                              key={scripture.id}
                              className="rounded-xl p-5 bg-white/5 border border-white/5 border-l-4 border-l-purple-500"
                            >
                              <div className="text-lg font-semibold text-white mb-2">
                                {scripture.book} {scripture.chapter}:{scripture.verseStart}
                                {scripture.verseEnd && scripture.verseEnd !== scripture.verseStart && `-${scripture.verseEnd}`}
                              </div>
                              {scripture.verses?.map((verse, i) => (
                                <p key={i} className="text-gray-300 text-sm leading-relaxed">
                                  {verse.text}
                                </p>
                              ))}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>
        )}

        {/* Footer - subtle */}
        <footer className="py-4 mt-auto">
          <p className="text-center text-xs text-gray-600">
            Powered by SermonFlow
          </p>
        </footer>
      </div>
    </div>
  );
}
