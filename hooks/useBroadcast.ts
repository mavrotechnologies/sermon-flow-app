'use client';

import { useCallback, useRef } from 'react';
import type { TranscriptSegment, DetectedScripture, SermonNotesPayload } from '@/types';

/**
 * Fire-and-forget POST helper for broadcasting to a room.
 * Handles deduplication of scripture broadcasts.
 */
export function useBroadcast() {
  const broadcastedScripturesRef = useRef<Set<string>>(new Set());

  const post = useCallback((type: string, payload: unknown, room: string) => {
    fetch('/api/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, payload, room }),
    }).catch((err) => console.error('Broadcast failed:', err));
  }, []);

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

  return {
    broadcastTranscript,
    broadcastScripture,
    broadcastStatus,
    broadcastClear,
    broadcastNotes,
  };
}
