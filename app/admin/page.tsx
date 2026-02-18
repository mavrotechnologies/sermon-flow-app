'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useTranscription } from '@/hooks/useTranscription';
import { useScriptureDetection } from '@/hooks/useScriptureDetection';
import { useAudioDevices } from '@/hooks/useAudioDevices';
import { useGPTScriptureDetection } from '@/hooks/useGPTScriptureDetection';
import { useEnhancedScriptureDetection } from '@/hooks/useEnhancedScriptureDetection';
import { useStreamingScriptureDetection } from '@/hooks/useStreamingScriptureDetection';
import { useBroadcast } from '@/hooks/useBroadcast';
import { useSermonNotes } from '@/hooks/useSermonNotes';
import { QRCodeModal } from '@/components/QRCode';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { GPTScriptureList } from '@/components/GPTScriptureCard';
import { VmixSettingsModal } from '@/components/VmixSettingsModal';
import { useVmixSettings } from '@/hooks/useVmixSettings';
import { generateRoomCode } from '@/lib/broadcast';
import type { TranscriptSegment, ScriptureReference, DetectedScripture, BibleTranslation } from '@/types';
import { TRANSLATIONS } from '@/types';
import type { EnhancedDetection, ProcessSegmentResult } from '@/hooks/useEnhancedScriptureDetection';
import type { StreamingScripture } from '@/hooks/useStreamingScriptureDetection';

