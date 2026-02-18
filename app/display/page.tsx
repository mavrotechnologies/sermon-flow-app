'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

interface VerseItem {
  number: number;
  text: string;
}

interface ScriptureDisplay {
  reference: string;
  verseText: string;
  version?: string;
  verses?: VerseItem[];
}

// Fixed channel — matches useVmixSettings DISPLAY_CHANNEL
const DISPLAY_CHANNEL = 'display';

function DisplayContent() {
  const searchParams = useSearchParams();
  const roomParam = searchParams.get('room');
  // Use room param if provided, otherwise use the fixed display channel
  const roomCode = roomParam || DISPLAY_CHANNEL;

  const [scripture, setScripture] = useState<ScriptureDisplay | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const verseRef = useRef<HTMLDivElement>(null);
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
    const MAX = Math.round(window.innerWidth * 0.08); // 8vw

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
      // Instant — no delay, just measure after paint
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

      eventSource.addEventListener('vmix', (event) => {
        try {
          const msg = JSON.parse(event.data);
          const payload = msg.payload;
          if (payload?.action === 'present') {
            setScripture({
              reference: payload.reference || '',
              verseText: payload.verseText || '',
              version: payload.version,
              verses: payload.verses,
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

      {/* Scripture content — instant, no transitions */}
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
            padding: '10px 20px',
            zIndex: 5,
          }}
        >
          {/* Verse text — bold, fills the screen */}
          <div
            ref={verseRef}
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '8vw',
              fontWeight: 700,
              color: '#ffffff',
              textAlign: 'center',
              lineHeight: 1.3,
              maxWidth: '96%',
              margin: 0,
              textShadow: '2px 2px 6px rgba(0,0,0,0.7)',
            }}
          >
            {scripture.verses && scripture.verses.length > 1 ? (
              // Multiple verses — show each with superscript number
              scripture.verses.map((v, i) => (
                <span key={i}>
                  <sup
                    style={{
                      fontSize: '0.5em',
                      fontWeight: 700,
                      color: '#d4a843',
                      verticalAlign: 'super',
                      marginRight: '0.1em',
                      lineHeight: 1,
                    }}
                  >
                    {v.number}
                  </sup>
                  {v.text}
                  {i < scripture.verses!.length - 1 ? ' ' : ''}
                </span>
              ))
            ) : (
              // Single verse — just the text
              scripture.verseText
            )}
          </div>

          {/* Reference + version — same font size */}
          <div
            style={{
              marginTop: '1.5%',
              display: 'flex',
              alignItems: 'baseline',
              gap: '0.3em',
            }}
          >
            <span
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '3.2vw',
                fontWeight: 700,
                color: '#d4a843',
                textShadow: '2px 2px 6px rgba(0,0,0,0.7)',
              }}
            >
              {scripture.reference}
            </span>
            {scripture.version && (
              <span
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '3.2vw',
                  fontWeight: 700,
                  color: '#8a9ab5',
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
