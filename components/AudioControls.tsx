'use client';

import { useEffect, useState } from 'react';
import type { AudioDevice, BibleTranslation } from '@/types';

interface AudioControlsProps {
  isRecording: boolean;
  devices: AudioDevice[];
  selectedDevice: string | null;
  onDeviceSelect: (deviceId: string) => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onClear: () => void;
  onRefreshDevices: () => void;
  translation: BibleTranslation;
  onTranslationChange: (translation: BibleTranslation) => void;
  hasPermission: boolean;
  onRequestPermission: () => void;
  isSupported: boolean;
}

const TRANSLATIONS: BibleTranslation[] = ['KJV', 'WEB', 'ASV', 'NKJV', 'NIV', 'NLT'];

/**
 * Audio controls panel for managing recording and device selection
 */
export function AudioControls({
  isRecording,
  devices,
  selectedDevice,
  onDeviceSelect,
  onStartRecording,
  onStopRecording,
  onClear,
  onRefreshDevices,
  translation,
  onTranslationChange,
  hasPermission,
  onRequestPermission,
  isSupported,
}: AudioControlsProps) {
  // Prevent hydration mismatch by only rendering client-specific UI after mount
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Show loading state until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
        <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (!isSupported) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-700 dark:text-red-400 text-sm">
          Speech recognition is not supported in this browser. Please use Chrome or Edge.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 space-y-4">
      {/* Permission Request */}
      {!hasPermission && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
          <p className="text-yellow-700 dark:text-yellow-400 text-sm mb-2">
            Microphone permission required for transcription
          </p>
          <button
            onClick={onRequestPermission}
            className="px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white text-sm rounded-md transition-colors"
          >
            Grant Permission
          </button>
        </div>
      )}

      {/* Controls Row */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Record/Stop Button */}
        <button
          onClick={isRecording ? onStopRecording : onStartRecording}
          disabled={!hasPermission}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-white transition-all ${
            isRecording
              ? 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/30'
              : 'bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed'
          }`}
        >
          {isRecording ? (
            <>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" rx="1" />
              </svg>
              Stop Recording
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="8" />
              </svg>
              Start Recording
            </>
          )}
        </button>

        {/* Clear Button */}
        <button
          onClick={onClear}
          className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Clear
        </button>

        {/* Device Selector */}
        <div className="flex items-center gap-2 min-w-0 w-full sm:w-auto sm:max-w-xs">
          <label className="text-sm text-gray-600 dark:text-gray-400 shrink-0">
            Microphone:
          </label>
          <select
            value={selectedDevice || ''}
            onChange={(e) => onDeviceSelect(e.target.value)}
            disabled={!hasPermission || devices.length === 0}
            className="flex-1 min-w-0 w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {devices.length === 0 ? (
              <option value="">No devices found</option>
            ) : (
              devices.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label}
                </option>
              ))
            )}
          </select>
          <button
            onClick={onRefreshDevices}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            title="Refresh devices"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        {/* Translation Selector */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600 dark:text-gray-400">
            Translation:
          </label>
          <select
            value={translation}
            onChange={(e) => onTranslationChange(e.target.value as BibleTranslation)}
            className="px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {TRANSLATIONS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
