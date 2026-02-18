'use client';

import { useState, useEffect } from 'react';
import type { VmixSettings } from '@/types';

interface VmixSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: VmixSettings;
  onSave: (settings: Partial<VmixSettings>) => void;
  displayUrl: string;
}

export function VmixSettingsModal({
  isOpen,
  onClose,
  settings,
  onSave,
  displayUrl,
}: VmixSettingsModalProps) {
  const [draft, setDraft] = useState(settings);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDraft(settings);
      setCopied(false);
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(draft);
    onClose();
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(displayUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="relative p-[1px] rounded-2xl bg-gradient-to-b from-blue-500/30 via-blue-500/10 to-transparent max-w-md w-full mx-4 animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-[#0c0c10] rounded-2xl p-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Projector Display</h3>
              <p className="text-xs text-gray-500">Scripture display for vMix / projector</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Enable Toggle */}
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm text-gray-300">Enable Projector Display</span>
              <button
                type="button"
                role="switch"
                aria-checked={draft.enabled}
                onClick={() => setDraft((d) => ({ ...d, enabled: !d.enabled }))}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  draft.enabled ? 'bg-blue-600' : 'bg-white/10'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                    draft.enabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </label>

            {/* Display URL */}
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Display URL (load in vMix Web Browser input)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={displayUrl}
                  className="flex-1 px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-xs font-mono outline-none select-all"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <button
                  onClick={copyUrl}
                  className={`px-3 py-2.5 rounded-xl text-xs font-medium transition-all shrink-0 ${
                    copied
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'glass border border-white/10 hover:border-blue-500/30 hover:bg-blue-500/10 text-gray-300'
                  }`}
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Setup Instructions */}
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <p className="text-xs text-gray-400 font-medium mb-2">vMix Setup:</p>
              <ol className="text-xs text-gray-500 space-y-1 list-decimal list-inside">
                <li>In vMix, click <span className="text-gray-300">Add Input</span> &rarr; <span className="text-gray-300">Web Browser</span></li>
                <li>Paste the Display URL above</li>
                <li>Set resolution to <span className="text-gray-300">1920 x 1080</span></li>
                <li>Use Fade/Cut in vMix to show the input on output</li>
              </ol>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3 justify-end mt-6 pt-4 border-t border-white/5">
            <button
              onClick={onClose}
              className="px-4 py-2.5 glass border border-white/10 hover:border-white/20 hover:bg-white/10 text-gray-300 text-sm font-medium rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/20"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
