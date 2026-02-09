'use client';

import { useState, useEffect, useCallback } from 'react';
import type { AudioDevice } from '@/types';

interface UseAudioDevicesResult {
  devices: AudioDevice[];
  selectedDevice: string | null;
  selectDevice: (deviceId: string) => void;
  refreshDevices: () => Promise<void>;
  hasPermission: boolean;
  requestPermission: () => Promise<boolean>;
  error: string | null;
}

/**
 * Hook for managing audio input devices
 * Handles device enumeration, selection, and permission requests
 */
export function useAudioDevices(): UseAudioDevicesResult {
  const [devices, setDevices] = useState<AudioDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Request microphone permission
   */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop all tracks immediately after getting permission
      stream.getTracks().forEach((track) => track.stop());
      setHasPermission(true);
      setError(null);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get microphone permission';
      setError(message);
      setHasPermission(false);
      return false;
    }
  }, []);

  /**
   * Enumerate available audio input devices
   */
  const refreshDevices = useCallback(async (): Promise<void> => {
    try {
      // Check if we have permission first
      if (!hasPermission) {
        const granted = await requestPermission();
        if (!granted) return;
      }

      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = allDevices
        .filter((device) => device.kind === 'audioinput')
        .map((device) => ({
          deviceId: device.deviceId,
          label: device.label || `Microphone ${device.deviceId.slice(0, 8)}`,
          kind: device.kind,
        }));

      setDevices(audioInputs);

      // Auto-select first device if none selected
      if (!selectedDevice && audioInputs.length > 0) {
        setSelectedDevice(audioInputs[0].deviceId);
      }

      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to enumerate devices';
      setError(message);
    }
  }, [hasPermission, selectedDevice, requestPermission]);

  /**
   * Select a specific audio device
   */
  const selectDevice = useCallback((deviceId: string): void => {
    setSelectedDevice(deviceId);
  }, []);

  // Listen for device changes
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices) return;

    const handleDeviceChange = () => {
      refreshDevices();
    };

    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);

    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
    };
  }, [refreshDevices]);

  // Initial device enumeration
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
      // Check for existing permission
      navigator.permissions?.query({ name: 'microphone' as PermissionName }).then((result) => {
        if (result.state === 'granted') {
          setHasPermission(true);
          refreshDevices();
        }
      }).catch(() => {
        // Permission API not supported, will request on first use
      });
    }
  }, [refreshDevices]);

  return {
    devices,
    selectedDevice,
    selectDevice,
    refreshDevices,
    hasPermission,
    requestPermission,
    error,
  };
}
