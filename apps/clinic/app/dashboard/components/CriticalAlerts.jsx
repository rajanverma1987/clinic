'use client';

import { WarningIcon } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useI18n } from '@/contexts/I18nContext';

function AlertItem({ alert, onViewAll, t }) {
  const { type, severity, message, count } = alert;

  return (
    <div className={`alert-card alert-card-${severity} group`}>
      <div className='flex items-center justify-between gap-3'>
        <div className='flex items-center gap-3 flex-1 min-w-0'>
          <div className={`alert-badge alert-badge-${severity} flex-shrink-0`}>
            <WarningIcon
              className={`icon icon-sm ${
                severity === 'error'
                  ? 'text-status-error'
                  : severity === 'warning'
                    ? 'text-status-warning'
                    : 'text-primary-500'
              }`}
            />
          </div>
          <p className='text-body-sm font-medium text-neutral-900 flex-1 truncate'>{message}</p>
        </div>
        <Button
          variant={severity === 'error' ? 'danger' : severity === 'warning' ? 'warning' : 'primary'}
          size='sm'
          className='flex-shrink-0'
          onClick={() => onViewAll?.(alert)}
        >
          {count > 1 ? t('common.viewAll') : t('dashboard.viewAlert')}
        </Button>
      </div>
    </div>
  );
}

export function CriticalAlerts({ alerts = [], onViewAll }) {
  const { t } = useI18n();
  if (!alerts || alerts.length === 0) {
    return null;
  }

  return (
    <Card
      elevated={true}
      className='overflow-hidden relative chart-card chart-card-warning dashboard-card-gradient'
    >
      {/* Decorative orb */}
      <div
        className='radial-orb radial-orb-warning'
        style={{
          width: '400px',
          height: '400px',
          top: '-120px',
          right: '-120px',
        }}
      />

      {/* Content */}
      <div className='relative z-10 p-4'>
        {/* Header */}
        <div className='flex items-center gap-2.5 mb-4 pb-3 border-b border-neutral-200'>
          <div className='accent-bar accent-bar-warning' />
          <div className='alert-badge alert-badge-warning'>
            <WarningIcon className='icon icon-xs text-status-warning' />
          </div>
          <h2 className='section-title'>{t('dashboard.criticalAlerts')}</h2>
        </div>

        {/* Alerts List */}
        <div className='space-y-2'>
          {alerts.map((alert, index) => (
            <AlertItem key={index} alert={alert} onViewAll={onViewAll} t={t} />
          ))}
        </div>
      </div>
    </Card>
  );
}
