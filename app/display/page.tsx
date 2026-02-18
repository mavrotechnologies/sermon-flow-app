'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

interface ScriptureDisplay {
  reference: string;
  verseText: string;
  version?: string;
}

// Fixed channel — matches useVmixSettings DISPLAY_CHANNEL
const DISPLAY_CHANNEL = 'display';

function DisplayContent() {
  const searchParams = useSearchParams();
  const roomParam = searchParams.get('room');
  const roomCode = roomParam || DISPLAY_CHANNEL;

  const [scripture, setScripture] = useState<ScriptureDisplay | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const verseRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const refRef = useRef<HTMLDivElement>(null);

  // Optimized auto-size — measure reference once, binary search verse only
  const autoSize = useCallback(() => {
    const verse = verseRef.current;
    const container = containerRef.current;
    const refEl = refRef.current;
    if (!verse || !container) return;

    // Available height
    const availableH = container.clientHeight - 20; // 10px top + 10px bottom padding
    // Fixed height for reference line
    const refH = refEl ? refEl.offsetHeight + 16 : 60; // 16px gap
    const verseAvailH = availableH - refH;

    const MIN = 36;
    const MAX = Math.round(window.innerWidth * 0.08);

    let lo = MIN;
    let hi = MAX;
    let best = MIN;

    while (lo <= hi) {
      const mid = Math.round((lo + hi) / 2);
      verse.style.fontSize = `${mid}px`;
      if (verse.offsetHeight <= verseAvailH) {
        best = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }

    verse.style.fontSize = `${best}px`;
  }, []);

  useEffect(() => {
    if (scripture) {
      requestAnimationFrame(autoSize);
    }
  }, [scripture, autoSize]);

  useEffect(() => {
    window.addEventListener('resize', autoSize);
    return () => window.removeEventListener('resize', autoSize);
  }, [autoSize]);

  // SSE connection
  useEffect(() => {
    if (!roomCode) return;

    let eventSource: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout>;

    function connect() {
      eventSource = new EventSource(`/api/stream?room=${roomCode}`);
      eventSource.onopen = () => setIsConnected(true);
      eventSource.onerror = () => {
        setIsConnected(false);
        eventSource?.close();
        reconnectTimer = setTimeout(connect, 3000);
      };

      eventSource.addEventListener('vmix', (event) => {
        try {
          const msg = JSON.parse(event.data);
          const payload = msg.payload;
          if (payload?.action === 'present') {
            setScripture({
              reference: payload.reference || '',
              verseText: payload.verseText || '',
              version: payload.version,
            });
          } else if (payload?.action === 'hide') {
            setScripture(null);
          }
        } catch {}
      });

      eventSource.addEventListener('clear', () => {
        setScripture(null);
      });
    }

    connect();
    return () => {
      clearTimeout(reconnectTimer);
      eventSource?.close();
    };
  }, [roomCode]);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        position: 'relative',
        background: '#0a1628',
      }}
    >
      {/* Connection indicator */}
      <div
        style={{
          position: 'absolute',
          bottom: 8,
          left: 8,
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: isConnected ? '#22c55e' : '#ef4444',
          opacity: 0.3,
          zIndex: 10,
        }}
      />

      {scripture && (
        <div
          ref={containerRef}
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '10px 20px',
            zIndex: 5,
          }}
        >
          {/* Verse text with (VERSION) inline at the end */}
          <div
            ref={verseRef}
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '8vw',
              fontWeight: 700,
              color: '#ffffff',
              textAlign: 'center',
              lineHeight: 1.3,
              maxWidth: '100%',
              margin: '0 auto',
              textShadow: '2px 2px 8px rgba(0,0,0,0.8)',
            }}
          >
            {scripture.verseText}
            {scripture.version && (
              <span style={{ color: '#8a9ab5', marginLeft: '0.3em' }}>
                ({scripture.version})
              </span>
            )}
          </div>

          {/* Reference — bottom right */}
          <div
            ref={refRef}
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '3vw',
              fontWeight: 700,
              color: '#d4a843',
              textAlign: 'right',
              marginTop: '12px',
              paddingRight: '2%',
              textShadow: '2px 2px 6px rgba(0,0,0,0.7)',
            }}
          >
            {scripture.reference}
          </div>
        </div>
      )}
    </div>
  );
}

export default function DisplayPage() {
  return (
    <Suspense
      fallback={
        <div style={{ width: '100vw', height: '100vh', background: '#0a1628' }} />
      }
    >
      <DisplayContent />
    </Suspense>
  );
}
