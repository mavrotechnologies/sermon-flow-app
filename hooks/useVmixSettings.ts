'use client';

import { useState, useCallback, useEffect } from 'react';
import type { VmixSettings, VmixOverlayState } from '@/types';
import {
  presentScripture as vmixPresent,
  hideOverlay as vmixHide,
  vmixTestConnection,
} from '@/lib/vmix';

const STORAGE_KEY = 'vmix-settings';

const DEFAULT_SETTINGS: VmixSettings = {
  enabled: false,
  host: '',
  port: 8088,
  titleInput: '1',
  referenceField: 'Headline.Text',
  verseTextField: 'Description.Text',
};

const INITIAL_OVERLAY: VmixOverlayState = {
  isShowing: false,
  currentReference: null,
  currentText: null,
  showingSince: null,
};

function loadSettings(): VmixSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
  } catch {}
  return DEFAULT_SETTINGS;
}

function saveSettings(settings: VmixSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {}
}

export function useVmixSettings() {
  const [settings, setSettings] = useState<VmixSettings>(DEFAULT_SETTINGS);
  const [overlayState, setOverlayState] = useState<VmixOverlayState>(INITIAL_OVERLAY);
  const [isTesting, setIsTesting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  const updateSettings = useCallback((partial: Partial<VmixSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      saveSettings(next);
      return next;
    });
  }, []);

  const presentScripture = useCallback(
    async (reference: string, verseText: string): Promise<boolean> => {
      if (!settings.enabled || !settings.host) return false;

      // If something is already showing, fade it out first and wait for the transition
      if (overlayState.isShowing) {
        await vmixHide(settings);
        // Wait for the fade-out (500ms) before swapping text
        await new Promise((r) => setTimeout(r, 550));
      }

      const result = await vmixPresent(settings, reference, verseText);
      if (result.success) {
        setOverlayState({
          isShowing: true,
          currentReference: reference,
          currentText: verseText,
          showingSince: Date.now(),
        });
      }
      return result.success;
    },
    [settings, overlayState.isShowing]
  );

  const hideOverlay = useCallback(async (): Promise<boolean> => {
    if (!settings.enabled || !settings.host) return false;
    const result = await vmixHide(settings);
    if (result.success) {
      setOverlayState(INITIAL_OVERLAY);
    }
    return result.success;
  }, [settings]);

  const testConnection = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (!settings.host) return { success: false, error: 'No host configured' };
    setIsTesting(true);
    const result = await vmixTestConnection(settings);
    setIsConnected(result.success);
    setIsTesting(false);
    return result;
  }, [settings]);

  return {
    settings,
    overlayState,
    updateSettings,
    presentScripture,
    hideOverlay,
    testConnection,
    isConnected,
    isTesting,
  };
}
