'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { TRANSLATIONS } from '@/types';
import { useInView } from '@/hooks/useInView';

export default function Home() {
  const [mounted, setMounted] = useState(false);

  // Scroll-triggered refs
  const [howItWorksRef, howItWorksInView] = useInView<HTMLDivElement>({ threshold: 0.2 });
  const [seeItRef, seeItInView] = useInView<HTMLDivElement>({ threshold: 0.2 });
  const [featuresRef, featuresInView] = useInView<HTMLDivElement>({ threshold: 0.1 });
  const [translationsRef, translationsInView] = useInView<HTMLDivElement>({ threshold: 0.1 });
  const [ctaRef, ctaInView] = useInView<HTMLDivElement>({ threshold: 0.3 });

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-[#0a0a0f] to-[#0a0a0f]" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-white/5">
          <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <span className="text-lg font-semibold text-white">SermonFlow</span>
            </Link>
            <nav className="flex items-center gap-3">
              <Link href="/live" className="hidden sm:block px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">
                Live View
              </Link>
              <Link href="/admin" className="px-4 py-2 text-sm font-medium text-white bg-white/10 hover:bg-white/15 rounded-lg border border-white/10 transition-colors">
                Open Dashboard
              </Link>
            </nav>
          </div>
        </header>

        {/* Hero */}
        <section className="max-w-5xl mx-auto px-4 md:px-6 pt-14 md:pt-24 pb-14 md:pb-16">
          <div className="text-center">
            {/* Badge */}
            <div className={`${mounted ? 'animate-fade-in-up' : 'opacity-0'}`}>
              <div className="inline-block px-4 py-1.5 bg-white/5 border border-white/10 rounded-full mb-6">
                <span className="text-sm font-medium text-gray-400">Free & Open Source</span>
              </div>
            </div>

            {/* Heading */}
            <div className={`${mounted ? 'animate-fade-in-up delay-100' : 'opacity-0'}`}>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-5 max-w-3xl mx-auto">
                Automatic Bible verse detection for{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
                  live sermons
                </span>
              </h1>
            </div>

            {/* Subtitle */}
            <div className={`${mounted ? 'animate-fade-in-up delay-200' : 'opacity-0'}`}>
              <p className="text-lg md:text-xl text-gray-300 leading-relaxed mb-8 max-w-2xl mx-auto">
                SermonFlow listens to your sermon in real-time, detects Bible references, generates AI sermon notes, and broadcasts everything live to your congregation.
              </p>
            </div>

            {/* Buttons */}
            <div className={`flex flex-col sm:flex-row gap-3 justify-center mb-12 ${mounted ? 'animate-fade-in-up delay-300' : 'opacity-0'}`}>
              <Link
                href="/admin"
                className="flex items-center justify-center gap-2 h-12 px-7 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-medium text-base rounded-xl transition-all shadow-lg shadow-purple-500/25"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Start Recording
              </Link>
              <Link
                href="/live"
                className="flex items-center justify-center gap-2 h-12 px-7 bg-white/5 hover:bg-white/10 text-white font-medium text-base rounded-xl border border-white/10 transition-colors"
              >
                View Live Demo
              </Link>
            </div>

            {/* Quick Stats */}
            <div className={`flex items-center justify-center gap-8 md:gap-14 pt-8 border-t border-white/5 mt-10 ${mounted ? 'animate-fade-in-up delay-400' : 'opacity-0'}`}>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white">6</div>
                <div className="text-sm text-gray-400 mt-1">Translations</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white">&lt;1s</div>
                <div className="text-sm text-gray-400 mt-1">Detection</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white">Live</div>
                <div className="text-sm text-gray-400 mt-1">Broadcasting</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white">AI</div>
                <div className="text-sm text-gray-400 mt-1">Sermon Notes</div>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="bg-[#0d0e13]">
          <div ref={howItWorksRef} className="max-w-5xl mx-auto px-4 md:px-6 py-16 md:py-24">
            <div className={`mb-12 text-center transition-all duration-700 ${howItWorksInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4">How it works</h2>
              <p className="text-base md:text-lg text-gray-300 max-w-xl mx-auto">
                A simple 3-step process. No account required, no special hardware.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-12 md:gap-8">
              {/* Step 1 */}
              <div className={`relative text-center md:text-left transition-all duration-700 ${howItWorksInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '150ms' }}>
                <div className="flex flex-col items-center md:flex-row md:items-center gap-3 mb-4 md:justify-start">
                  <div className="w-12 h-12 md:w-10 md:h-10 bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-xl flex items-center justify-center text-blue-400 font-bold text-lg md:text-base">
                    1
                  </div>
                  <h3 className="text-lg md:text-xl font-semibold text-white">Speak naturally</h3>
                </div>
                <p className="text-base text-gray-400 leading-relaxed md:pl-[52px]">
                  Preach as you normally would. Say any verse reference naturally and SermonFlow will pick it up instantly.
                </p>
                <div className={`hidden md:block absolute top-5 left-full w-6 border-t-2 border-dashed border-blue-500/30 transition-all duration-500 ${howItWorksInView ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'}`} style={{ transitionDelay: '400ms', transformOrigin: 'left' }} />
              </div>

              {/* Step 2 */}
              <div className={`relative text-center md:text-left transition-all duration-700 ${howItWorksInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '300ms' }}>
                <div className="flex flex-col items-center md:flex-row md:items-center gap-3 mb-4 md:justify-start">
                  <div className="w-12 h-12 md:w-10 md:h-10 bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 rounded-xl flex items-center justify-center text-purple-400 font-bold text-lg md:text-base">
                    2
                  </div>
                  <h3 className="text-lg md:text-xl font-semibold text-white">AI detects & generates</h3>
                </div>
                <p className="text-base text-gray-400 leading-relaxed md:pl-[52px]">
                  Multi-stage AI pipeline detects scripture references while simultaneously generating structured sermon notes.
                </p>
                <div className={`hidden md:block absolute top-5 left-full w-6 border-t-2 border-dashed border-purple-500/30 transition-all duration-500 ${howItWorksInView ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'}`} style={{ transitionDelay: '550ms', transformOrigin: 'left' }} />
              </div>

              {/* Step 3 */}
              <div className={`text-center md:text-left transition-all duration-700 ${howItWorksInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '450ms' }}>
                <div className="flex flex-col items-center md:flex-row md:items-center gap-3 mb-4 md:justify-start">
                  <div className="w-12 h-12 md:w-10 md:h-10 bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 border border-emerald-500/30 rounded-xl flex items-center justify-center text-emerald-400 font-bold text-lg md:text-base">
                    3
                  </div>
                  <h3 className="text-lg md:text-xl font-semibold text-white">Share live with your church</h3>
                </div>
                <p className="text-base text-gray-400 leading-relaxed md:pl-[52px]">
                  Share a room code or QR code. Your congregation follows along with transcript, verses, and notes on their phones.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Live Preview Demo */}
        <section className="border-t border-white/5">
          <div ref={seeItRef} className="max-w-4xl mx-auto px-4 md:px-6 py-16 md:py-24">
            <div className={`text-center mb-10 transition-all duration-700 ${seeItInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4">
                See it in action
              </h2>
              <p className="text-base md:text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
                The dashboard shows your live transcript and detected scriptures side by side, while AI generates structured notes in the background.
              </p>

              <div className="inline-flex flex-col items-start gap-3 mb-8 text-left">
                <div className={`flex items-start gap-3 transition-all duration-500 ${seeItInView ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`} style={{ transitionDelay: '200ms' }}>
                  <svg className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-300 text-base">Real-time speech-to-text with Deepgram AI</span>
                </div>
                <div className={`flex items-start gap-3 transition-all duration-500 ${seeItInView ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`} style={{ transitionDelay: '350ms' }}>
                  <svg className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-300 text-base">Multi-stage AI verse detection (regex + semantic + GPT)</span>
                </div>
                <div className={`flex items-start gap-3 transition-all duration-500 ${seeItInView ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`} style={{ transitionDelay: '500ms' }}>
                  <svg className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-300 text-base">AI-generated sermon notes with key points & themes</span>
                </div>
                <div className={`flex items-start gap-3 transition-all duration-500 ${seeItInView ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`} style={{ transitionDelay: '650ms' }}>
                  <svg className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-300 text-base">Room codes for private live broadcasting to congregation</span>
                </div>
              </div>

              <div className={`mb-10 transition-all duration-500 ${seeItInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: '750ms' }}>
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-2 px-6 py-3 text-base font-medium text-violet-400 border border-violet-500/30 rounded-xl hover:bg-violet-500/10 transition-colors"
                >
                  Try it yourself
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>

            {/* Preview Window */}
            <div className={`relative max-w-3xl mx-auto transition-all duration-700 ${seeItInView ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`} style={{ transitionDelay: '400ms' }}>
              <div className="absolute -inset-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-3xl blur-2xl" />
              <div className="relative bg-[#12141a] rounded-xl border border-white/10 overflow-hidden shadow-2xl shadow-purple-500/10">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-[#0d0f14]">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                    <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                    <div className="w-3 h-3 rounded-full bg-[#28c840]" />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-mono font-bold rounded-full">
                      ROOM: HK4N7P
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-red-500 rounded-full animate-recording" />
                      <span className="text-xs text-gray-500">Recording</span>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-white/5">
                  {/* Transcript */}
                  <div className="p-5">
                    <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-3 font-medium">Live Transcript</div>
                    <div className="space-y-2.5 text-sm text-gray-400 text-left">
                      <p>&quot;Let&apos;s turn to the book of Psalms...&quot;</p>
                      <p>&quot;The Lord is my shepherd, I shall not want...&quot;</p>
                      <p className="text-purple-400">&quot;He leads me beside still waters...&quot;</p>
                    </div>
                  </div>

                  {/* Scripture + Notes */}
                  <div className="p-5 bg-white/[0.02]">
                    <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-3 font-medium">Detected Scripture</div>
                    <div className="bg-[#1a1d24] rounded-lg p-3.5 border-l-2 border-purple-500 text-left mb-3">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] px-1.5 py-0.5 bg-purple-500/20 text-purple-400 rounded font-medium">98%</span>
                      </div>
                      <div className="text-sm font-semibold text-white mb-1.5">Psalm 23:1-2</div>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        &quot;The LORD is my shepherd; I shall not want. He maketh me to lie down in green pastures...&quot;
                      </p>
                      <div className="text-[10px] text-gray-600 mt-2">KJV</div>
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-2 font-medium">AI Notes</div>
                    <div className="bg-[#1a1d24] rounded-lg p-3 border-l-2 border-green-500 text-left">
                      <span className="px-1.5 py-0.5 bg-green-500/15 text-green-400 text-[10px] font-medium rounded-full">God&apos;s Provision</span>
                      <p className="text-xs text-gray-300 mt-1.5 font-medium">God as shepherd provides complete care and rest</p>
                      <p className="text-[11px] text-gray-500 mt-1">- Green pastures symbolize spiritual nourishment</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="border-t border-white/5 bg-white/[0.02]">
          <div ref={featuresRef} className="max-w-6xl mx-auto px-4 md:px-6 py-16 md:py-24">
            <div className={`mb-14 text-center transition-all duration-700 ${featuresInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4">Built for real churches</h2>
              <p className="text-base md:text-lg text-gray-400 max-w-2xl mx-auto">
                Every feature is designed with real church needs in mind. Simple to use, powerful when you need it.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
              <div className={`transition-all duration-700 ${featuresInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '100ms' }}>
                <FeatureCard
                  icon={<BrainIcon />}
                  title="Multi-Stage AI Detection"
                  description="Regex, semantic search, streaming word-by-word analysis, and GPT fallback work together for near-perfect scripture detection."
                  accent="purple"
                />
              </div>
              <div className={`transition-all duration-700 ${featuresInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '200ms' }}>
                <FeatureCard
                  icon={<NotesIcon />}
                  title="AI Sermon Notes"
                  description="Automatically generates structured notes with main points, sub-points, key quotes, and theme tags as the sermon progresses."
                  accent="green"
                />
              </div>
              <div className={`transition-all duration-700 ${featuresInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '300ms' }}>
                <FeatureCard
                  icon={<BroadcastIcon />}
                  title="Live Broadcasting"
                  description="Private room codes let your congregation follow along in real-time. Transcript, scriptures, and notes all sync live."
                  accent="blue"
                />
              </div>
              <div className={`transition-all duration-700 ${featuresInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '400ms' }}>
                <FeatureCard
                  icon={<QRIcon />}
                  title="QR Code Sharing"
                  description="Generate a QR code with your room link. Display it on screen and let everyone join with a quick scan."
                  accent="purple"
                />
              </div>
              <div className={`transition-all duration-700 ${featuresInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '500ms' }}>
                <FeatureCard
                  icon={<GlobeIcon />}
                  title="Multiple Translations"
                  description="Choose from 6 Bible translations including KJV, NKJV, NIV, NLT, and more. Switch translations anytime during the service."
                  accent="blue"
                />
              </div>
              <div className={`transition-all duration-700 ${featuresInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '600ms' }}>
                <FeatureCard
                  icon={<MicIcon />}
                  title="Any Microphone"
                  description="Use your existing audio setup - USB mic, wireless system, or built-in laptop microphone. Deepgram STT for best results."
                  accent="green"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Translations Section */}
        <section className="border-t border-white/5">
          <div ref={translationsRef} className="max-w-4xl mx-auto px-4 md:px-6 py-16 md:py-24">
            <div className={`text-center mb-10 transition-all duration-700 ${translationsInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4">
                6 Bible translations
              </h2>
              <p className="text-base md:text-lg text-gray-300 max-w-xl mx-auto">
                Switch between translations instantly. Public domain versions work offline, modern translations fetch via API.
              </p>
            </div>

            {/* Legend */}
            <div className={`flex items-center justify-center gap-6 mb-8 transition-all duration-700 ${translationsInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '150ms' }}>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-base text-gray-400">Offline available</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
                <span className="text-base text-gray-400">Online required</span>
              </div>
            </div>

            {/* All translations in one grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {TRANSLATIONS.map((t, index) => (
                <div
                  key={t.code}
                  className={`px-5 py-4 rounded-xl border text-center transition-all duration-500 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/10 ${
                    t.isPublicDomain
                      ? 'bg-purple-500/5 border-purple-500/20 hover:border-purple-500/40'
                      : 'bg-white/[0.02] border-white/5 hover:border-white/20'
                  } ${translationsInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                  style={{ transitionDelay: `${200 + index * 80}ms` }}
                >
                  <div className="flex items-center justify-center gap-2 mb-1.5">
                    <span className="text-lg font-bold text-white">{t.code}</span>
                    {t.isPublicDomain && (
                      <svg className="w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div className="text-sm text-gray-400">{t.fullName}</div>
                  <div className="text-xs text-gray-500 mt-1">{t.description}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-white/5">
          <div ref={ctaRef} className="max-w-6xl mx-auto px-4 md:px-6 py-16 md:py-24 text-center">
            {/* Subtle glow */}
            <div className={`relative inline-block mb-8 transition-all duration-700 ${ctaInView ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
              <div className="absolute -inset-4 bg-purple-500/20 rounded-full blur-2xl animate-pulse-glow-slow" />
              <div className="relative w-14 h-14 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <h2 className={`text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4 transition-all duration-700 ${ctaInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`} style={{ transitionDelay: '100ms' }}>
              Ready to try it?
            </h2>
            <p className={`text-base md:text-lg text-gray-300 mb-10 max-w-lg mx-auto transition-all duration-700 ${ctaInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`} style={{ transitionDelay: '200ms' }}>
              No sign up required. Just open the dashboard, allow microphone access, and start speaking. Your congregation can join with a room code.
            </p>
            <div className={`flex flex-col sm:flex-row gap-3 justify-center transition-all duration-700 ${ctaInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`} style={{ transitionDelay: '300ms' }}>
              <Link
                href="/admin"
                className="flex items-center justify-center gap-2 h-13 px-8 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold text-base rounded-xl transition-all shadow-lg shadow-purple-500/25"
              >
                Open Dashboard
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              <Link
                href="/live"
                className="flex items-center justify-center gap-2 h-13 px-8 bg-white/5 hover:bg-white/10 text-white font-semibold text-base rounded-xl border border-white/10 transition-colors"
              >
                View as Congregation
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/5 bg-[#08090c]">
          <div className="max-w-5xl mx-auto px-4 md:px-6 py-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
              {/* Brand */}
              <div className="col-span-2 md:col-span-1">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  </div>
                  <span className="font-semibold text-white">SermonFlow</span>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">AI-powered Bible verse detection and sermon notes for live services.</p>
              </div>

              {/* Product */}
              <div>
                <h4 className="text-sm font-semibold text-white mb-3">Product</h4>
                <ul className="space-y-2.5 text-sm">
                  <li><Link href="/admin" className="text-gray-400 hover:text-white transition-colors">Dashboard</Link></li>
                  <li><Link href="/live" className="text-gray-400 hover:text-white transition-colors">Live View</Link></li>
                </ul>
              </div>

              {/* Resources */}
              <div>
                <h4 className="text-sm font-semibold text-white mb-3">Resources</h4>
                <ul className="space-y-2.5 text-sm">
                  <li><a href="https://github.com" className="text-gray-400 hover:text-white transition-colors">GitHub</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Documentation</a></li>
                </ul>
              </div>

              {/* Contact */}
              <div>
                <h4 className="text-sm font-semibold text-white mb-3">Contact</h4>
                <ul className="space-y-2.5 text-sm">
                  <li><span className="text-gray-400">Asare Daniel</span></li>
                  <li><a href="tel:+233532828138" className="text-gray-400 hover:text-white transition-colors">+233 532 828 138</a></li>
                </ul>
              </div>
            </div>

            {/* Bottom */}
            <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-gray-500">&copy; {new Date().getFullYear()} SermonFlow. Free and open source.</p>
              <div className="flex items-center gap-4">
                <a href="https://github.com" className="text-gray-500 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description, accent }: { icon: React.ReactNode; title: string; description: string; accent: 'purple' | 'blue' | 'green' }) {
  const accentStyles = {
    purple: 'bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20',
    blue: 'bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20',
    green: 'bg-green-500/10 text-green-400 group-hover:bg-green-500/20',
  };
  const borderHover = {
    purple: 'hover:border-purple-500/20 hover:shadow-purple-500/5',
    blue: 'hover:border-blue-500/20 hover:shadow-blue-500/5',
    green: 'hover:border-green-500/20 hover:shadow-green-500/5',
  };

  return (
    <div className={`p-6 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/[0.04] hover:-translate-y-1 hover:shadow-lg transition-all duration-300 text-center sm:text-left group ${borderHover[accent]}`}>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 mx-auto sm:mx-0 transition-colors ${accentStyles[accent]}`}>
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-base text-gray-400 leading-relaxed">{description}</p>
    </div>
  );
}

// Icons
function MicIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function QRIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
    </svg>
  );
}

function BrainIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  );
}

function NotesIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );
}

function BroadcastIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.14 0M1.394 9.393c5.857-5.858 15.355-5.858 21.213 0" />
    </svg>
  );
}