export default function AdminPage() {
  const [showQRModal, setShowQRModal] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [highlightedScriptureId, setHighlightedScriptureId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ai' | 'verses'>('ai');
  const [mounted, setMounted] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [isAddingManual, setIsAddingManual] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [roomCode] = useState(() => generateRoomCode());
  const [roomCodeCopied, setRoomCodeCopied] = useState(false);
  const [showVmixSettings, setShowVmixSettings] = useState(false);
  const [presentedId, setPresentedId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Broadcast hook for admin→live communication
  const {
    broadcastTranscript,
    broadcastScripture,
    broadcastStatus,
    broadcastClear,
    broadcastNotes,
    broadcastSummary,
    broadcastVmix,
  } = useBroadcast();

  // vMix / projector display hook
  const {
    settings: vmixSettings,
    overlayState: vmixOverlayState,
    updateSettings: updateVmixSettings,
    presentScripture: vmixPresentScripture,
    hideOverlay: vmixHideOverlay,
    displayUrl: vmixDisplayUrl,
  } = useVmixSettings({ roomCode, broadcastVmix });

  // Sermon notes hook
  const {
    notes: sermonNotes,
    isGenerating: isGeneratingNotes,
    isGeneratingSummary,
    addTranscriptText: addNotesText,
    updateScriptures: updateNotesScriptures,
    generateSummary,
    clear: clearSermonNotes,
  } = useSermonNotes({
    onNotesGenerated: (updatedNotes) => {
      broadcastNotes(roomCode, { notes: updatedNotes, isGenerating: false });
    },
    onSummaryGenerated: (summary) => {
      broadcastSummary(roomCode, { summary, isGenerating: false });
    },
  });

  // Track recent transcript text for GPT detection
  const recentTextRef = useRef<string>('');

  // Streaming Scripture Detection (real-time, word-by-word)
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

  // Enhanced Scripture Detection (staged pipeline with all improvements)
  const {
    detectedScriptures: enhancedScriptures,
    isProcessing: isEnhancedProcessing,
    isInitializing,
    initProgress,
    stats: detectionStats,
    processSegment: processEnhancedSegment,
    clearScriptures: clearEnhancedScriptures,
    translation,
    setTranslation,
  } = useEnhancedScriptureDetection();

  // GPT Scripture Detection hook (fallback for complex cases)
  const {
    isDetecting,
    detectedScriptures: gptScriptures,
    error: gptError,
    detect: detectWithGPT,
    clearScriptures: clearGPTScriptures,
  } = useGPTScriptureDetection();

  // Scripture detection hook (regex-based) - kept for compatibility
  const {
    detectedScriptures,
    processSegment,
    addScriptureByRef,
    navigateVerse,
    clearScriptures,
    setTranslation: setScriptureTranslation,
  } = useScriptureDetection();

  // Track which GPT scriptures have been synced to explicit references
  const syncedGPTScripturesRef = useRef<Set<string>>(new Set());

  // Sync GPT detected scriptures to Explicit References
  useEffect(() => {
    for (const gptScripture of gptScriptures) {
      const key = `${gptScripture.book}-${gptScripture.chapter}-${gptScripture.verse}`;
      if (!syncedGPTScripturesRef.current.has(key)) {
        syncedGPTScripturesRef.current.add(key);
        addScriptureByRef(
          gptScripture.book,
          gptScripture.chapter,
          gptScripture.verse,
          gptScripture.verseEnd
        );
      }
    }
  }, [gptScriptures, addScriptureByRef]);

  // Sync detected scriptures to notes hook for context
  useEffect(() => {
    updateNotesScriptures(detectedScriptures);
  }, [detectedScriptures, updateNotesScriptures]);

  // Helpers to map different detection types to DetectedScripture for broadcasting
  const enhancedToDetected = useCallback((s: EnhancedDetection): DetectedScripture => ({
    id: s.id,
    book: s.book,
    chapter: s.chapter,
    verseStart: s.verseStart,
    verseEnd: s.verseEnd,
    rawText: `${s.book} ${s.chapter}:${s.verseStart}${s.verseEnd ? `-${s.verseEnd}` : ''}`,
    osis: `${s.book}.${s.chapter}.${s.verseStart}`,
    verses: s.verses,
    timestamp: s.timestamp,
  }), []);

  const streamingToDetected = useCallback((s: StreamingScripture): DetectedScripture => ({
    id: s.id,
    book: s.book,
    chapter: s.chapter,
    verseStart: s.verse,
    verseEnd: s.verseEnd,
    rawText: `${s.book} ${s.chapter}:${s.verse}${s.verseEnd ? `-${s.verseEnd}` : ''}`,
    osis: `${s.book}.${s.chapter}.${s.verse}`,
    verses: s.verses,
    timestamp: s.detectedAt,
  }), []);

  // Broadcast all detected scriptures to live page (dedup handled by useBroadcast)
  const prevBroadcastedRef = useRef<number>(0);
  const prevEnhancedBroadcastedRef = useRef<number>(0);
  const prevStreamingBroadcastedRef = useRef<number>(0);

  useEffect(() => {
    if (detectedScriptures.length > prevBroadcastedRef.current) {
      const newScriptures = detectedScriptures.slice(prevBroadcastedRef.current);
      for (const scripture of newScriptures) {
        broadcastScripture(roomCode, scripture);
      }
      prevBroadcastedRef.current = detectedScriptures.length;
    }
  }, [detectedScriptures, roomCode, broadcastScripture]);

  useEffect(() => {
    if (enhancedScriptures.length > prevEnhancedBroadcastedRef.current) {
      const newScriptures = enhancedScriptures.slice(prevEnhancedBroadcastedRef.current);
      for (const scripture of newScriptures) {
        broadcastScripture(roomCode, enhancedToDetected(scripture));
      }
      prevEnhancedBroadcastedRef.current = enhancedScriptures.length;
    }
  }, [enhancedScriptures, roomCode, broadcastScripture, enhancedToDetected]);

  useEffect(() => {
    if (streamingScriptures.length > prevStreamingBroadcastedRef.current) {
      const newScriptures = streamingScriptures.slice(prevStreamingBroadcastedRef.current);
      for (const scripture of newScriptures) {
        broadcastScripture(roomCode, streamingToDetected(scripture));
      }
      prevStreamingBroadcastedRef.current = streamingScriptures.length;
    }
  }, [streamingScriptures, roomCode, broadcastScripture, streamingToDetected]);

  // Handle interim text for streaming detection
  const handleInterim = useCallback(
    (text: string) => {
      // Process interim text for real-time streaming detection
      processInterim(text);
    },
    [processInterim]
  );

  // Handle final transcript
  const handleTranscript = useCallback(
    async (segment: TranscriptSegment) => {
      // Broadcast transcript to live page
      broadcastTranscript(roomCode, segment);

      // Feed text to sermon notes generator
      addNotesText(segment.text);

      // Process final text through streaming detection
      await processFinal(segment.text);

      // Run enhanced pipeline (includes regex, cache, semantic, context)
      const pipelineResult = await processEnhancedSegment(segment);

      // Also run legacy regex detection for compatibility
      await processSegment(segment);

      // Only call GPT when the pipeline recommends it (ambiguous/paraphrase cases)
      if (pipelineResult.shouldCallGPT) {
        recentTextRef.current = (recentTextRef.current + ' ' + segment.text).slice(-600);
        detectWithGPT(recentTextRef.current, segment.isFinal);
      }
    },
    [roomCode, broadcastTranscript, addNotesText, processFinal, processEnhancedSegment, processSegment, detectWithGPT]
  );

  const {
    isRecording,
    isSupported,
    transcript,
    interimText,
    startRecording: _startRecording,
    stopRecording: _stopRecording,
    clearTranscript,
    error: transcriptError,
    transcriptionSource,
  } = useTranscription({
    onTranscript: handleTranscript,
    onInterim: handleInterim,
  });

  // Wrap start/stop recording to broadcast status
  const startRecording = useCallback(() => {
    _startRecording();
    broadcastStatus(roomCode, { isRecording: true, isConnected: true });
  }, [_startRecording, roomCode, broadcastStatus]);

  const stopRecording = useCallback(() => {
    _stopRecording();
    broadcastStatus(roomCode, { isRecording: false, isConnected: true });
    // Generate final sermon summary if enough notes exist
    if (sermonNotes.length >= 2) {
      broadcastSummary(roomCode, { summary: null, isGenerating: true });
      generateSummary();
    }
  }, [_stopRecording, roomCode, broadcastStatus, sermonNotes.length, broadcastSummary, generateSummary]);

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
    clearEnhancedScriptures();
    clearStreamingScriptures();
    clearSermonNotes();
    recentTextRef.current = '';
    syncedGPTScripturesRef.current.clear();
    prevBroadcastedRef.current = 0;
    prevEnhancedBroadcastedRef.current = 0;
    prevStreamingBroadcastedRef.current = 0;
    broadcastClear(roomCode);
    vmixHideOverlay();
  }, [clearTranscript, clearScriptures, clearGPTScriptures, clearEnhancedScriptures, clearStreamingScriptures, clearSermonNotes, roomCode, broadcastClear, vmixHideOverlay]);

  // Handle scripture click from transcript
  const handleScriptureClick = useCallback((ref: ScriptureReference) => {
    const scripture = detectedScriptures.find(
      (s) =>
        s.book === ref.book &&
        s.chapter === ref.chapter &&
        s.verseStart === ref.verseStart
    );
    if (scripture) {
      setHighlightedScriptureId(scripture.id);
      setTimeout(() => setHighlightedScriptureId(null), 3000);
    }
  }, [detectedScriptures]);

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

  const error = transcriptError || deviceError || gptError;

  // Generate live URL with room code
  const liveUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/live?room=${roomCode}`
    : `/live?room=${roomCode}`;

  return (
    <div className="min-h-screen bg-[#030303]">
      {/* Background - matching live page */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[#030303]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-950/30 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-950/20 via-transparent to-transparent" />
        <div className="hidden md:block absolute top-1/4 right-1/4 w-[600px] h-[600px] bg-purple-900/[0.12] rounded-full blur-[120px]" />
        <div className="hidden md:block absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-blue-900/10 rounded-full blur-[100px]" />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className={`glass border-b border-white/5 ${mounted ? 'animate-fade-in' : 'opacity-0'}`}>
          <div className="max-w-[1600px] mx-auto px-3 md:px-6 lg:px-8 py-3 md:py-4 flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-4 min-w-0">
              <Link href="/" className="flex items-center gap-2 md:gap-3 hover:opacity-80 transition-opacity shrink-0">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg md:rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <svg className="w-4 h-4 md:w-5 md:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <div>
                  <span className="hidden sm:inline text-xl font-bold text-white">SermonFlow</span>
                  <span className="hidden md:block text-xs text-gray-500">Dashboard</span>
                </div>
              </Link>

              {/* Room Code Badge */}
              <button
                onClick={() => {
                  navigator.clipboard.writeText(roomCode);
                  setRoomCodeCopied(true);
                  setTimeout(() => setRoomCodeCopied(false), 2000);
                }}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 rounded-full border border-blue-500/20 hover:bg-blue-500/20 transition-all cursor-pointer"
                title="Click to copy room code"
              >
                <svg className="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                </svg>
                <span className="text-blue-400 text-xs font-mono font-bold tracking-wider">{roomCode}</span>
                {roomCodeCopied ? (
                  <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-3 h-3 text-blue-400/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>

              {/* Status Pills */}
              <div className="hidden md:flex items-center gap-2 ml-4">
                {isInitializing ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/10 rounded-full border border-yellow-500/20">
                    <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                    <span className="text-yellow-400 text-xs font-medium">{initProgress || 'Loading AI...'}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 rounded-full border border-purple-500/20">
                    <span className="w-2 h-2 bg-purple-400 rounded-full" />
                    <span className="text-purple-400 text-xs font-medium">AI Ready</span>
                  </div>
                )}
                {isRecording && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-full">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-red-400 text-xs font-medium">Recording</span>
                    {transcriptionSource && (
                      <>
                        <span className="text-gray-600">•</span>
                        <span className={`text-xs font-medium ${
                          transcriptionSource === 'deepgram' ? 'text-green-400' : 'text-orange-400'
                        }`}>
                          {transcriptionSource === 'deepgram' ? 'Deepgram' : 'Browser'}
                        </span>
                      </>
                    )}
                  </div>
                )}
                {isDetecting && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full">
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                    <span className="text-blue-400 text-xs font-medium">Processing</span>
                  </div>
                )}
                {isGeneratingNotes && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-green-400 text-xs font-medium">Generating Notes...</span>
                  </div>
                )}
                {isGeneratingSummary && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full">
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                    <span className="text-blue-400 text-xs font-medium">Generating Summary...</span>
                  </div>
                )}
                {pendingReference && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-green-400 text-xs font-medium">{pendingReference}</span>
                  </div>
                )}
                {vmixOverlayState.isShowing && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-500/10 border border-orange-500/20 rounded-full">
                    <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
                    <span className="text-orange-400 text-xs font-medium truncate max-w-[200px]">
                      On Screen: {vmixOverlayState.currentReference}
                    </span>
                    <button
                      onClick={() => vmixHideOverlay()}
                      className="text-orange-300 hover:text-white transition-colors"
                      title="Hide overlay"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-3 shrink-0">
              {/* vMix Settings Button */}
              <button
                onClick={() => setShowVmixSettings(true)}
                className={`p-2 md:p-2.5 glass border rounded-xl transition-all ${
                  vmixSettings.enabled
                    ? 'border-blue-500/20 hover:border-blue-500/40 hover:bg-blue-500/10'
                    : 'border-white/10 hover:border-white/20 hover:bg-white/10'
                }`}
                title="vMix Settings"
              >
                <svg className={`w-4 h-4 ${vmixSettings.enabled ? 'text-blue-400' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>

              {/* Share Button - Secondary */}
              <button
                onClick={() => setShowQRModal(true)}
                className="flex items-center gap-2 px-3 md:px-4 py-2 md:py-2.5 glass border border-white/10 hover:border-white/20 hover:bg-white/10 text-gray-300 text-sm font-medium rounded-xl transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
                <span className="hidden sm:inline">Share</span>
              </button>

              {/* Live View Link - Primary */}
              <a
                href={`/live?room=${roomCode}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 md:px-4 py-2 md:py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-blue-500/20"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span className="hidden sm:inline">Live View</span>
              </a>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 w-full px-4 md:px-6 lg:px-8 py-4 md:py-6 space-y-4 md:space-y-6 max-w-[1600px] mx-auto">
          {/* Error Display */}
          {error && (
            <div className={`rounded-2xl p-4 bg-[#0c0c10] border border-red-500/20 ${mounted ? 'animate-fade-in' : 'opacity-0'}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Control Bar */}
          <div className={`relative p-[1px] rounded-2xl bg-gradient-to-b from-purple-500/20 via-purple-500/10 to-purple-500/5 ${mounted ? 'animate-fade-in-up' : 'opacity-0'}`}>
            <div className="rounded-2xl p-4 md:p-5 bg-[#0c0c10]">
              <div className="space-y-3 md:space-y-0 md:flex md:items-center md:gap-4">

                {/* Record + Clear */}
                <div className="flex items-center gap-2">
                  {!isRecording ? (
                    <button
                      onClick={startRecording}
                      disabled={!isSupported || !hasPermission}
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-purple-500/20 text-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                      <span className="hidden sm:inline">Start</span> Recording
                    </button>
                  ) : (
                    <button
                      onClick={stopRecording}
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-red-500/20 text-sm"
                    >
                      <div className="w-3 h-3 bg-white rounded-sm animate-pulse" />
                      Stop Recording
                    </button>
                  )}

                  <button
                    onClick={() => setShowClearConfirm(true)}
                    className="p-2.5 glass hover:bg-red-500/10 rounded-xl transition-all border border-white/10 hover:border-red-500/20 shrink-0"
                    title="Clear all"
                  >
                    <svg className="w-4 h-4 text-gray-400 hover:text-red-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>

                {/* Divider - desktop only */}
                <div className="hidden md:block w-px h-10 bg-white/10 shrink-0" />

                {/* Microphone Select */}
                <div className="flex items-center gap-2 min-w-0 flex-1 md:max-w-lg">
                  <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                  <select
                    value={selectedDevice || ''}
                    onChange={(e) => selectDevice(e.target.value)}
                    className="flex-1 min-w-0 px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500/50 transition-colors"
                  >
                    {devices.length === 0 && (
                      <option value="" disabled className="bg-gray-900 text-gray-500">
                        Select mic...
                      </option>
                    )}
                    {devices.map((device) => (
                      <option key={device.deviceId} value={device.deviceId} className="bg-gray-900">
                        {device.label || `Mic ${device.deviceId.slice(0, 5)}...`}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={refreshDevices}
                    className="p-2.5 glass hover:bg-white/10 rounded-xl transition-all border border-white/10 shrink-0"
                    title="Refresh"
                  >
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                </div>

                {/* Translation Select */}
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <select
                    value={translation}
                    onChange={(e) => {
                      const newTranslation = e.target.value as BibleTranslation;
                      setTranslation(newTranslation);
                      setScriptureTranslation(newTranslation);
                      setStreamingTranslation(newTranslation);
                    }}
                    className="flex-1 md:flex-none px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500/50 transition-colors"
                  >
                    <optgroup label="Offline" className="bg-gray-900 text-gray-400">
                      {TRANSLATIONS.filter(t => t.isPublicDomain).map((t) => (
                        <option key={t.code} value={t.code} className="bg-gray-900 text-white">
                          {t.code}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Premium" className="bg-gray-900 text-gray-400">
                      {TRANSLATIONS.filter(t => !t.isPublicDomain).map((t) => (
                        <option key={t.code} value={t.code} className="bg-gray-900 text-white">
                          {t.code}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                {/* Divider - desktop only */}
                <div className="hidden md:block w-px h-10 bg-white/10 shrink-0" />

                {/* Manual Scripture Input */}
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!manualInput.trim() || isAddingManual) return;

                    setIsAddingManual(true);
                    const match = manualInput.match(/^(\d?\s*[A-Za-z]+)\s+(\d+):(\d+)(?:-(\d+))?$/);
                    if (match) {
                      // Exact reference like "John 3:16"
                      const [, book, chapter, verseStart, verseEnd] = match;
                      await addScriptureByRef(
                        book.trim(),
                        parseInt(chapter),
                        parseInt(verseStart),
                        verseEnd ? parseInt(verseEnd) : undefined
                      );
                      setManualInput('');
                      setActiveTab('verses');
                      setIsAddingManual(false);
                    } else {
                      // Contextual search via AI (e.g. "and just wept", "love is patient")
                      try {
                        const res = await fetch('/api/detect-scripture', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ text: manualInput.trim(), mode: 'search' }),
                        });
                        const data = await res.json();
                        if (data.scriptures && data.scriptures.length > 0) {
                          for (const s of data.scriptures) {
                            await addScriptureByRef(s.book, s.chapter, s.verse, s.verseEnd);
                          }
                          setManualInput('');
                          setActiveTab('verses');
                        }
                      } catch (err) {
                        console.error('AI search failed:', err);
                      }
                      setIsAddingManual(false);
                    }
                  }}
                  className="flex items-center gap-2 min-w-0 flex-1"
                >
                  <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <input
                    type="text"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder="John 3:16 or 'Jesus wept'"
                    className="flex-1 min-w-0 px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-gray-500 outline-none ring-0 focus:outline-none focus:ring-0 focus:border-purple-500/50 transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={!manualInput.trim() || isAddingManual}
                    className="p-2.5 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-xl transition-all shrink-0"
                    title="Add Scripture or search by context"
                  >
                    {isAddingManual ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    )}
                  </button>
                </form>

                {/* Permission Request */}
                {!hasPermission && (
                  <button
                    onClick={requestPermission}
                    className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-purple-500/20"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                    Grant Mic Access
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Status Bar - Only visible on mobile when recording */}
          {isRecording && (
            <div className="md:hidden flex items-center justify-center gap-3 py-2 px-4 bg-red-500/10 border border-red-500/20 rounded-xl">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-red-400 text-sm font-medium">Recording</span>
              {transcriptionSource && (
                <>
                  <span className="text-gray-600">•</span>
                  <span className={`text-sm font-medium ${
                    transcriptionSource === 'deepgram' ? 'text-green-400' : 'text-orange-400'
                  }`}>
                    {transcriptionSource === 'deepgram' ? 'Deepgram' : 'Browser'}
                  </span>
                </>
              )}
            </div>
          )}

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 flex-1">
            {/* Transcript Panel */}
            <div className={`relative p-[1px] rounded-2xl bg-gradient-to-b from-purple-500/20 via-purple-500/10 to-purple-500/5 ${mounted ? 'animate-fade-in-up delay-100' : 'opacity-0'}`}>
              <div className="rounded-2xl overflow-hidden flex flex-col min-h-[280px] md:min-h-[400px] lg:h-[calc(100vh-320px)] bg-[#0c0c10]">
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

                <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col">
                  {transcript.length === 0 && !interimText ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                      <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-blue-400/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                      </div>
                      <p className="text-gray-400 text-sm">Start recording to see the transcript</p>
                      <p className="text-gray-500 text-xs mt-1">Words will appear here in real-time</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {transcript.map((segment) => (
                        <div key={segment.id} className="group">
                          <p className="text-gray-300 leading-relaxed">{segment.text}</p>
                        </div>
                      ))}
                      {interimText && (
                        <p className="text-purple-400 leading-relaxed animate-pulse">{interimText}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Scripture Detection Panel */}
            <div className={`relative p-[1px] rounded-2xl bg-gradient-to-b from-purple-500/20 via-purple-500/10 to-purple-500/5 ${mounted ? 'animate-fade-in-up delay-200' : 'opacity-0'}`}>
              <div className="rounded-2xl overflow-hidden flex flex-col min-h-[280px] md:min-h-[400px] lg:h-[calc(100vh-320px)] bg-[#0c0c10]">
              {/* Tab Header */}
              <div className="flex border-b border-white/10">
                <button
                  onClick={() => setActiveTab('ai')}
                  className={`flex-1 px-3 py-3 md:px-6 md:py-4 text-sm font-medium transition-all relative ${
                    activeTab === 'ai'
                      ? 'text-purple-300 bg-purple-500/15'
                      : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                  }`}
                >
                  {activeTab === 'ai' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-blue-500" />
                  )}
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    Detected
                    {gptScriptures.length > 0 && (
                      <span className="px-2 py-0.5 bg-purple-500/30 text-purple-300 text-xs rounded-full font-semibold">
                        {gptScriptures.length}
                      </span>
                    )}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('verses')}
                  className={`flex-1 px-3 py-3 md:px-6 md:py-4 text-sm font-medium transition-all relative ${
                    activeTab === 'verses'
                      ? 'text-blue-300 bg-blue-500/15'
                      : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                  }`}
                >
                  {activeTab === 'verses' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500" />
                  )}
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    Scripture
                    {detectedScriptures.length > 0 && (
                      <span className="px-2 py-0.5 bg-blue-500/30 text-blue-300 text-xs rounded-full font-semibold">
                        {detectedScriptures.length}
                      </span>
                    )}
                  </span>
                </button>
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col">
                {activeTab === 'ai' ? (
                  <div className="flex-1 flex flex-col">
                    <GPTScriptureList
                      scriptures={gptScriptures}
                      isDetecting={isDetecting}
                      error={gptError}
                      onSelect={async (scripture) => {
                        await addScriptureByRef(
                          scripture.book,
                          scripture.chapter,
                          scripture.verse,
                          scripture.verseEnd
                        );
                        setActiveTab('verses');
                      }}
                      renderActions={vmixSettings.enabled ? (scripture) => {
                        const ref = scripture.verseEnd
                          ? `${scripture.book} ${scripture.chapter}:${scripture.verse}-${scripture.verseEnd}`
                          : `${scripture.book} ${scripture.chapter}:${scripture.verse}`;
                        const verseText = scripture.text || scripture.reason;
                        return (
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              const ok = await vmixPresentScripture(ref, verseText, translation);
                              if (ok) {
                                setPresentedId(scripture.id);
                                setTimeout(() => setPresentedId(null), 2000);
                              }
                            }}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                              presentedId === scripture.id
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30'
                            }`}
                            title="Present on display"
                          >
                            {presentedId === scripture.id ? (
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            )}
                            {presentedId === scripture.id ? 'Sent' : 'Present'}
                          </button>
                        );
                      } : undefined}
                    />
                  </div>
                ) : detectedScriptures.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-purple-400/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <p className="text-gray-400 text-sm">Detected verses will appear here</p>
                    <p className="text-gray-500 text-xs mt-1">With full text from {translation}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {detectedScriptures.map((scripture) => (
                      <div
                        key={scripture.id}
                        className={`rounded-xl bg-white/5 border border-white/5 border-l-4 transition-all ${
                          highlightedScriptureId === scripture.id
                            ? 'border-l-yellow-500 bg-yellow-500/10'
                            : 'border-l-purple-500'
                        }`}
                      >
                        {/* Header with reference + nav */}
                        <div className="flex items-center justify-between px-5 pt-4 pb-2">
                          <div className="text-lg font-semibold text-white">
                            {scripture.book} {scripture.chapter}:{scripture.verseStart}
                            {scripture.verseEnd && scripture.verseEnd !== scripture.verseStart && `-${scripture.verseEnd}`}
                          </div>
                          <div className="flex items-center gap-0.5 bg-white/5 rounded-lg p-0.5">
                            <button
                              onClick={() => {
                                navigateVerse(scripture.id, 'prev');
                                // If this scripture is on screen, re-present after nav
                                if (presentedId === scripture.id && vmixSettings.enabled) {
                                  setTimeout(() => {
                                    const s = detectedScriptures.find(ds => ds.id === scripture.id);
                                    if (s) {
                                      const ref = `${s.book} ${s.chapter}:${s.verseStart}`;
                                      vmixPresentScripture(ref, s.verses[0]?.text || '', translation);
                                    }
                                  }, 100);
                                }
                              }}
                              disabled={scripture.verseStart <= 1}
                              className="p-2 rounded-md hover:bg-white/10 active:bg-white/20 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                              title="Previous verse"
                            >
                              <svg className="w-3.5 h-3.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                              </svg>
                            </button>
                            <span className="text-xs text-gray-500 font-medium px-1.5 min-w-[2rem] text-center tabular-nums">
                              :{scripture.verseStart}
                            </span>
                            <button
                              onClick={() => {
                                navigateVerse(scripture.id, 'next');
                                // If this scripture is on screen, re-present after nav
                                if (presentedId === scripture.id && vmixSettings.enabled) {
                                  setTimeout(() => {
                                    const s = detectedScriptures.find(ds => ds.id === scripture.id);
                                    if (s) {
                                      const ref = `${s.book} ${s.chapter}:${s.verseStart}`;
                                      vmixPresentScripture(ref, s.verses[0]?.text || '', translation);
                                    }
                                  }, 100);
                                }
                              }}
                              className="p-2 rounded-md hover:bg-white/10 active:bg-white/20 transition-all"
                              title="Next verse"
                            >
                              <svg className="w-3.5 h-3.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                          </div>
                        </div>

                        {/* Verse text — BibleGateway style with inline verse numbers */}
                        <div className="px-5 pb-4">
                          <p className="text-gray-300 text-sm leading-relaxed">
                            {scripture.verses.map((verse, i) => (
                              <span key={i}>
                                {scripture.verses.length > 1 && (
                                  <sup className="text-purple-400 font-bold text-[10px] mr-0.5">{scripture.verseStart + i}</sup>
                                )}
                                {verse.text}{i < scripture.verses.length - 1 ? ' ' : ''}
                              </span>
                            ))}
                          </p>
                          <div className="mt-3 flex items-center justify-between">
                            <span className="text-xs text-gray-500">{scripture.verses[0]?.translation || translation} Translation</span>
                            <div className="flex items-center gap-2">
                              {vmixSettings.enabled && (
                                <button
                                  onClick={async () => {
                                    // Present ONE verse at a time (current verseStart)
                                    const ref = `${scripture.book} ${scripture.chapter}:${scripture.verseStart}`;
                                    const verseText = scripture.verses[0]?.text || '';
                                    const ok = await vmixPresentScripture(ref, verseText, translation);
                                    if (ok) {
                                      setPresentedId(scripture.id);
                                      setTimeout(() => setPresentedId(null), 2000);
                                    }
                                  }}
                                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all text-xs font-medium ${
                                    presentedId === scripture.id
                                      ? 'bg-green-500/20 text-green-400'
                                      : 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30'
                                  }`}
                                  title="Present on display"
                                >
                                  {presentedId === scripture.id ? (
                                    <>
                                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                      </svg>
                                      Sent
                                    </>
                                  ) : (
                                    <>
                                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                      </svg>
                                      Present
                                    </>
                                  )}
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  const ref = `${scripture.book} ${scripture.chapter}:${scripture.verseStart}${scripture.verseEnd && scripture.verseEnd !== scripture.verseStart ? `-${scripture.verseEnd}` : ''}`;
                                  const trans = scripture.verses[0]?.translation || translation;
                                  let bodyText: string;
                                  if (scripture.verses.length === 1) {
                                    // Single verse — no verse number
                                    bodyText = scripture.verses[0].text;
                                  } else {
                                    // Multiple verses — inline with superscript-style numbers (BibleGateway style)
                                    bodyText = scripture.verses.map((v, i) => {
                                      const vNum = scripture.verseStart + i;
                                      return `${vNum} ${v.text}`;
                                    }).join(' ');
                                  }
                                  const copyText = `${ref} (${trans})\n${bodyText}`;
                                  navigator.clipboard.writeText(copyText);
                                  setCopiedId(scripture.id);
                                  setTimeout(() => setCopiedId(null), 2000);
                                }}
                                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-white/10 active:bg-white/20 transition-all text-xs text-gray-400 hover:text-gray-200"
                                title="Copy verse"
                              >
                                {copiedId === scripture.id ? (
                                  <>
                                    <svg className="w-3.5 h-3.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span className="text-green-400">Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                    Copy
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* QR Code Modal — now with room-aware URL */}
      <QRCodeModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        url={liveUrl}
      />

      {/* Clear Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showClearConfirm}
        onCancel={() => setShowClearConfirm(false)}
        onConfirm={() => {
          handleClear();
          setShowClearConfirm(false);
        }}
        title="Clear Everything"
        message="This will clear the transcript, all detected scriptures, and sermon notes. This action cannot be undone. Connected live viewers will also be cleared."
        confirmLabel="Clear All"
        confirmVariant="danger"
      />

      {/* vMix Settings Modal */}
      <VmixSettingsModal
        isOpen={showVmixSettings}
        onClose={() => setShowVmixSettings(false)}
        settings={vmixSettings}
        onSave={updateVmixSettings}
        displayUrl={vmixDisplayUrl}
      />
    </div>
  );
}
