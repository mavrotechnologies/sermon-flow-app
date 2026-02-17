'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { VmixSettings, VmixOverlayState, VmixCommandPayload } from '@/types';
import {
  presentScripture as vmixPresent,
  hideOverlay as vmixHide,
  vmixTestConnection,
  isMixedContentBlocked,
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

interface UseVmixSettingsOptions {
  roomCode: string;
  broadcastVmix: (roomId: string, payload: VmixCommandPayload) => void;
}

export function useVmixSettings({ roomCode, broadcastVmix }: UseVmixSettingsOptions) {
  const [settings, setSettings] = useState<VmixSettings>(DEFAULT_SETTINGS);
  const [overlayState, setOverlayState] = useState<VmixOverlayState>(INITIAL_OVERLAY);
  const [isTesting, setIsTesting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const overlayRef = useRef(overlayState);
  overlayRef.current = overlayState;

  // Bridge mode: on HTTPS, commands go through SSE broadcast → bridge script → vMix
  // Direct mode: on HTTP, commands go directly to vMix via fetch
  const useBridge = typeof window !== 'undefined' && isMixedContentBlocked();

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
      if (!settings.enabled) return false;

      if (useBridge) {
        // Bridge mode: send via SSE broadcast
        if (overlayRef.current.isShowing) {
          broadcastVmix(roomCode, { action: 'hide' });
          await new Promise((r) => setTimeout(r, 600));
        }
        broadcastVmix(roomCode, { action: 'present', reference, verseText });
        setOverlayState({
          isShowing: true,
          currentReference: reference,
          currentText: verseText,
          showingSince: Date.now(),
        });
        return true;
      }

      // Direct mode: call vMix HTTP API
      if (!settings.host) return false;
      if (overlayRef.current.isShowing) {
        await vmixHide(settings);
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
    [settings, useBridge, roomCode, broadcastVmix]
  );

  const hideOverlay = useCallback(async (): Promise<boolean> => {
    if (!settings.enabled) return false;

    if (useBridge) {
      broadcastVmix(roomCode, { action: 'hide' });
      setOverlayState(INITIAL_OVERLAY);
      return true;
    }

    if (!settings.host) return false;
    const result = await vmixHide(settings);
    if (result.success) {
      setOverlayState(INITIAL_OVERLAY);
    }
    return result.success;
  }, [settings, useBridge, roomCode, broadcastVmix]);

  const testConnection = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (useBridge) {
      // In bridge mode, we can't test from the browser — the bridge handles the connection
      return { success: true, error: undefined };
    }
    if (!settings.host) return { success: false, error: 'No host configured' };
    setIsTesting(true);
    const result = await vmixTestConnection(settings);
    setIsConnected(result.success);
    setIsTesting(false);
    return result;
  }, [settings, useBridge]);

  return {
    settings,
    overlayState,
    updateSettings,
    presentScripture,
    hideOverlay,
    testConnection,
    isConnected,
    isTesting,
    useBridge,
  };
}
