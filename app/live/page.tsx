'use client';

import { useState, useEffect, useCallback } from 'react';
import { TranscriptPanel } from '@/components/TranscriptPanel';
import { ScripturePanel } from '@/components/ScripturePanel';
import { StatusIndicator } from '@/components/StatusIndicator';
import { SSEClient } from '@/lib/broadcast';
import type { TranscriptSegment, DetectedScripture } from '@/types';

export default function LivePage() {
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
  const [scriptures, setScriptures] = useState<DetectedScripture[]>([]);
  const [error, setError] = useState<string | null>(null);

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
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header - minimal for projection */}
      <header className="bg-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-100">
              SermonFlow
            </h1>
            <span className="px-2 py-0.5 bg-green-900/50 text-green-300 text-xs font-medium rounded">
              Live
            </span>
          </div>

          <StatusIndicator
            isRecording={isRecording}
            isConnected={isConnected}
          />
        </div>
      </header>

      {/* Connection Error */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-4">
            <p className="text-red-300 text-sm">{error}</p>
            <p className="text-red-400 text-xs mt-1">
              Trying to reconnect...
            </p>
          </div>
        </div>
      )}

      {/* Waiting for connection */}
      {!isConnected && !error && (
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-400">Connecting to live stream...</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      {isConnected && (
        <main className="max-w-7xl mx-auto px-4 py-6">
          {/* Waiting for sermon */}
          {!isRecording && transcript.length === 0 && (
            <div className="bg-gray-800 rounded-lg p-12 text-center">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-gray-600"
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
              <h2 className="text-xl font-semibold text-gray-300 mb-2">
                Waiting for sermon to begin...
              </h2>
              <p className="text-gray-500">
                The transcript will appear here when the pastor starts speaking.
              </p>
            </div>
          )}

          {/* Two-Column Layout */}
          {(isRecording || transcript.length > 0) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Transcript Panel */}
              <TranscriptPanel
                segments={transcript}
                className="h-[calc(100vh-200px)] bg-gray-800"
              />

              {/* Scripture Panel */}
              <ScripturePanel
                scriptures={scriptures}
                className="h-[calc(100vh-200px)] bg-gray-800"
              />
            </div>
          )}
        </main>
      )}

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 py-2">
        <p className="text-center text-xs text-gray-500">
          Powered by SermonFlow
        </p>
      </footer>
    </div>
  );
}
