'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useTranscription } from '@/hooks/useTranscription';
import { useScriptureDetection } from '@/hooks/useScriptureDetection';
import { useAudioDevices } from '@/hooks/useAudioDevices';
import { useGPTScriptureDetection } from '@/hooks/useGPTScriptureDetection';
import { QRCodeModal } from '@/components/QRCode';
import { GPTScriptureList } from '@/components/GPTScriptureCard';
import type { TranscriptSegment, ScriptureReference, BibleTranslation } from '@/types';
import { TRANSLATIONS } from '@/types';

export default function AdminPage() {
  const [showQRModal, setShowQRModal] = useState(false);
  const [highlightedScriptureId, setHighlightedScriptureId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ai' | 'verses'>('ai');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Track recent transcript text for GPT detection
  const recentTextRef = useRef<string>('');

  // GPT Scripture Detection hook
  const {
    isDetecting,
    detectedScriptures: gptScriptures,
    error: gptError,
    detect: detectWithGPT,
    clearScriptures: clearGPTScriptures,
  } = useGPTScriptureDetection();

  // Scripture detection hook (regex-based)
  const {
    detectedScriptures,
    processSegment,
    addScriptureByRef,
    clearScriptures,
    translation,
    setTranslation,
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

  // Transcription hook with scripture processing
  const handleTranscript = useCallback(
    async (segment: TranscriptSegment) => {
      await processSegment(segment);
      recentTextRef.current = (recentTextRef.current + ' ' + segment.text).slice(-600);
      if (recentTextRef.current.length > 30) {
        detectWithGPT(recentTextRef.current, segment.isFinal);
      }
    },
    [processSegment, detectWithGPT]
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
  } = useTranscription(handleTranscript);

  // Also detect on interim text for real-time feel
  const prevInterimRef = useRef<string>('');
  useEffect(() => {
    if (interimText && interimText.length > 30 && interimText !== prevInterimRef.current) {
      prevInterimRef.current = interimText;
      const fullContext = (recentTextRef.current + ' ' + interimText).slice(-600);
      detectWithGPT(fullContext, false);
    }
  }, [interimText, detectWithGPT]);

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
    recentTextRef.current = '';
    syncedGPTScripturesRef.current.clear();
  }, [clearTranscript, clearScriptures, clearGPTScriptures]);

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

  const error = transcriptError || deviceError || gptError;

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/30 via-[#0a0a0f] to-purple-950/20" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className={`glass border-b border-white/5 ${mounted ? 'animate-fade-in' : 'opacity-0'}`}>
          <div className="max-w-[1600px] mx-auto px-4 md:px-6 lg:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <div>
                  <span className="text-xl font-bold text-white">SermonFlow</span>
                  <span className="hidden sm:block text-xs text-gray-500">Dashboard</span>
                </div>
              </Link>

              {/* Status Pills */}
              <div className="hidden md:flex items-center gap-2 ml-4">
                <div className="flex items-center gap-2 px-3 py-1.5 glass rounded-full border border-green-500/20">
                  <span className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-green-400 text-xs font-medium">AI Connected</span>
                </div>
                {isRecording && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 border border-red-500/30 rounded-full">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-recording-pulse" />
                    <span className="text-red-400 text-xs font-medium">Live</span>
                  </div>
                )}
                {isDetecting && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/20 border border-purple-500/30 rounded-full">
                    <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                    <span className="text-purple-400 text-xs font-medium">Processing</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* QR Code Button */}
              <button
                onClick={() => setShowQRModal(true)}
                className="p-2.5 glass hover:bg-white/10 rounded-xl transition-all border border-white/10 hover:border-white/20"
                title="Share with congregation"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              </button>

              {/* Live View Link */}
              <a
                href="/live"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-blue-500/20"
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
            <div className={`glass border border-red-500/30 rounded-2xl p-4 ${mounted ? 'animate-fade-in' : 'opacity-0'}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Control Bar */}
          <div className={`glass-card rounded-2xl p-5 ${mounted ? 'animate-fade-in-up' : 'opacity-0'}`}>
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4">
              {/* Record Button */}
              <div className="flex items-center gap-3">
                {!isRecording ? (
                  <button
                    onClick={startRecording}
                    disabled={!isSupported || !hasPermission}
                    className="group relative flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-green-500/20 hover:shadow-green-500/30 disabled:shadow-none disabled:cursor-not-allowed"
                  >
                    <div className="w-3 h-3 bg-white rounded-full" />
                    Start Recording
                  </button>
                ) : (
                  <button
                    onClick={stopRecording}
                    className="group relative flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-red-500/20 hover:shadow-red-500/30"
                  >
                    <div className="w-3 h-3 bg-white rounded-sm" />
                    Stop Recording
                  </button>
                )}

                <button
                  onClick={handleClear}
                  className="p-3 glass hover:bg-white/10 rounded-xl transition-all border border-white/10 hover:border-white/20"
                  title="Clear all"
                >
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>

              {/* Divider */}
              <div className="hidden lg:block w-px h-10 bg-white/10 mx-2" />

              {/* Microphone Select */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex items-center gap-2 text-gray-400 text-sm whitespace-nowrap">
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                  <span className="hidden md:inline">Microphone</span>
                </div>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <select
                    value={selectedDevice || ''}
                    onChange={(e) => selectDevice(e.target.value)}
                    className="flex-1 min-w-0 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500/50 transition-colors truncate"
                  >
                    {devices.map((device) => (
                      <option key={device.deviceId} value={device.deviceId} className="bg-gray-900">
                        {device.label || `Microphone ${device.deviceId.slice(0, 8)}`}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={refreshDevices}
                    className="p-2.5 glass hover:bg-white/10 rounded-xl transition-all border border-white/10 shrink-0"
                    title="Refresh devices"
                  >
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Divider */}
              <div className="hidden lg:block w-px h-10 bg-white/10 mx-2" />

              {/* Translation Select */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-gray-400 text-sm whitespace-nowrap">
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <span className="hidden md:inline">Translation</span>
                </div>
                <select
                  value={translation}
                  onChange={(e) => setTranslation(e.target.value as BibleTranslation)}
                  className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500/50 transition-colors"
                >
                  <optgroup label="Offline" className="bg-gray-900 text-gray-400">
                    {TRANSLATIONS.filter(t => t.isPublicDomain).map((t) => (
                      <option key={t.code} value={t.code} className="bg-gray-900 text-white">
                        {t.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Premium" className="bg-gray-900 text-gray-400">
                    {TRANSLATIONS.filter(t => !t.isPublicDomain).map((t) => (
                      <option key={t.code} value={t.code} className="bg-gray-900 text-white">
                        {t.name}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Permission Request */}
              {!hasPermission && (
                <button
                  onClick={requestPermission}
                  className="px-4 py-2.5 bg-blue-500/20 border border-blue-500/30 text-blue-400 text-sm font-medium rounded-xl hover:bg-blue-500/30 transition-colors whitespace-nowrap"
                >
                  Grant Mic Access
                </button>
              )}
            </div>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 flex-1">
            {/* Transcript Panel */}
            <div className={`glass-card rounded-2xl overflow-hidden flex flex-col min-h-[500px] lg:h-[calc(100vh-280px)] ${mounted ? 'animate-fade-in-up delay-100' : 'opacity-0'}`}>
              <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">Live Transcript</h2>
                    <p className="text-xs text-gray-500">{transcript.length} segments</p>
                  </div>
                </div>
                {isRecording && (
                  <div className="sound-wave text-red-500">
                    <span /><span /><span /><span /><span />
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {transcript.length === 0 && !interimText ? (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                    </div>
                    <p className="text-gray-500 text-sm">Start recording to see the transcript</p>
                    <p className="text-gray-600 text-xs mt-1">Words will appear here in real-time</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {transcript.map((segment) => (
                      <div key={segment.id} className="group">
                        <p className="text-gray-300 leading-relaxed">{segment.text}</p>
                      </div>
                    ))}
                    {interimText && (
                      <p className="text-blue-400 leading-relaxed animate-pulse">{interimText}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Scripture Detection Panel */}
            <div className={`glass-card rounded-2xl overflow-hidden flex flex-col min-h-[500px] lg:h-[calc(100vh-280px)] ${mounted ? 'animate-fade-in-up delay-200' : 'opacity-0'}`}>
              {/* Tab Header */}
              <div className="flex border-b border-white/10">
                <button
                  onClick={() => setActiveTab('ai')}
                  className={`flex-1 px-6 py-4 text-sm font-medium transition-all ${
                    activeTab === 'ai'
                      ? 'text-purple-400 bg-purple-500/10 border-b-2 border-purple-500'
                      : 'text-gray-400 hover:text-gray-300 hover:bg-white/5'
                  }`}
                >
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    Detected
                    {gptScriptures.length > 0 && (
                      <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded-full">
                        {gptScriptures.length}
                      </span>
                    )}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('verses')}
                  className={`flex-1 px-6 py-4 text-sm font-medium transition-all ${
                    activeTab === 'verses'
                      ? 'text-blue-400 bg-blue-500/10 border-b-2 border-blue-500'
                      : 'text-gray-400 hover:text-gray-300 hover:bg-white/5'
                  }`}
                >
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    Scripture
                    {detectedScriptures.length > 0 && (
                      <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                        {detectedScriptures.length}
                      </span>
                    )}
                  </span>
                </button>
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {activeTab === 'ai' ? (
                  <GPTScriptureList
                    scriptures={gptScriptures}
                    isDetecting={isDetecting}
                    error={gptError}
                  />
                ) : (
                  <div className="space-y-4">
                    {detectedScriptures.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center py-16">
                        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                          <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                        </div>
                        <p className="text-gray-500 text-sm">Detected verses will appear here</p>
                        <p className="text-gray-600 text-xs mt-1">With full text from {translation}</p>
                      </div>
                    ) : (
                      detectedScriptures.map((scripture) => (
                        <div
                          key={scripture.id}
                          className={`glass rounded-xl p-5 border-l-4 transition-all ${
                            highlightedScriptureId === scripture.id
                              ? 'border-yellow-500 bg-yellow-500/10'
                              : 'border-blue-500'
                          }`}
                        >
                          <div className="text-lg font-semibold text-white mb-2">
                            {scripture.book} {scripture.chapter}:{scripture.verseStart}
                            {scripture.verseEnd && scripture.verseEnd !== scripture.verseStart && `-${scripture.verseEnd}`}
                          </div>
                          {scripture.verses.map((verse, i) => (
                            <p key={i} className="text-gray-300 text-sm leading-relaxed">
                              {verse.text}
                            </p>
                          ))}
                          <div className="mt-3 text-xs text-gray-500">{translation} Translation</div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* QR Code Modal */}
      <QRCodeModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
      />
    </div>
  );
}
