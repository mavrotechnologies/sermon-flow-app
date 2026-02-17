'use client';

import { useCallback, useRef, useEffect } from 'react';
import type { TranscriptSegment, DetectedScripture, SermonNotesPayload, SermonSummaryPayload } from '@/types';

interface QueuedMessage {
  type: string;
  payload: unknown;
  room: string;
  retries: number;
}

const MAX_QUEUE_SIZE = 100;
const RETRY_INTERVAL_MS = 3000;
const MAX_RETRIES = 5;

/**
 * Fire-and-forget POST helper for broadcasting to a room.
 * Handles deduplication of scripture broadcasts.
 * Queues failed messages and retries on reconnect.
 */
export function useBroadcast() {
  const broadcastedScripturesRef = useRef<Set<string>>(new Set());
  const queueRef = useRef<QueuedMessage[]>([]);
  const isFlushingRef = useRef(false);
  const retryIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const flushQueue = useCallback(async () => {
    if (isFlushingRef.current || queueRef.current.length === 0) return;
    isFlushingRef.current = true;

    const remaining: QueuedMessage[] = [];

    for (const msg of queueRef.current) {
      try {
        const res = await fetch('/api/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: msg.type, payload: msg.payload, room: msg.room }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        // Success — message delivered
      } catch {
        if (msg.retries + 1 < MAX_RETRIES) {
          remaining.push({ ...msg, retries: msg.retries + 1 });
        }
        // else drop the message after MAX_RETRIES
      }
    }

    queueRef.current = remaining;

    // Stop retry interval if queue is now empty
    if (remaining.length === 0 && retryIntervalRef.current) {
      clearInterval(retryIntervalRef.current);
      retryIntervalRef.current = null;
    }

    isFlushingRef.current = false;
  }, []);

  const startRetryInterval = useCallback(() => {
    if (retryIntervalRef.current) return;
    retryIntervalRef.current = setInterval(() => {
      flushQueue();
    }, RETRY_INTERVAL_MS);
  }, [flushQueue]);

  const post = useCallback((type: string, payload: unknown, room: string) => {
    fetch('/api/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, payload, room }),
    }).catch(() => {
      // Network failure — queue the message for retry
      if (queueRef.current.length < MAX_QUEUE_SIZE) {
        queueRef.current.push({ type, payload, room, retries: 0 });
      }
      startRetryInterval();
    });
  }, [startRetryInterval]);

  // Flush queue when browser comes back online
  useEffect(() => {
    const handleOnline = () => {
      flushQueue();
    };
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('online', handleOnline);
      if (retryIntervalRef.current) {
        clearInterval(retryIntervalRef.current);
        retryIntervalRef.current = null;
      }
    };
  }, [flushQueue]);

  const broadcastTranscript = useCallback(
    (roomId: string, segment: TranscriptSegment) => {
      post('transcript', segment, roomId);
    },
    [post]
  );

  const broadcastScripture = useCallback(
    (roomId: string, scripture: DetectedScripture) => {
      // Deduplicate by scripture ID
      const key = `${scripture.book}-${scripture.chapter}-${scripture.verseStart}`;
      if (broadcastedScripturesRef.current.has(key)) return;
      broadcastedScripturesRef.current.add(key);
      post('scripture', scripture, roomId);
    },
    [post]
  );

  const broadcastStatus = useCallback(
    (roomId: string, status: { isRecording: boolean; isConnected: boolean }) => {
      post('status', status, roomId);
    },
    [post]
  );

  const broadcastClear = useCallback(
    (roomId: string) => {
      broadcastedScripturesRef.current.clear();
      // Clear the retry queue — stale messages are irrelevant after clear
      queueRef.current = [];
      if (retryIntervalRef.current) {
        clearInterval(retryIntervalRef.current);
        retryIntervalRef.current = null;
      }
      post('clear', null, roomId);
    },
    [post]
  );

  const broadcastNotes = useCallback(
    (roomId: string, notesPayload: SermonNotesPayload) => {
      post('notes', notesPayload, roomId);
    },
    [post]
  );

  const broadcastSummary = useCallback(
    (roomId: string, summaryPayload: SermonSummaryPayload) => {
      post('summary', summaryPayload, roomId);
    },
    [post]
  );

  return {
    broadcastTranscript,
    broadcastScripture,
    broadcastStatus,
    broadcastClear,
    broadcastNotes,
    broadcastSummary,
  };
}
