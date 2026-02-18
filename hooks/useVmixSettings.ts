'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { VmixSettings, VmixOverlayState, VmixCommandPayload } from '@/types';

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

// Fixed channel so /display works without a room code
const DISPLAY_CHANNEL = 'display';

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
  const overlayRef = useRef(overlayState);
  overlayRef.current = overlayState;

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
    async (
      reference: string,
      verseText: string,
      version?: string,
      verses?: { number: number; text: string }[]
    ): Promise<boolean> => {
      if (!settings.enabled) return false;

      // If something is already showing, hide first
      if (overlayRef.current.isShowing) {
        const hidePayload: VmixCommandPayload = { action: 'hide' };
        broadcastVmix(roomCode, hidePayload);
        broadcastVmix(DISPLAY_CHANNEL, hidePayload);
        await new Promise((r) => setTimeout(r, 100));
      }

      const payload: VmixCommandPayload = { action: 'present', reference, verseText, version, verses };
      // Broadcast to both the room and the fixed display channel
      broadcastVmix(roomCode, payload);
      broadcastVmix(DISPLAY_CHANNEL, payload);

      setOverlayState({
        isShowing: true,
        currentReference: reference,
        currentText: verseText,
        showingSince: Date.now(),
      });
      return true;
    },
    [settings.enabled, roomCode, broadcastVmix]
  );

  const hideOverlay = useCallback(async (): Promise<boolean> => {
    if (!settings.enabled) return false;
    const payload: VmixCommandPayload = { action: 'hide' };
    broadcastVmix(roomCode, payload);
    broadcastVmix(DISPLAY_CHANNEL, payload);
    setOverlayState(INITIAL_OVERLAY);
    return true;
  }, [settings.enabled, roomCode, broadcastVmix]);

  // Static URL — no room code needed
  const displayUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/display`
    : '/display';

  return {
    settings,
    overlayState,
    updateSettings,
    presentScripture,
    hideOverlay,
    displayUrl,
  };
}
