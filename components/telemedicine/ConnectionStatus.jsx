'use client';

import { getConnectionQualityLabel } from '@/lib/utils/user-messages';

export function ConnectionStatus({ connectionQuality, reconnectAttempts }) {
  if (connectionQuality === 'UNKNOWN') return null;

  return (
    <div className='flex items-center space-x-1'>
      <div
        className={`w-2 h-2 rounded-full ${
          connectionQuality === 'EXCELLENT'
            ? 'bg-green-500'
            : connectionQuality === 'GOOD'
            ? 'bg-blue-500'
            : connectionQuality === 'FAIR'
            ? 'bg-yellow-500'
            : 'bg-red-500'
        }`}
        title={`Connection quality: ${getConnectionQualityLabel(connectionQuality)}`}
      />
      {reconnectAttempts > 0 && (
        <span
          className='text-yellow-400 text-xs'
          title={`Reconnecting... (try ${reconnectAttempts} of 10)`}
        >
          🔄
        </span>
      )}
    </div>
  );
}
