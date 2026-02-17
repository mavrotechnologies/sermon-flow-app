'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { SSEClient } from '@/lib/broadcast';
import { SermonNotesDisplay } from '@/components/SermonNotesDisplay';
import { SermonSummaryDisplay } from '@/components/SermonSummaryDisplay';
import type { TranscriptSegment, DetectedScripture, SermonNote, SermonSummary, SermonNotesPayload, SermonSummaryPayload } from '@/types';

function LivePageContent() {
  const searchParams = useSearchParams();
  const roomCode = searchParams.get('room');

  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
  const [scriptures, setScriptures] = useState<DetectedScripture[]>([]);
  const [notes, setNotes] = useState<SermonNote[]>([]);
  const [isGeneratingNotes, setIsGeneratingNotes] = useState(false);
  const [summary, setSummary] = useState<SermonSummary | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'scriptures' | 'notes'>('scriptures');
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-scroll transcript to bottom
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  // Connect to SSE stream for the room
  useEffect(() => {
    if (!roomCode) return;

    const client = new SSEClient(`/api/stream?room=${roomCode}`, {
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
        setScriptures((prev) => {
          // Dedup by book+chapter+verseStart
          const key = `${scripture.book}-${scripture.chapter}-${scripture.verseStart}`;
          const exists = prev.some(s => `${s.book}-${s.chapter}-${s.verseStart}` === key);
          if (exists) return prev;
          return [...prev, scripture];
        });
      },
      onStatus: (status) => {
        setIsRecording(status.isRecording);
      },
      onClear: () => {
        setTranscript([]);
        setScriptures([]);
        setNotes([]);
        setIsGeneratingNotes(false);
        setSummary(null);
        setIsGeneratingSummary(false);
      },
      onNotes: (payload: SermonNotesPayload) => {
        setNotes(payload.notes);
        setIsGeneratingNotes(payload.isGenerating);
      },
      onSummary: (payload: SermonSummaryPayload) => {
        setSummary(payload.summary);
        setIsGeneratingSummary(payload.isGenerating);
        // Auto-switch to notes tab when summary arrives
        setActiveTab('notes');
      },
      onError: (err) => {
        setError(err);
      },
    });

    client.connect();

    return () => {
      client.disconnect();
    };
  }, [roomCode]);

  // No room code provided
  if (!roomCode) {
    return (
      <div className="min-h-screen bg-[#030303]">
        <div className="fixed inset-0 z-0">
          <div className="absolute inset-0 bg-[#030303]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-950/30 via-transparent to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-950/20 via-transparent to-transparent" />
        </div>
        <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
          <div className="absolute w-[400px] h-[300px] bg-purple-800/20 rounded-full blur-[100px]" />
          <div className="relative p-[1px] rounded-2xl bg-gradient-to-b from-purple-500/20 via-purple-500/10 to-purple-500/5 w-full max-w-md">
            <div className="rounded-2xl p-8 md:p-12 text-center bg-[#0c0c10]">
              <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                </svg>
              </div>
              <h2 className="text-2xl md:text-3xl font-semibold text-white mb-3">Room Code Required</h2>
              <p className="text-gray-400 text-base md:text-lg mb-3">
                Ask your pastor for the room code or scan the QR code displayed at the venue.
              </p>
              <p className="text-gray-500 text-sm">
                The URL should look like: /live?room=XXXXXX
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030303]">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[#030303]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-950/30 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-950/20 via-transparent to-transparent" />
        <div className="hidden md:block absolute top-1/4 right-1/4 w-[600px] h-[600px] bg-purple-900/[0.12] rounded-full blur-[120px]" />
        <div className="hidden md:block absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-blue-900/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className={`glass border-b border-white/5 ${mounted ? 'animate-fade-in' : 'opacity-0'}`}>
          <div className="max-w-7xl mx-auto px-3 md:px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-3 min-w-0">
              <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity shrink-0">
                <div className="w-8 h-8 md:w-9 md:h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 md:w-5 md:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <span className="hidden sm:inline text-lg font-semibold text-white">SermonFlow</span>
              </Link>
              <span className="px-2 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-medium rounded-full flex items-center gap-1.5 shrink-0">
                <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse" />
                Live
              </span>
              <span className="px-2 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono font-bold rounded-full shrink-0">
                {roomCode}
              </span>
            </div>

            {/* Status */}
            <div className="flex items-center gap-2 px-2.5 py-1.5 glass rounded-full border border-white/10 shrink-0">
              <span className={`w-2 h-2 rounded-full ${isConnected ? (isRecording ? 'bg-red-500 animate-pulse' : 'bg-purple-400') : 'bg-gray-500'}`} />
              <span className="text-xs font-medium text-gray-300">
                {!isConnected ? (
                  'Connecting...'
                ) : isRecording ? (
                  <span className="text-red-400">Recording</span>
                ) : (
                  <span className="text-purple-400">Connected</span>
                )}
              </span>
            </div>
          </div>
        </header>

        {/* Connection Error */}
        {error && (
          <div className={`max-w-7xl mx-auto px-3 md:px-6 py-3 ${mounted ? 'animate-fade-in' : 'opacity-0'}`}>
            <div className="rounded-xl p-3 md:p-4 bg-[#0c0c10] border border-red-500/20">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 md:w-5 md:h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <div className={`flex-1 flex items-center justify-center px-4 ${mounted ? 'animate-fade-in' : 'opacity-0'}`}>
            <div className="absolute w-[300px] h-[200px] md:w-[400px] md:h-[300px] bg-purple-800/20 rounded-full blur-[100px]" />
            <div className="relative p-[1px] rounded-2xl bg-gradient-to-b from-purple-500/20 via-purple-500/10 to-purple-500/5 w-full max-w-md">
              <div className="rounded-2xl p-8 md:p-12 text-center bg-[#0c0c10]">
                <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                  <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin" />
                </div>
                <h2 className="text-xl md:text-2xl font-semibold text-white mb-2">Connecting...</h2>
                <p className="text-gray-400 text-base">Joining room {roomCode}</p>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        {isConnected && (
          <main className="flex-1 max-w-7xl mx-auto w-full px-3 md:px-6 py-3 md:py-6 flex flex-col">
            {/* Waiting for sermon */}
            {!isRecording && transcript.length === 0 && (
              <div className={`flex-1 flex items-center justify-center min-h-[60vh] ${mounted ? 'animate-fade-in-up' : 'opacity-0'}`}>
                <div className="absolute w-[300px] h-[250px] md:w-[500px] md:h-[400px] bg-purple-800/20 rounded-full blur-[120px]" />
                <div className="relative p-[1px] rounded-2xl bg-gradient-to-b from-purple-500/20 via-purple-500/10 to-purple-500/5 w-full max-w-xl">
                  <div className="rounded-2xl px-6 md:px-14 pt-8 md:pt-12 pb-6 md:pb-10 text-center bg-[#0c0c10]">
                    <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-5 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center animate-breathe">
                      <svg
                        className="w-8 h-8 md:w-10 md:h-10 text-purple-400"
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
              <div className={`flex-1 grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-6 ${mounted ? 'animate-fade-in-up' : 'opacity-0'}`}>
                {/* Transcript Panel */}
                <div className="relative p-[1px] rounded-2xl bg-gradient-to-b from-purple-500/20 via-purple-500/10 to-purple-500/5">
                  <div className="rounded-2xl overflow-hidden flex flex-col min-h-[250px] max-h-[50vh] lg:max-h-none lg:h-[calc(100vh-180px)] bg-[#0c0c10]">
                    <div className="px-4 md:px-6 py-3 md:py-4 border-b border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-2 md:gap-3">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                          <svg className="w-4 h-4 md:w-5 md:h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div>
                          <h2 className="text-base md:text-lg font-semibold text-white">Live Transcript</h2>
                          <p className="text-xs text-gray-500">{transcript.length} segments</p>
                        </div>
                      </div>
                      {isRecording && (
                        <div className="sound-wave text-red-500">
                          <span /><span /><span /><span /><span />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 md:p-6">
                      <div className="space-y-3 md:space-y-4">
                        {transcript.map((segment) => (
                          <div key={segment.id} className="group">
                            <p className="text-gray-300 text-sm md:text-base leading-relaxed">{segment.text}</p>
                          </div>
                        ))}
                        <div ref={transcriptEndRef} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Panel — Scriptures/Notes with tabs */}
                <div className="relative p-[1px] rounded-2xl bg-gradient-to-b from-purple-500/20 via-purple-500/10 to-purple-500/5">
                  <div className="rounded-2xl overflow-hidden flex flex-col min-h-[250px] max-h-[50vh] lg:max-h-none lg:h-[calc(100vh-180px)] bg-[#0c0c10]">
                    {/* Tab Header */}
                    <div className="flex border-b border-white/10">
                      <button
                        onClick={() => setActiveTab('scriptures')}
                        className={`flex-1 px-3 py-3 md:px-6 md:py-4 text-sm font-medium transition-all relative ${
                          activeTab === 'scriptures'
                            ? 'text-purple-300 bg-purple-500/15'
                            : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                        }`}
                      >
                        {activeTab === 'scriptures' && (
                          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-blue-500" />
                        )}
                        <span className="flex items-center justify-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                          <span className="hidden sm:inline">Scriptures</span>
                          {scriptures.length > 0 && (
                            <span className="px-2 py-0.5 bg-purple-500/30 text-purple-300 text-xs rounded-full font-semibold">
                              {scriptures.length}
                            </span>
                          )}
                        </span>
                      </button>
                      <button
                        onClick={() => setActiveTab('notes')}
                        className={`flex-1 px-3 py-3 md:px-6 md:py-4 text-sm font-medium transition-all relative ${
                          activeTab === 'notes'
                            ? 'text-green-300 bg-green-500/15'
                            : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                        }`}
                      >
                        {activeTab === 'notes' && (
                          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-500 to-blue-500" />
                        )}
                        <span className="flex items-center justify-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          <span className="hidden sm:inline">Notes</span>
                          {notes.length > 0 && (
                            <span className="px-2 py-0.5 bg-green-500/30 text-green-300 text-xs rounded-full font-semibold">
                              {notes.length}
                            </span>
                          )}
                        </span>
                      </button>
                    </div>

                    {/* Tab Content */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-6">
                      {activeTab === 'scriptures' ? (
                        scriptures.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center text-center">
                            <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4">
                              <svg className="w-7 h-7 md:w-8 md:h-8 text-purple-400/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                              </svg>
                            </div>
                            <p className="text-gray-400 text-sm">Waiting for scripture references...</p>
                            <p className="text-gray-500 text-xs mt-1">Verses will appear as they&apos;re mentioned</p>
                          </div>
                        ) : (
                          <div className="space-y-3 md:space-y-4">
                            {scriptures.map((scripture) => (
                              <div
                                key={scripture.id}
                                className="rounded-xl p-4 md:p-5 bg-white/5 border border-white/5 border-l-4 border-l-purple-500"
                              >
                                <div className="text-base md:text-lg font-semibold text-white mb-2">
                                  {scripture.book} {scripture.chapter}:{scripture.verseStart}
                                  {scripture.verseEnd && scripture.verseEnd !== scripture.verseStart && `-${scripture.verseEnd}`}
                                </div>
                                {scripture.verses?.map((verse, i) => (
                                  <p key={i} className="text-gray-300 text-sm md:text-base leading-relaxed">
                                    {verse.text}
                                  </p>
                                ))}
                              </div>
                            ))}
                          </div>
                        )
                      ) : (
                        <div>
                          <SermonSummaryDisplay summary={summary} isGenerating={isGeneratingSummary} />
                          <SermonNotesDisplay notes={notes} isGenerating={isGeneratingNotes} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>
        )}

        {/* Footer */}
        <footer className="py-3 md:py-4 mt-auto">
          <p className="text-center text-xs text-gray-600">
            Powered by SermonFlow
          </p>
        </footer>
      </div>
    </div>
  );
}

export default function LivePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#030303] flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LivePageContent />
    </Suspense>
  );
}
