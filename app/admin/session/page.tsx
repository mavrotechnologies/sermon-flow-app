'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranscription } from '@/hooks/useTranscription';
import { useScriptureDetection } from '@/hooks/useScriptureDetection';
import { useAudioDevices } from '@/hooks/useAudioDevices';
import { useStreamingScriptureDetection } from '@/hooks/useStreamingScriptureDetection';
import { useGPTScriptureDetection } from '@/hooks/useGPTScriptureDetection';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ScriptureHighlight } from '@/components/ScriptureHighlight';
import { Logo } from '@/components/ui/Logo';
import { SoundWave } from '@/components/ui/SoundWave';
import {
  AlertIcon,
  BookIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  MicIcon,
  PencilIcon,
  PlusIcon,
  RefreshIcon,
  TrashIcon,
  WaveformIcon,
} from '@/components/ui/icons';
import type { TranscriptSegment, ScriptureReference, DetectedScripture, BibleTranslation } from '@/types';
import { TRANSLATIONS } from '@/types';

/** How long a verse card stays highlighted after its reference is clicked. */
const HIGHLIGHT_DURATION_MS = 3000;

/** How long the copy button reads "Copied". */
const COPIED_DURATION_MS = 2000;

/** Roughly how much text goes into one transcript paragraph before the next starts. */
const PARAGRAPH_CHARS = 500;

/** How close to the end of the transcript, in px, still counts as following along. */
const FOLLOW_THRESHOLD_PX = 80;

/** Stable empty array, so segments without references don't re-render on identity change. */
const EMPTY_REFS: ScriptureReference[] = [];

/**
 * Detection latency for the status pill. Sub-second values stay in milliseconds —
 * cache hits can land near zero, and "0.0s" reads like a broken readout.
 */
function formatLatency(ms: number): string {
  // Round before choosing the unit, so 999.6ms reads "1.0s" rather than "1000ms".
  const rounded = Math.round(ms);
  return rounded < 1000 ? `${rounded}ms` : `${(rounded / 1000).toFixed(1)}s`;
}

/** "Romans 8:28" or "Romans 8:28-30". */
function formatScriptureRef(scripture: DetectedScripture): string {
  const range = scripture.verseEnd && scripture.verseEnd !== scripture.verseStart ? `-${scripture.verseEnd}` : '';
  return `${scripture.book} ${scripture.chapter}:${scripture.verseStart}${range}`;
}

