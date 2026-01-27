'use client';

import { WarningIcon } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

function AlertItem({ alert, onViewAll }) {
  const { type, severity, message, count } = alert;

  return (
    <div className={`alert-card alert-card-${severity} group`}>
      <div className='flex items-center justify-between gap-3'>
        <div className='flex items-center gap-3 flex-1 min-w-0'>
          <div className={`alert-badge alert-badge-${severity} flex-shrink-0`}>
            <WarningIcon
              className='icon icon-sm'
              color={
                severity === 'error' ? '#EF4444' : severity === 'warning' ? '#F59E0B' : '#2D9CDB'
              }
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
          View {count > 1 ? 'All' : ''}
        </Button>
      </div>
    </div>
  );
}

export function CriticalAlerts({ alerts = [], onViewAll }) {
  if (!alerts || alerts.length === 0) {
    return null;
  }

  return (
    <Card
      elevated={true}
      className='overflow-hidden relative'
      style={{
        background:
          'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(250,252,255,0.95) 100%)',
        border: '1px solid rgba(245,158,11,0.2)',
      }}
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
            <WarningIcon className='icon icon-xs' color='#F59E0B' />
          </div>
          <h2 className='section-title'>Critical Alerts</h2>
        </div>

        {/* Alerts List */}
        <div className='space-y-2'>
          {alerts.map((alert, index) => (
            <AlertItem key={index} alert={alert} onViewAll={onViewAll} />
          ))}
        </div>
      </div>
    </Card>
  );
}
