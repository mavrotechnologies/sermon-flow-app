'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

interface ScriptureDisplay {
  reference: string;
  verseText: string;
  version?: string;
}

function DisplayContent() {
  const searchParams = useSearchParams();
  const roomCode = searchParams.get('room');
  const [scripture, setScripture] = useState<ScriptureDisplay | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const verseRef = useRef<HTMLParagraphElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto text sizing — binary search for the largest font that fits
  const autoSize = useCallback(() => {
    const verse = verseRef.current;
    const container = containerRef.current;
    if (!verse || !container) return;

    // Available space inside padding
    const cs = getComputedStyle(container);
    const availableH = container.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);

    // Measure total content height at current verse font size
    const contentHeight = () => {
      let h = 0;
      for (let i = 0; i < container.children.length; i++) {
        const child = container.children[i] as HTMLElement;
        const m = getComputedStyle(child);
        h += child.offsetHeight + parseFloat(m.marginTop) + parseFloat(m.marginBottom);
      }
      return h;
    };

    const MIN = 36;
    const MAX = Math.round(window.innerWidth * 0.05); // 5vw — ~96px on 1920

    // Binary search: find largest size that fits
    let lo = MIN;
    let hi = MAX;
    let best = MIN;

    while (lo <= hi) {
      const mid = Math.round((lo + hi) / 2);
      verse.style.fontSize = `${mid}px`;
      if (contentHeight() <= availableH) {
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
      // Wait for render then auto-size
      requestAnimationFrame(() => {
        requestAnimationFrame(autoSize);
      });
    }
  }, [scripture, autoSize]);

  // Resize listener
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

      // Listen for vmix commands
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

      // Listen for clear event (also hides display)
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

  if (!roomCode) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        background: '#0a1628',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#666',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '1.5rem',
      }}>
        Missing ?room= parameter
      </div>
    );
  }

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        position: 'relative',
        background: '#000000',
      }}
    >
      {/* Background — solid dark like BibleShow */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: '#0a1628',
        }}
      />

      {/* Connection indicator (tiny, bottom-left — only for debugging) */}
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

      {/* Scripture content — BibleShow layout */}
      {scripture && (
        <div
          ref={containerRef}
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4% 5%',
            zIndex: 5,
          }}
        >
          {/* Verse text — bold, dominant, fills the screen */}
          <p
            ref={verseRef}
            style={{
              fontFamily: "'Georgia', 'Times New Roman', 'Palatino Linotype', serif",
              fontSize: '5vw',
              fontWeight: 700,
              color: '#ffffff',
              textAlign: 'center',
              lineHeight: 1.35,
              maxWidth: '94%',
              margin: 0,
              textShadow: '2px 2px 6px rgba(0,0,0,0.7)',
            }}
          >
            {scripture.verseText}
          </p>

          {/* Reference + version — below verse text */}
          <div
            style={{
              marginTop: '3%',
              display: 'flex',
              alignItems: 'baseline',
              gap: '0.4em',
            }}
          >
            <span
              style={{
                fontFamily: "'Georgia', 'Times New Roman', serif",
                fontSize: '3.5vw',
                fontWeight: 700,
                color: '#d4a843',
                letterSpacing: '0.02em',
                textShadow: '2px 2px 6px rgba(0,0,0,0.7)',
              }}
            >
              {scripture.reference}
            </span>
            {scripture.version && (
              <span
                style={{
                  fontFamily: "'Georgia', 'Times New Roman', serif",
                  fontSize: '2.2vw',
                  fontWeight: 400,
                  color: '#8a9ab5',
                  letterSpacing: '0.05em',
                  textShadow: '1px 1px 4px rgba(0,0,0,0.6)',
                }}
              >
                {scripture.version}
              </span>
            )}
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
