'use client';

import { useI18n } from '@/contexts/I18nContext';
import { getConnectionQualityLabel } from '@/lib/utils/user-messages';

export function ConnectionStatus({ connectionQuality, reconnectAttempts }) {
  const { t } = useI18n();
  if (connectionQuality === 'UNKNOWN') return null;

  const qualityColor =
    connectionQuality === 'EXCELLENT'
      ? 'bg-status-success'
      : connectionQuality === 'GOOD'
        ? 'bg-primary-500'
        : connectionQuality === 'FAIR'
          ? 'bg-status-warning'
          : 'bg-status-error';

  return (
    <div className='flex items-center gap-1.5' title={getConnectionQualityLabel(connectionQuality)}>
      <span className={`w-2.5 h-2.5 rounded-full ${qualityColor}`} aria-hidden />
      {reconnectAttempts > 0 && (
        <span
          className='text-status-warning text-xs'
          title={t('telemedicine.reconnectingTry').replace(
            '{{attempts}}',
            String(reconnectAttempts),
          )}
        >
          🔄
        </span>
      )}
    </div>
  );
}