export default function AdminPage() {
  const router = useRouter();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [highlightedScriptureId, setHighlightedScriptureId] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState('');
  const [isAddingManual, setIsAddingManual] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [translation, setTranslation] = useState<BibleTranslation>('NKJV');
  const versesScrollRef = useRef<HTMLDivElement>(null);
  const transcriptScrollRef = useRef<HTMLDivElement>(null);
  // True while the transcript is scrolled to its end. New words keep it there;
  // scrolling up to re-read something releases it until you scroll back down.
  const followTranscriptRef = useRef(true);

  // GPT-powered Scripture Detection
  const {
    gptScriptures,
    isDetecting: isGPTDetecting,
    error: gptError,
    detectFromText,
    clear: clearGPTScriptures,
    setTranslation: setGPTTranslation,
  } = useGPTScriptureDetection();

  // Streaming Scripture Detection (real-time, word-by-word - regex for instant explicit refs)
  const {
    streamingScriptures,
    isProcessing: isStreamingProcessing,
    currentBook,
    pendingReference,
    processInterim,
    processFinal,
    clear: clearStreamingScriptures,
    avgLatencyMs,
    prefetchHits,
    setTranslation: setStreamingTranslation,
  } = useStreamingScriptureDetection();

  // Scripture detection hook (regex-based, for verse lookup/display)
  const {
    detectedScriptures,
    processSegment,
    addScriptureByRef,
    navigateVerse,
    clearScriptures,
    setTranslation: setScriptureTranslation,
  } = useScriptureDetection();

  // Track which scriptures have been synced to the Scripture tab
  const syncedScripturesRef = useRef<Set<string>>(new Set());

  // Sync streaming detections (instant regex) to Scripture tab
  useEffect(() => {
    for (const streaming of streamingScriptures) {
      const key = `${streaming.book}-${streaming.chapter}-${streaming.verse}`;
      if (!syncedScripturesRef.current.has(key)) {
        syncedScripturesRef.current.add(key);
        addScriptureByRef(
          streaming.book,
          streaming.chapter,
          streaming.verse,
          streaming.verseEnd
        );
      }
    }
  }, [streamingScriptures, addScriptureByRef]);

  // Sync GPT detections to Scripture tab
  useEffect(() => {
    for (const gpt of gptScriptures) {
      const key = `${gpt.book}-${gpt.chapter}-${gpt.verseStart}`;
      if (!syncedScripturesRef.current.has(key)) {
        syncedScripturesRef.current.add(key);
        addScriptureByRef(
          gpt.book,
          gpt.chapter,
          gpt.verseStart,
          gpt.verseEnd
        );
      }
    }
  }, [gptScriptures, addScriptureByRef]);

  // Handle interim text for streaming detection
  const handleInterim = useCallback(
    (text: string) => {
      processInterim(text);
    },
    [processInterim]
  );

  // Handle final transcript
  const handleTranscript = useCallback(
    (segment: TranscriptSegment) => {
      processFinal(segment.text);
      processSegment(segment);
      // Send to GPT for deep detection (debounced, batches every 3s)
      detectFromText(segment.text);
    },
    [processFinal, processSegment, detectFromText]
  );

  const {
    isRecording,
    isSupported,
    transcript,
    interimText,
    startRecording,
    stopRecording,
    clearTranscript,
    error: transcriptError,
    source: transcriptionSource,
  } = useTranscription({
    onTranscript: handleTranscript,
    onInterim: handleInterim,
  });

  // Audio devices hook
  const {
    devices,
    selectedDevice,
    selectDevice,
    refreshDevices,
    hasPermission,
    requestPermission,
    error: deviceError,
  } = useAudioDevices();

  // Handle clear all
  const handleClear = useCallback(() => {
    clearTranscript();
    clearScriptures();
    clearGPTScriptures();
    clearStreamingScriptures();
    syncedScripturesRef.current.clear();
  }, [clearTranscript, clearScriptures, clearGPTScriptures, clearStreamingScriptures]);

  // Which detected verses are quotable from each transcript segment, so spoken
  // references can be made clickable. A reference is attributed to a segment
  // when the text it was detected from appears in that segment — which also
  // covers a verse being mentioned more than once in the sermon.
  const refsBySegment = useMemo(() => {
    const quotable = detectedScriptures.filter((s) => s.rawText?.trim());
    const map = new Map<string, ScriptureReference[]>();
    if (quotable.length === 0) return map;

    for (const segment of transcript) {
      const haystack = segment.text.toLowerCase();
      const hits = quotable.filter((s) => haystack.includes(s.rawText.toLowerCase()));
      if (hits.length > 0) map.set(segment.id, hits);
    }
    return map;
  }, [transcript, detectedScriptures]);

  // The transcript as paragraphs, so a long sermon isn't one wall of text.
  // `open` marks a final paragraph that still has room for more.
  const paragraphs = useMemo(() => {
    const result: { key: string; segments: TranscriptSegment[]; open: boolean }[] = [];
    let current: TranscriptSegment[] = [];
    let charCount = 0;
    for (const seg of transcript) {
      current.push(seg);
      charCount += seg.text.length;
      if (charCount >= PARAGRAPH_CHARS) {
        result.push({ key: current[0].id, segments: current, open: false });
        current = [];
        charCount = 0;
      }
    }
    if (current.length > 0) {
      result.push({ key: current[0].id, segments: current, open: true });
    }
    return result;
  }, [transcript]);

  // Handle scripture click from transcript. The references handed to
  // ScriptureHighlight are the detected scriptures themselves, so `id` already
  // points at the card to reveal.
  const handleScriptureClick = useCallback((ref: ScriptureReference) => {
    setHighlightedScriptureId(ref.id);
  }, []);

  // Reveal the highlighted card, then release the highlight. The cleanup means a
  // second click restarts the timer instead of stacking one, and neither the
  // frame nor the timer can fire after unmount.
  useEffect(() => {
    if (!highlightedScriptureId) return;

    const frame = requestAnimationFrame(() => {
      document
        .querySelector(`[data-scripture-id="${highlightedScriptureId}"]`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    const timer = setTimeout(() => setHighlightedScriptureId(null), HIGHLIGHT_DURATION_MS);

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
    };
  }, [highlightedScriptureId]);

  const handleTranscriptScroll = useCallback(() => {
    const el = transcriptScrollRef.current;
    if (!el) return;
    followTranscriptRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < FOLLOW_THRESHOLD_PX;
  }, []);

  // Keep the newest words in view as they arrive.
  useEffect(() => {
    const el = transcriptScrollRef.current;
    if (el && followTranscriptRef.current) el.scrollTop = el.scrollHeight;
  }, [transcript.length, interimText]);

  const handleCopy = useCallback(
    (scripture: DetectedScripture) => {
      const trans = scripture.verses[0]?.translation || translation;
      const bodyText =
        scripture.verses.length === 1
          ? scripture.verses[0].text
          : scripture.verses.map((v, i) => `${scripture.verseStart + i} ${v.text}`).join(' ');
      navigator.clipboard.writeText(`${formatScriptureRef(scripture)} (${trans})\n${bodyText}`);
      setCopiedId(scripture.id);
      setTimeout(() => setCopiedId(null), COPIED_DURATION_MS);
    },
    [translation]
  );

  // Warn before leaving when recording or transcript exists
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isRecording || transcript.length > 0) {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isRecording, transcript.length]);

  // Leaving is a client-side navigation, so `beforeunload` above never fires for
  // it. Nothing is persisted yet, so confirm before discarding work in progress.
  const hasWorkInProgress = isRecording || transcript.length > 0 || detectedScriptures.length > 0;

  const handleExitClick = useCallback(() => {
    if (hasWorkInProgress) {
      setShowLeaveConfirm(true);
      return;
    }
    router.push('/admin');
  }, [hasWorkInProgress, router]);

  const handleConfirmLeave = useCallback(() => {
    if (isRecording) stopRecording();
    setShowLeaveConfirm(false);
    router.push('/admin');
  }, [isRecording, stopRecording, router]);

  const error = transcriptError || deviceError || gptError;

  // What's being said right now: words not yet final, then the caret. It runs on
  // from the last paragraph rather than sitting on a line of its own.
  const lastParagraphOpen = paragraphs[paragraphs.length - 1]?.open ?? false;
  const liveTail = (
    <>
      {interimText && <span className="text-evergreen">{interimText}</span>}
      {isRecording && <span className="caret text-amber" />}
    </>
  );

  return (
    <div className="parchment flex min-h-screen flex-col">
      {/* Header */}
      <header className="band-deep animate-fade-in sticky top-0 z-40 border-b border-paper/10">
        <div className="mx-auto flex h-16 w-full max-w-[1600px] items-center justify-between gap-3 px-4 md:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            {/* Not a link: the Account button below is the only way out, so leaving
                always goes through the unsaved-work guard. */}
            <Logo href="" tone="inverse" />
            <span className="hidden h-5 w-px shrink-0 bg-paper/15 sm:block" />
            <span className="hidden shrink-0 text-[0.875rem] font-semibold text-paper/55 sm:block">Live session</span>

            {/* Status pills */}
            <div className="ml-1 hidden min-w-0 items-center gap-2 lg:flex">
              <StatusPill
                onDark
                tone={isGPTDetecting ? 'amber' : 'evergreen'}
                label={isGPTDetecting ? 'Detecting…' : 'AI ready'}
                pulse={isGPTDetecting}
              />
              {isRecording && <StatusPill onDark tone="danger" label="Recording" pulse />}
              {transcriptionSource && (
                <StatusPill
                  onDark
                  tone="neutral"
                  label={transcriptionSource === 'deepgram' ? 'Deepgram Nova-3' : 'Browser speech'}
                />
              )}
              {pendingReference && <StatusPill onDark tone="amber" label={pendingReference} pulse />}
              {avgLatencyMs > 0 && (
                <StatusPill
                  onDark
                  tone="neutral"
                  label={`${formatLatency(avgLatencyMs)} avg`}
                  title="Average time from detecting a reference to showing the verse, over the last 50 detections"
                />
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleExitClick}
            className="flex shrink-0 items-center gap-1 rounded-control px-2 py-1.5 text-[0.875rem] font-medium text-paper/65 transition-colors hover:bg-paper/10 hover:text-paper"
          >
            <ChevronLeftIcon className="h-3.5 w-3.5" />
            Account
          </button>
        </div>

        {/* "On air" — a light running along the edge while the mic is open */}
        {isRecording && <span aria-hidden="true" className="on-air absolute inset-x-0 -bottom-px h-0.5" />}
      </header>

      {/* Main */}
      <main className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-4 px-4 py-4 md:gap-5 md:px-6 md:py-6 lg:px-8">
        {/* Error */}
        {error && (
          <div
            className="animate-fade-in flex items-start gap-3 rounded-card border border-danger/20 bg-danger-soft p-4"
            role="alert"
          >
            <span className="mt-0.5 shrink-0 text-danger">
              <AlertIcon className="h-5 w-5" />
            </span>
            <p className="text-[0.875rem] leading-relaxed text-danger">{error}</p>
          </div>
        )}

        {/* Control bar */}
        <div
          className={`animate-fade-in-up rounded-card border bg-paper p-3.5 transition-all duration-500 md:p-4 ${
            isRecording ? 'border-amber/40 shadow-[0_0_0_4px_rgba(200,132,42,0.10)]' : 'border-line shadow-soft'
          }`}
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-3">
            {/* Record + clear */}
            <div className="flex items-center gap-2">
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  disabled={!isSupported || !hasPermission}
                  className="flex h-11 flex-1 items-center justify-center gap-2 rounded-control bg-evergreen px-5 text-[0.9375rem] font-semibold text-paper shadow-soft transition-all hover:-translate-y-px hover:bg-evergreen-hover hover:shadow-lifted active:translate-y-0 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45 lg:flex-none"
                >
                  <MicIcon className="h-[18px] w-[18px]" />
                  Start listening
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  className="flex h-11 flex-1 items-center justify-center gap-2 rounded-control bg-danger px-5 text-[0.9375rem] font-semibold text-paper shadow-soft transition-all hover:bg-danger-hover active:scale-[0.98] lg:flex-none"
                >
                  <span className="animate-recording h-2.5 w-2.5 rounded-[2px] bg-paper" />
                  Stop listening
                </button>
              )}

              <button
                onClick={() => setShowClearConfirm(true)}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control border border-line bg-paper text-ink-muted transition-colors hover:border-danger/30 hover:bg-danger-soft hover:text-danger"
                title="Clear transcript and verses"
                aria-label="Clear transcript and verses"
              >
                <TrashIcon className="h-[18px] w-[18px]" />
              </button>
            </div>

            <span className="hidden h-8 w-px shrink-0 bg-line lg:block" />

            {/* Microphone */}
            <div className="flex min-w-0 flex-1 items-center gap-2 lg:max-w-xs">
              <select
                value={selectedDevice || ''}
                onChange={(e) => selectDevice(e.target.value)}
                aria-label="Microphone"
                className="h-11 min-w-0 flex-1 rounded-control border border-line bg-paper px-3 text-[0.875rem] text-ink transition-colors hover:border-line-strong"
              >
                {devices.length === 0 && (
                  <option value="" disabled>
                    Select a microphone…
                  </option>
                )}
                {devices.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || `Mic ${device.deviceId.slice(0, 5)}…`}
                  </option>
                ))}
              </select>
              <button
                onClick={refreshDevices}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control border border-line bg-paper text-ink-muted transition-colors hover:border-line-strong hover:bg-paper-raised hover:text-ink"
                title="Refresh microphone list"
                aria-label="Refresh microphone list"
              >
                <RefreshIcon className="h-[18px] w-[18px]" />
              </button>
            </div>

            {/* Translation */}
            <select
              value={translation}
              onChange={(e) => {
                const newTranslation = e.target.value as BibleTranslation;
                setTranslation(newTranslation);
                setScriptureTranslation(newTranslation);
                setStreamingTranslation(newTranslation);
                setGPTTranslation(newTranslation);
              }}
              aria-label="Bible translation"
              className="h-11 shrink-0 rounded-control border border-line bg-paper px-3 text-[0.875rem] font-semibold text-ink transition-colors hover:border-line-strong"
            >
              <optgroup label="Public domain">
                {TRANSLATIONS.filter((t) => t.isPublicDomain).map((t) => (
                  <option key={t.code} value={t.code}>
                    {t.code}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Premium">
                {TRANSLATIONS.filter((t) => !t.isPublicDomain).map((t) => (
                  <option key={t.code} value={t.code}>
                    {t.code}
                  </option>
                ))}
              </optgroup>
            </select>

            <span className="hidden h-8 w-px shrink-0 bg-line lg:block" />

            {/* Manual scripture entry */}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!manualInput.trim() || isAddingManual) return;

                setIsAddingManual(true);
                // Support formats: "Romans 15:13", "romans 15 13", "Romans 15:13-15", "1 John 3:16"
                const match = manualInput.match(/^(\d?\s*[A-Za-z]+)\s+(\d+)[\s:]+(\d+)(?:\s*-\s*(\d+))?$/);
                if (match) {
                  const [, rawBook, chapter, verseStart, verseEnd] = match;
                  // Capitalize book name: "romans" → "Romans", "1 john" → "1 John"
                  const book = rawBook.trim().replace(/\b[a-z]/g, (c) => c.toUpperCase());
                  await addScriptureByRef(
                    book,
                    parseInt(chapter),
                    parseInt(verseStart),
                    verseEnd ? parseInt(verseEnd) : undefined
                  );
                  setManualInput('');
                }
                setIsAddingManual(false);
              }}
              className="flex min-w-0 flex-1 items-center gap-2"
            >
              <div className="relative min-w-0 flex-1">
                <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-muted">
                  <PencilIcon className="h-[17px] w-[17px]" />
                </span>
                <input
                  type="text"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder="Add a verse — John 3:16"
                  aria-label="Add a verse by reference"
                  className="h-11 w-full min-w-0 rounded-control border border-line bg-paper pr-3 pl-10 text-[0.875rem] text-ink transition-colors placeholder:text-ink-muted/75 hover:border-line-strong"
                />
              </div>
              <button
                type="submit"
                disabled={!manualInput.trim() || isAddingManual}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control bg-evergreen text-paper transition-all hover:bg-evergreen-hover active:scale-[0.94] disabled:pointer-events-none disabled:opacity-35"
                title="Add verse"
                aria-label="Add verse"
              >
                {isAddingManual ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-paper/40 border-t-paper" />
                ) : (
                  <PlusIcon className="h-[18px] w-[18px]" />
                )}
              </button>
            </form>

            {/* Permission */}
            {!hasPermission && (
              <button
                onClick={requestPermission}
                className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-control border border-amber/30 bg-amber-soft px-4 text-[0.875rem] font-semibold text-amber transition-colors hover:border-amber/50"
              >
                <MicIcon className="h-[18px] w-[18px]" />
                Allow microphone
              </button>
            )}
          </div>
        </div>

        {/* Mobile status strip */}
        <div className="flex flex-wrap items-center gap-2 lg:hidden">
          <StatusPill
            tone={isGPTDetecting ? 'amber' : 'evergreen'}
            label={isGPTDetecting ? 'Detecting…' : 'AI ready'}
            pulse={isGPTDetecting}
          />
          {isRecording && <StatusPill tone="danger" label="Recording" pulse />}
          {pendingReference && <StatusPill tone="amber" label={pendingReference} pulse />}
          {avgLatencyMs > 0 && (
            <StatusPill
              tone="neutral"
              label={`${formatLatency(avgLatencyMs)} avg`}
              title="Average time from detecting a reference to showing the verse, over the last 50 detections"
            />
          )}
        </div>

        {/* Panels */}
        <div className="grid flex-1 grid-cols-1 gap-4 md:gap-5 lg:grid-cols-2">
          {/* Transcript */}
          <section
            className="animate-fade-in-up delay-100 flex min-h-[300px] flex-col overflow-hidden rounded-card border border-line bg-paper shadow-soft md:min-h-[400px] lg:h-[calc(100vh-13.25rem)]"
          >
            <div className="flex items-center justify-between gap-3 border-b border-line bg-paper-raised/50 px-4 py-3 md:px-5">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[0.625rem] bg-evergreen-soft text-evergreen">
                  <WaveformIcon className="h-[19px] w-[19px]" />
                </span>
                <div>
                  <h2 className="text-[0.9375rem] font-semibold md:text-base">Live transcript</h2>
                  <p className="tabular text-[0.75rem] text-ink-muted">{transcript.length} segments</p>
                </div>
              </div>
              {/* Bars rise while words are arriving and settle when the room is quiet */}
              {isRecording && <SoundWave idle={!interimText} className="text-amber" />}
            </div>

            <div
              ref={transcriptScrollRef}
              onScroll={handleTranscriptScroll}
              className="flex flex-1 flex-col overflow-y-auto p-4 md:p-6"
            >
              {transcript.length === 0 && !interimText ? (
                <PanelEmptyState
                  icon={<MicIcon className="h-7 w-7" />}
                  listening={isRecording}
                  title={isRecording ? 'Listening…' : 'Start listening to see the transcript'}
                  hint={isRecording ? 'The first words will land here in a moment' : 'Words appear here as they’re spoken'}
                />
              ) : (
                <div className="text-base leading-[1.75] text-ink-body">
                  {paragraphs.map((para, index) => (
                    <p key={para.key} className="mb-4">
                      {para.segments.map((seg) => (
                        <span key={seg.id}>
                          <ScriptureHighlight
                            text={seg.text}
                            references={refsBySegment.get(seg.id) ?? EMPTY_REFS}
                            onReferenceClick={handleScriptureClick}
                          />{' '}
                        </span>
                      ))}
                      {index === paragraphs.length - 1 && para.open && liveTail}
                    </p>
                  ))}
                  {/* With the last paragraph full (or none yet), the words in flight start the next one */}
                  {!lastParagraphOpen && (interimText || isRecording) && <p className="mb-4">{liveTail}</p>}
                </div>
              )}
            </div>
          </section>

          {/* Detected scripture */}
          <section
            className="animate-fade-in-up delay-200 flex min-h-[300px] flex-col overflow-hidden rounded-card border border-line bg-paper shadow-soft md:min-h-[400px] lg:h-[calc(100vh-13.25rem)]"
          >
            <div className="flex items-center gap-3 border-b border-line bg-paper-raised/50 px-4 py-3 md:px-5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[0.625rem] bg-evergreen-soft text-evergreen">
                <BookIcon className="h-[19px] w-[19px]" />
              </span>
              <div>
                <h2 className="text-[0.9375rem] font-semibold md:text-base">Detected scripture</h2>
                <p className="tabular text-[0.75rem] text-ink-muted">
                  {detectedScriptures.length} {detectedScriptures.length === 1 ? 'verse' : 'verses'} found
                </p>
              </div>
            </div>

            <div ref={versesScrollRef} className="flex flex-1 flex-col overflow-y-auto p-4 md:p-5">
              {detectedScriptures.length === 0 ? (
                <PanelEmptyState
                  icon={<BookIcon className="h-7 w-7" />}
                  listening={isRecording}
                  title={isRecording ? 'Listening for scripture…' : 'Detected verses will appear here'}
                  hint={`With the full text from ${translation}`}
                />
              ) : (
                <div className="space-y-3">
                  {/* Newest first — the top card is the verse just spoken */}
                  {detectedScriptures.map((scripture, index) => (
                    <DetectedVerseCard
                      key={scripture.id}
                      scripture={scripture}
                      latest={index === 0}
                      live={isRecording}
                      highlighted={highlightedScriptureId === scripture.id}
                      copied={copiedId === scripture.id}
                      fallbackTranslation={translation}
                      onNavigate={navigateVerse}
                      onCopy={handleCopy}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      {/* Clear Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showClearConfirm}
        onCancel={() => setShowClearConfirm(false)}
        onConfirm={() => {
          handleClear();
          setShowClearConfirm(false);
        }}
        title="Clear everything?"
        message="This clears the transcript and every detected verse. It can't be undone."
        confirmLabel="Clear all"
        confirmVariant="danger"
      />

      {/* Leaving discards the session — nothing is saved yet */}
      <ConfirmDialog
        isOpen={showLeaveConfirm}
        onCancel={() => setShowLeaveConfirm(false)}
        onConfirm={handleConfirmLeave}
        title="Leave this session?"
        message={
          isRecording
            ? "You're still listening. Sessions aren't saved yet, so leaving stops the microphone and discards this transcript and its verses."
            : "Sessions aren't saved yet, so leaving discards this transcript and the verses detected in it."
        }
        confirmLabel="Leave session"
        confirmVariant="danger"
      />
    </div>
  );
}

type PillTone = 'evergreen' | 'amber' | 'danger' | 'neutral';

const PILL_TONES: Record<PillTone, string> = {
  evergreen: 'border-evergreen/20 bg-evergreen-soft text-evergreen',
  amber: 'border-amber/25 bg-amber-soft text-amber',
  danger: 'border-danger/20 bg-danger-soft text-danger',
  neutral: 'border-line bg-paper-raised text-ink-muted',
};

const PILL_DOTS: Record<PillTone, string> = {
  evergreen: 'bg-evergreen',
  amber: 'bg-amber',
  danger: 'bg-danger',
  neutral: 'bg-ink-muted',
};

/** The same tones on the evergreen-deep header, where the soft tints would vanish. */
const PILL_TONES_ON_DARK: Record<PillTone, string> = {
  evergreen: 'border-paper/15 bg-paper/[0.06] text-paper/80',
  amber: 'border-amber-glow/30 bg-amber-glow/10 text-amber-glow',
  danger: 'border-danger bg-danger text-paper',
  neutral: 'border-paper/10 bg-paper/[0.04] text-paper/55',
};

const PILL_DOTS_ON_DARK: Record<PillTone, string> = {
  evergreen: 'bg-evergreen-soft',
  amber: 'bg-amber-glow',
  danger: 'bg-paper',
  neutral: 'bg-paper/40',
};

function StatusPill({
  tone,
  label,
  pulse,
  title,
  onDark,
}: {
  tone: PillTone;
  label: string;
  pulse?: boolean;
  title?: string;
  onDark?: boolean;
}) {
  const tones = onDark ? PILL_TONES_ON_DARK : PILL_TONES;
  const dots = onDark ? PILL_DOTS_ON_DARK : PILL_DOTS;

  return (
    <span
      title={title}
      className={`inline-flex max-w-full shrink-0 items-center gap-2 rounded-full border px-2.5 py-1 text-[0.75rem] font-semibold transition-colors duration-300 ${tones[tone]}`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dots[tone]} ${pulse ? 'animate-recording' : ''}`} />
      <span className="truncate">{label}</span>
    </span>
  );
}

/** Centred placeholder for an empty panel. Pulses amber while the mic is open. */
function PanelEmptyState({
  icon,
  title,
  hint,
  listening,
}: {
  icon: React.ReactNode;
  title: string;
  hint: string;
  listening: boolean;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <span className="relative mb-4 flex h-14 w-14 items-center justify-center">
        {listening && <span className="animate-listening-ring absolute inset-0 rounded-card bg-amber/30" />}
        <span
          className={`relative flex h-14 w-14 items-center justify-center rounded-card transition-colors duration-500 ${
            listening ? 'bg-amber-soft text-amber' : 'animate-float bg-evergreen-soft text-evergreen/70'
          }`}
        >
          {icon}
        </span>
      </span>
      <p className="text-[0.9375rem] font-medium text-ink">{title}</p>
      <p className="mt-1 text-[0.875rem] text-ink-muted">{hint}</p>
    </div>
  );
}

/**
 * One detected verse. The latest sits on an evergreen-deep card with the verse
 * set large; earlier ones step back to a quieter parchment card.
 */
function DetectedVerseCard({
  scripture,
  latest,
  live,
  highlighted,
  copied,
  fallbackTranslation,
  onNavigate,
  onCopy,
}: {
  scripture: DetectedScripture;
  latest: boolean;
  /** The mic is open, so the "latest" marker pulses. */
  live: boolean;
  /** Its reference was just clicked in the transcript. */
  highlighted: boolean;
  copied: boolean;
  fallbackTranslation: BibleTranslation;
  onNavigate: (scriptureId: string, direction: 'prev' | 'next') => void;
  onCopy: (scripture: DetectedScripture) => void;
}) {
  const surface = latest
    ? `band-deep border-transparent shadow-deep ${highlighted ? 'ring-2 ring-amber ring-offset-2 ring-offset-paper' : ''}`
    : highlighted
      ? 'border-l-2 border-amber/30 border-l-amber bg-amber-soft'
      : 'border-l-2 border-line border-l-evergreen bg-paper-raised/40';

  const stepButton = `flex h-7 w-7 items-center justify-center rounded-[0.375rem] transition-colors disabled:pointer-events-none disabled:opacity-25 ${
    latest ? 'text-paper/60 hover:bg-paper/10 hover:text-paper' : 'text-ink-muted hover:bg-paper-raised hover:text-ink'
  }`;

  return (
    <article
      data-scripture-id={scripture.id}
      className={`animate-verse-in relative overflow-hidden rounded-[0.875rem] border transition-colors duration-300 ${surface}`}
    >
      <div className={`relative ${latest ? 'p-5 md:p-6' : 'px-4 py-3.5'}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {latest && (
              <p className="eyebrow mb-1.5 flex items-center gap-2 text-amber-glow">
                <span className={`h-1.5 w-1.5 rounded-full bg-amber-glow ${live ? 'animate-recording' : ''}`} />
                Latest verse
              </p>
            )}
            <h3 className={latest ? 'text-[1.5rem] leading-tight font-semibold md:text-[1.75rem]' : 'text-[1.0625rem] font-semibold'}>
              {formatScriptureRef(scripture)}
            </h3>
          </div>

          <div
            className={`flex shrink-0 items-center gap-0.5 rounded-control border p-0.5 ${
              latest ? 'border-paper/15 bg-paper/[0.06]' : 'border-line bg-paper'
            }`}
          >
            <button
              onClick={() => onNavigate(scripture.id, 'prev')}
              disabled={scripture.verseStart <= 1}
              className={stepButton}
              title="Previous verse"
              aria-label="Previous verse"
            >
              <ChevronLeftIcon className="h-3.5 w-3.5" />
            </button>
            <span
              className={`tabular min-w-[1.75rem] px-0.5 text-center text-[0.75rem] font-semibold ${
                latest ? 'text-paper/60' : 'text-ink-muted'
              }`}
            >
              :{scripture.verseStart}
            </span>
            <button
              onClick={() => onNavigate(scripture.id, 'next')}
              className={stepButton}
              title="Next verse"
              aria-label="Next verse"
            >
              <ChevronRightIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <p
          className={`verse ${
            latest
              ? 'mt-3 text-[1.25rem] leading-[1.5] text-paper/90 md:text-[1.375rem]'
              : 'mt-1.5 text-[1.0625rem] leading-relaxed text-ink-body'
          }`}
        >
          {scripture.verses.map((verse, i) => (
            <span key={i}>
              {scripture.verses.length > 1 && (
                <sup
                  className={`mr-0.5 font-sans text-[0.625rem] font-bold not-italic ${
                    latest ? 'text-amber-glow' : 'text-evergreen'
                  }`}
                >
                  {scripture.verseStart + i}
                </sup>
              )}
              {verse.text}
              {i < scripture.verses.length - 1 ? ' ' : ''}
            </span>
          ))}
        </p>

        <div
          className={`flex items-center justify-between gap-3 border-t ${
            latest ? 'mt-4 border-paper/10 pt-3' : 'mt-3 border-line pt-2.5'
          }`}
        >
          <span className={`text-[0.75rem] font-medium ${latest ? 'text-paper/50' : 'text-ink-muted'}`}>
            {scripture.verses[0]?.translation || fallbackTranslation}
          </span>
          <button
            onClick={() => onCopy(scripture)}
            className={`flex items-center gap-1.5 rounded-[0.375rem] px-2 py-1 text-[0.75rem] font-semibold transition-colors ${
              latest
                ? 'text-paper/60 hover:bg-paper/10 hover:text-amber-glow'
                : 'text-ink-muted hover:bg-paper hover:text-evergreen'
            }`}
            title="Copy verse"
          >
            {copied ? (
              <span className={`flex items-center gap-1.5 ${latest ? 'text-amber-glow' : 'text-evergreen'}`}>
                <CheckIcon className="h-3.5 w-3.5" />
                Copied
              </span>
            ) : (
              <>
                <CopyIcon className="h-3.5 w-3.5" />
                Copy
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
