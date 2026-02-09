'use client';

import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface QRCodeDisplayProps {
  url?: string;
  size?: number;
  className?: string;
}

/**
 * QR code display for audience to join the live view
 */
export function QRCodeDisplay({
  url,
  size = 150,
  className = '',
}: QRCodeDisplayProps) {
  const [liveUrl, setLiveUrl] = useState<string>('');

  useEffect(() => {
    // Generate URL if not provided
    if (url) {
      setLiveUrl(url);
    } else if (typeof window !== 'undefined') {
      const baseUrl = window.location.origin;
      setLiveUrl(`${baseUrl}/live`);
    }
  }, [url]);

  if (!liveUrl) {
    return null;
  }

  return (
    <div className={`bg-white p-4 rounded-lg shadow-lg inline-block ${className}`}>
      <QRCodeSVG
        value={liveUrl}
        size={size}
        level="M"
        includeMargin={false}
        bgColor="#ffffff"
        fgColor="#000000"
      />
      <p className="mt-2 text-center text-xs text-gray-600 max-w-[150px]">
        Scan to view on your device
      </p>
    </div>
  );
}

/**
 * QR code modal/popup
 */
interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  url?: string;
}

export function QRCodeModal({ isOpen, onClose, url }: QRCodeModalProps) {
  const [liveUrl, setLiveUrl] = useState<string>('');

  useEffect(() => {
    if (url) {
      setLiveUrl(url);
    } else if (typeof window !== 'undefined') {
      const baseUrl = window.location.origin;
      setLiveUrl(`${baseUrl}/live`);
    }
  }, [url]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-sm mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Join Live View
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex justify-center mb-4">
          {liveUrl && (
            <div className="bg-white p-4 rounded-lg">
              <QRCodeSVG
                value={liveUrl}
                size={200}
                level="M"
                includeMargin={false}
              />
            </div>
          )}
        </div>

        <p className="text-center text-sm text-gray-600 dark:text-gray-400 mb-4">
          Scan this QR code with your phone to follow along
        </p>

        <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
            Or visit this URL:
          </p>
          <p className="text-sm text-blue-600 dark:text-blue-400 font-mono break-all">
            {liveUrl}
          </p>
        </div>
      </div>
    </div>
  );
}
