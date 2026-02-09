'use client';

interface StatusIndicatorProps {
  isRecording: boolean;
  isConnected?: boolean;
  clientCount?: number;
}

/**
 * Visual indicator for recording and connection status
 */
export function StatusIndicator({
  isRecording,
  isConnected = true,
  clientCount,
}: StatusIndicatorProps) {
  return (
    <div className="flex items-center gap-4">
      {/* Recording Status */}
      <div className="flex items-center gap-2">
        <div
          className={`w-3 h-3 rounded-full ${
            isRecording
              ? 'bg-red-500 animate-pulse'
              : 'bg-gray-400 dark:bg-gray-600'
          }`}
        />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {isRecording ? 'Recording' : 'Stopped'}
        </span>
      </div>

      {/* Connection Status */}
      {isConnected !== undefined && (
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full ${
              isConnected
                ? 'bg-green-500'
                : 'bg-yellow-500 animate-pulse'
            }`}
          />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {isConnected ? 'Connected' : 'Connecting...'}
          </span>
        </div>
      )}

      {/* Client Count */}
      {clientCount !== undefined && clientCount > 0 && (
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <span>{clientCount} viewer{clientCount !== 1 ? 's' : ''}</span>
        </div>
      )}
    </div>
  );
}
