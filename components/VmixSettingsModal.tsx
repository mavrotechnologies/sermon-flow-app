'use client';

import { useState, useEffect } from 'react';
import type { VmixSettings } from '@/types';
import { isMixedContentBlocked } from '@/lib/vmix';

interface VmixSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: VmixSettings;
  onSave: (settings: Partial<VmixSettings>) => void;
  onTestConnection: () => Promise<{ success: boolean; error?: string }>;
  isTesting: boolean;
  isConnected: boolean;
  roomCode: string;
}

export function VmixSettingsModal({
  isOpen,
  onClose,
  settings,
  onSave,
  onTestConnection,
  isTesting,
  isConnected,
  roomCode,
}: VmixSettingsModalProps) {
  const [draft, setDraft] = useState(settings);
  const [testResult, setTestResult] = useState<{ success: boolean; error?: string } | null>(null);
  const bridgeMode = isMixedContentBlocked();

  // Sync draft when modal opens
  useEffect(() => {
    if (isOpen) {
      setDraft(settings);
      setTestResult(null);
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const appUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const handleTest = async () => {
    onSave(draft);
    const result = await onTestConnection();
    setTestResult(result);
  };

  const handleSave = () => {
    onSave(draft);
    onClose();
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
              <h3 className="text-lg font-semibold text-white">vMix Settings</h3>
              <p className="text-xs text-gray-500">Configure live video overlay</p>
            </div>
          </div>

          {/* Bridge mode info */}
          {bridgeMode && (
            <div className="mb-4 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <div className="flex gap-2">
                <svg className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-blue-400 text-xs font-medium">Bridge Mode</p>
                  <p className="text-blue-400/70 text-xs mt-1">
                    Commands are sent via the SermonFlow server to the bridge script on the vMix PC.
                    Run <span className="font-mono bg-white/5 px-1 rounded">vmix-bridge.js</span> on the vMix machine with:
                  </p>
                  <div className="mt-2 p-2 bg-black/30 rounded-lg">
                    <code className="text-[10px] text-green-400 font-mono break-all select-all">
                      node vmix-bridge.js --url {appUrl} --room {roomCode}
                    </code>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {/* Enable Toggle */}
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm text-gray-300">Enable vMix Integration</span>
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

            {/* Direct mode fields (only when not in bridge mode) */}
            {!bridgeMode && (
              <>
                {/* Host IP */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">vMix Host IP</label>
                  <input
                    type="text"
                    value={draft.host}
                    onChange={(e) => setDraft((d) => ({ ...d, host: e.target.value }))}
                    onBlur={(e) => {
                      let h = e.target.value.trim();
                      h = h.replace(/^https?:\/\//, '');
                      h = h.replace(/\/.*$/, '');
                      h = h.replace(/:\d+$/, '');
                      setDraft((d) => ({ ...d, host: h }));
                    }}
                    placeholder="192.168.1.100"
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-gray-500 outline-none focus:border-blue-500/50 transition-colors"
                  />
                </div>

                {/* Port + Title Input */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Port</label>
                    <input
                      type="number"
                      value={draft.port}
                      onChange={(e) => setDraft((d) => ({ ...d, port: parseInt(e.target.value) || 8088 }))}
                      className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-blue-500/50 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Title Input #</label>
                    <input
                      type="text"
                      value={draft.titleInput}
                      onChange={(e) => setDraft((d) => ({ ...d, titleInput: e.target.value }))}
                      placeholder="1"
                      className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-gray-500 outline-none focus:border-blue-500/50 transition-colors"
                    />
                  </div>
                </div>

                {/* Field Names */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Reference Field Name</label>
                  <input
                    type="text"
                    value={draft.referenceField}
                    onChange={(e) => setDraft((d) => ({ ...d, referenceField: e.target.value }))}
                    placeholder="Headline.Text"
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-gray-500 outline-none focus:border-blue-500/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Verse Text Field Name</label>
                  <input
                    type="text"
                    value={draft.verseTextField}
                    onChange={(e) => setDraft((d) => ({ ...d, verseTextField: e.target.value }))}
                    placeholder="Description.Text"
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-gray-500 outline-none focus:border-blue-500/50 transition-colors"
                  />
                </div>

                {/* Test Connection */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleTest}
                    disabled={!draft.host || isTesting}
                    className="flex items-center gap-2 px-4 py-2.5 glass border border-white/10 hover:border-blue-500/30 hover:bg-blue-500/10 text-gray-300 text-sm font-medium rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isTesting ? (
                      <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.858 15.355-5.858 21.213 0" />
                      </svg>
                    )}
                    Test Connection
                  </button>
                  {testResult && (
                    <span className={`text-xs font-medium ${testResult.success ? 'text-green-400' : 'text-red-400'}`}>
                      {testResult.success ? 'Connected!' : testResult.error || 'Failed'}
                    </span>
                  )}
                  {!testResult && isConnected && (
                    <span className="text-xs font-medium text-green-400/60">Previously connected</span>
                  )}
                </div>
              </>
            )}
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
