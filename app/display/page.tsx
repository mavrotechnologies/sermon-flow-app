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

  // Auto text sizing: shrink font if content overflows, but keep it large
  const autoSize = useCallback(() => {
    const verse = verseRef.current;
    const container = containerRef.current;
    if (!verse || !container) return;

    // Reset to base size
    verse.style.fontSize = '';
    const basePx = parseFloat(getComputedStyle(verse).fontSize);
    let size = basePx;

    // Shrink until it fits — minimum 28px so it stays readable on projectors
    while (container.scrollHeight > container.clientHeight && size > 28) {
      size -= 2;
      verse.style.fontSize = `${size}px`;
    }
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
        background: '#0d1b2a',
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
      {/* Background — deep dark with subtle texture */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, #050a12 0%, #0a1628 40%, #0a1628 60%, #050a12 100%)',
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

      {/* Scripture content — BibleShow layout: large verse text centered, reference below */}
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
            padding: '6vh 8vw 12vh',
            zIndex: 5,
          }}
        >
          {/* Verse text — dominant element, fills most of the screen */}
          <p
            ref={verseRef}
            style={{
              fontFamily: "'Georgia', 'Times New Roman', 'Palatino Linotype', serif",
              fontSize: 'clamp(3rem, 6.5vw, 6rem)',
              fontWeight: 400,
              color: '#ffffff',
              textAlign: 'center',
              lineHeight: 1.5,
              maxWidth: '88vw',
              margin: 0,
              textShadow: '0 2px 30px rgba(0,0,0,0.7)',
              wordSpacing: '0.05em',
            }}
          >
            {scripture.verseText}
          </p>

          {/* Reference + version — below verse text */}
          <div
            style={{
              marginTop: '4vh',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6em',
            }}
          >
            <span
              style={{
                fontFamily: "'Georgia', 'Times New Roman', serif",
                fontSize: 'clamp(1.8rem, 3.5vw, 3rem)',
                fontWeight: 700,
                color: '#d4a843',
                letterSpacing: '0.02em',
                textShadow: '0 2px 15px rgba(0,0,0,0.6)',
              }}
            >
              {scripture.reference}
            </span>
            {scripture.version && (
              <span
                style={{
                  fontFamily: "'Georgia', 'Times New Roman', serif",
                  fontSize: 'clamp(1.2rem, 2.2vw, 2rem)',
                  fontWeight: 400,
                  color: '#8a9ab5',
                  letterSpacing: '0.05em',
                  textShadow: '0 2px 10px rgba(0,0,0,0.5)',
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
        <div style={{ width: '100vw', height: '100vh', background: '#0d1b2a' }} />
      }
    >
      <DisplayContent />
    </Suspense>
  );
}
