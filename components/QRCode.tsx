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
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (url) {
      setLiveUrl(url);
    } else if (typeof window !== 'undefined') {
      const baseUrl = window.location.origin;
      setLiveUrl(`${baseUrl}/live`);
    }
  }, [url]);

  const copyUrl = () => {
    navigator.clipboard.writeText(liveUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="relative p-[1px] rounded-2xl bg-gradient-to-b from-purple-500/30 via-purple-500/10 to-transparent max-w-sm mx-4 animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-[#0c0c10] rounded-2xl p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Share Live View</h3>
                <p className="text-xs text-gray-500">Let congregation follow along</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* QR Code */}
          <div className="flex justify-center mb-6">
            {liveUrl && (
              <div className="relative p-[1px] rounded-2xl bg-gradient-to-b from-white/20 to-white/5">
                <div className="bg-white p-4 rounded-2xl">
                  <QRCodeSVG
                    value={liveUrl}
                    size={180}
                    level="M"
                    includeMargin={false}
                    bgColor="#ffffff"
                    fgColor="#0c0c10"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Instructions */}
          <p className="text-center text-sm text-gray-400 mb-4">
            Scan with phone camera to join live scripture view
          </p>

          {/* URL Box */}
          <div className="relative p-[1px] rounded-xl bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-blue-500/20">
            <div className="bg-[#0a0a0d] rounded-xl p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-500 mb-1">Live URL</p>
                  <p className="text-sm text-blue-400 font-mono truncate">
                    {liveUrl}
                  </p>
                </div>
                <button
                  onClick={copyUrl}
                  className={`shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    copied
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {copied ? (
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Copied
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
