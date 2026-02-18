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

  // Auto text sizing: shrink font if content overflows
  const autoSize = useCallback(() => {
    const verse = verseRef.current;
    const container = containerRef.current;
    if (!verse || !container) return;

    // Reset to base size
    verse.style.fontSize = '';
    const basePx = parseFloat(getComputedStyle(verse).fontSize);
    let size = basePx;

    // Shrink until it fits (no scrollbar)
    while (container.scrollHeight > container.clientHeight && size > 16) {
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
        background: '#0d1b2a',
      }}
    >
      {/* Background image + overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'linear-gradient(135deg, #0d1b2a 0%, #1b2838 30%, #162032 60%, #0d1b2a 100%)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at center, rgba(30,50,80,0.3) 0%, rgba(0,0,0,0.5) 100%)',
        }}
      />

      {/* Connection indicator (tiny, bottom-left — only for debugging) */}
      <div
        style={{
          position: 'absolute',
          bottom: 12,
          left: 12,
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: isConnected ? '#22c55e' : '#ef4444',
          opacity: 0.4,
          zIndex: 10,
        }}
      />

      {/* Scripture content */}
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
            padding: '5vh 10vw',
            zIndex: 5,
          }}
        >
          {/* Reference */}
          <h1
            style={{
              fontFamily: "'Inter', 'Montserrat', system-ui, -apple-system, sans-serif",
              fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
              fontWeight: 700,
              color: '#d4a843',
              textAlign: 'center',
              margin: 0,
              letterSpacing: '0.05em',
              textShadow: '0 2px 20px rgba(0,0,0,0.5)',
            }}
          >
            {scripture.reference}
          </h1>

          {/* Decorative divider */}
          <div
            style={{
              width: 200,
              height: 2,
              background: 'linear-gradient(90deg, transparent, rgba(212,168,67,0.5), transparent)',
              margin: '20px 0 30px 0',
            }}
          />

          {/* Verse text */}
          <p
            ref={verseRef}
            style={{
              fontFamily: "'Inter', 'Montserrat', system-ui, -apple-system, sans-serif",
              fontSize: 'clamp(2rem, 4vw, 3.5rem)',
              fontWeight: 400,
              color: '#ffffff',
              textAlign: 'center',
              lineHeight: 1.6,
              maxWidth: '80vw',
              margin: 0,
              textShadow: '0 2px 15px rgba(0,0,0,0.5)',
            }}
          >
            {scripture.verseText}
          </p>

          {/* Bible version label */}
          {scripture.version && (
            <div
              style={{
                position: 'absolute',
                bottom: '4vh',
                right: '4vw',
                fontFamily: "system-ui, -apple-system, sans-serif",
                fontSize: '1rem',
                color: '#666666',
                letterSpacing: '0.1em',
              }}
            >
              {scripture.version}
            </div>
          )}
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
