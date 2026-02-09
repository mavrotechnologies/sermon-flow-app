'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { TRANSLATIONS } from '@/types';

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0f] overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/50 via-[#0a0a0f] to-purple-950/30" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-float delay-300" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl animate-float delay-500" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <nav className={`flex items-center justify-between gap-4 ${mounted ? 'animate-fade-in' : 'opacity-0'}`}>
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="relative shrink-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                  <svg className="w-5 h-5 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded-full border-2 border-[#0a0a0f] animate-pulse" />
              </div>
              <div className="min-w-0">
                <span className="text-lg sm:text-2xl font-bold text-white tracking-tight">SermonFlow</span>
                <span className="hidden sm:block text-xs text-gray-500 -mt-1">AI-Powered Transcription</span>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-6 shrink-0">
              <Link
                href="/live"
                className="hidden sm:block text-gray-400 hover:text-white transition-colors text-sm font-medium"
              >
                Live View
              </Link>
              <Link
                href="/admin"
                className="px-3 py-2 sm:px-5 sm:py-2.5 bg-white/10 hover:bg-white/15 text-white text-xs sm:text-sm font-medium rounded-xl transition-all border border-white/10 hover:border-white/20 whitespace-nowrap"
              >
                Dashboard
              </Link>
            </div>
          </nav>
        </header>

        {/* Hero Section */}
        <main className="container mx-auto px-4 sm:px-6 pt-12 sm:pt-16 pb-16 sm:pb-24">
          <div className="max-w-5xl mx-auto">
            {/* Badge */}
            <div className={`flex justify-center mb-8 ${mounted ? 'animate-fade-in-up' : 'opacity-0'}`}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-purple-500/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                </span>
                <span className="text-sm text-purple-300 font-medium">AI-Powered Scripture Detection</span>
              </div>
            </div>

            {/* Main Headline */}
            <h1 className={`text-center mb-6 ${mounted ? 'animate-fade-in-up delay-100' : 'opacity-0'}`}>
              <span className="block text-5xl md:text-7xl font-bold text-white leading-tight tracking-tight">
                Transform Your
              </span>
              <span className="block text-5xl md:text-7xl font-bold gradient-text leading-tight tracking-tight mt-2">
                Sermon Experience
              </span>
            </h1>

            {/* Subtitle */}
            <p className={`text-xl text-gray-400 text-center max-w-2xl mx-auto mb-12 leading-relaxed ${mounted ? 'animate-fade-in-up delay-200' : 'opacity-0'}`}>
              Real-time transcription with intelligent Bible scripture detection.
              Let AI identify verses as your pastor speaks, instantly displaying
              the full text for your congregation.
            </p>

            {/* CTA Buttons */}
            <div className={`flex flex-col sm:flex-row items-center justify-center gap-4 mb-20 ${mounted ? 'animate-fade-in-up delay-300' : 'opacity-0'}`}>
              <Link
                href="/admin"
                className="group relative flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg font-semibold rounded-2xl transition-all shadow-2xl shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-105"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-50 group-hover:opacity-75 transition-opacity" />
                <span className="relative flex items-center gap-3">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Start Recording
                </span>
              </Link>
              <Link
                href="/live"
                className="flex items-center gap-3 px-8 py-4 glass hover:bg-white/10 text-white text-lg font-semibold rounded-2xl transition-all border border-white/10 hover:border-white/20"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Join as Viewer
              </Link>
            </div>

            {/* Preview Window */}
            <div className={`relative max-w-4xl mx-auto ${mounted ? 'animate-scale-in delay-400' : 'opacity-0'}`}>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-3xl blur-xl" />
              <div className="relative glass-card rounded-3xl overflow-hidden">
                {/* Window Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  </div>
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    Recording...
                  </div>
                </div>

                {/* Preview Content */}
                <div className="p-8 grid md:grid-cols-2 gap-8">
                  {/* Transcript Side */}
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider mb-3">Live Transcript</div>
                    <div className="space-y-3">
                      <p className="text-gray-300 leading-relaxed">
                        &quot;And the Bible tells us in the book of Psalms...&quot;
                      </p>
                      <p className="text-gray-300 leading-relaxed">
                        &quot;The Lord is my shepherd, I shall not want. He makes me lie down in green pastures...&quot;
                      </p>
                      <p className="text-blue-400 leading-relaxed animate-pulse">
                        &quot;He leads me beside still waters...&quot;
                      </p>
                    </div>
                  </div>

                  {/* Scripture Side */}
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider mb-3">Detected Scripture</div>
                    <div className="glass rounded-xl p-5 border-l-4 border-blue-500">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">High Confidence</span>
                      </div>
                      <div className="text-lg font-semibold text-white mb-2">Psalm 23:1-2</div>
                      <p className="text-gray-300 text-sm leading-relaxed">
                        &quot;The LORD is my shepherd; I shall not want. He maketh me to lie down in green pastures: he leadeth me beside the still waters.&quot;
                      </p>
                      <div className="mt-3 text-xs text-gray-500">KJV Translation</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Features Section */}
        <section className="container mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <div className={`text-center mb-16 ${mounted ? 'animate-fade-in-up' : 'opacity-0'}`}>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Everything You Need
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Powerful features designed specifically for churches and ministries
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <FeatureCard
              icon={
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              }
              title="Intelligent Detection"
              description="Advanced AI identifies Bible references, including paraphrases and allusions, not just exact quotes."
              gradient="from-blue-500 to-cyan-500"
              delay="delay-100"
              mounted={mounted}
            />
            <FeatureCard
              icon={
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              }
              title="Real-Time Processing"
              description="Instant transcription and scripture detection as words are spoken. No delay, no waiting."
              gradient="from-purple-500 to-pink-500"
              delay="delay-200"
              mounted={mounted}
            />
            <FeatureCard
              icon={
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              }
              title="Congregation Access"
              description="Share via QR code. Members follow along on their phones with live transcript and verses."
              gradient="from-orange-500 to-yellow-500"
              delay="delay-300"
              mounted={mounted}
            />
          </div>
        </section>

        {/* How It Works */}
        <section className="container mx-auto px-4 sm:px-6 py-16 sm:py-24 border-t border-white/5">
          <div className={`text-center mb-16 ${mounted ? 'animate-fade-in-up' : 'opacity-0'}`}>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Simple Setup
            </h2>
            <p className="text-gray-400 text-lg">
              Get started in under a minute
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <Step number={1} title="Connect" description="Plug in your microphone or connect your sound system" mounted={mounted} delay="delay-100" />
            <Step number={2} title="Record" description="Click start and begin speaking or preaching" mounted={mounted} delay="delay-200" />
            <Step number={3} title="Detect" description="AI automatically finds Bible references in speech" mounted={mounted} delay="delay-300" />
            <Step number={4} title="Display" description="Full verse text appears instantly for everyone" mounted={mounted} delay="delay-400" />
          </div>
        </section>

        {/* Stats Section */}
        <section className="container mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <div className={`glass-card rounded-3xl p-12 max-w-5xl mx-auto ${mounted ? 'animate-scale-in' : 'opacity-0'}`}>
            <div className="grid md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold gradient-text mb-2">14</div>
                <div className="text-gray-400">Bible Translations</div>
              </div>
              <div>
                <div className="text-4xl font-bold gradient-text mb-2">31,102</div>
                <div className="text-gray-400">Verses Indexed</div>
              </div>
              <div>
                <div className="text-4xl font-bold gradient-text mb-2">&lt;1s</div>
                <div className="text-gray-400">Detection Speed</div>
              </div>
              <div>
                <div className="text-4xl font-bold gradient-text mb-2">99%</div>
                <div className="text-gray-400">Accuracy Rate</div>
              </div>
            </div>
          </div>
        </section>

        {/* Translations */}
        <section className="container mx-auto px-4 sm:px-6 py-16 sm:py-20 border-t border-white/5">
          <div className={`text-center mb-12 ${mounted ? 'animate-fade-in-up' : 'opacity-0'}`}>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              14 Bible Translations
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              From classic KJV to modern translations - choose what works best for your congregation
            </p>
          </div>

          {/* Public Domain Translations */}
          <div className={`max-w-4xl mx-auto mb-8 ${mounted ? 'animate-fade-in-up delay-100' : 'opacity-0'}`}>
            <div className="flex items-center justify-center gap-2 mb-5">
              <div className="w-2.5 h-2.5 bg-green-500 rounded-full" />
              <h4 className="text-xs font-medium text-green-400 uppercase tracking-wider">Full Offline Support</h4>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              {TRANSLATIONS.filter(t => t.isPublicDomain).map((t) => (
                <span
                  key={t.code}
                  className="glass rounded-xl px-6 py-2.5 text-white font-medium hover:bg-white/10 transition-all"
                >
                  {t.name}
                </span>
              ))}
            </div>
          </div>

          {/* Premium Translations */}
          <div className={`max-w-4xl mx-auto ${mounted ? 'animate-fade-in-up delay-200' : 'opacity-0'}`}>
            <div className="flex items-center justify-center gap-2 mb-5">
              <div className="w-2.5 h-2.5 bg-purple-500 rounded-full" />
              <h4 className="text-xs font-medium text-purple-400 uppercase tracking-wider">Premium Translations</h4>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              {TRANSLATIONS.filter(t => !t.isPublicDomain).map((t) => (
                <span
                  key={t.code}
                  className="glass rounded-xl px-6 py-2.5 text-white font-medium hover:bg-white/10 transition-all border border-purple-500/20"
                >
                  {t.name}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 border-t border-white/5">
          <div className="flex flex-col gap-8">
            {/* Top Row */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <span className="text-gray-400 text-sm">SermonFlow - AI-Powered Sermon Transcription</span>
              </div>
              <div className="text-gray-500 text-sm">
                Best experienced in Chrome or Edge browsers
              </div>
            </div>

            {/* Divider */}
            <div className="w-full h-px bg-white/5" />

            {/* Bottom Row - Developer Info */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-center">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                <span className="text-gray-400 text-sm">
                  Built by <span className="text-white font-medium">Asare Daniel</span>
                </span>
              </div>
              <span className="hidden sm:inline text-gray-600">•</span>
              <a
                href="tel:+233532828138"
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
              >
                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>+233 532 828 138</span>
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  gradient,
  delay,
  mounted,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
  delay: string;
  mounted: boolean;
}) {
  return (
    <div className={`group glass-card rounded-2xl p-8 hover-lift ${mounted ? `animate-fade-in-up ${delay}` : 'opacity-0'}`}>
      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-white mb-3">{title}</h3>
      <p className="text-gray-400 leading-relaxed">{description}</p>
    </div>
  );
}

function Step({
  number,
  title,
  description,
  mounted,
  delay,
}: {
  number: number;
  title: string;
  description: string;
  mounted: boolean;
  delay: string;
}) {
  return (
    <div className={`text-center ${mounted ? `animate-fade-in-up ${delay}` : 'opacity-0'}`}>
      <div className="relative inline-flex mb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-blue-500/25">
          {number}
        </div>
        {number < 4 && (
          <div className="hidden md:block absolute left-full top-1/2 w-full h-px bg-gradient-to-r from-blue-500/50 to-transparent -translate-y-1/2 ml-4" />
        )}
      </div>
      <h4 className="text-lg font-semibold text-white mb-2">{title}</h4>
      <p className="text-gray-400 text-sm">{description}</p>
    </div>
  );
}
