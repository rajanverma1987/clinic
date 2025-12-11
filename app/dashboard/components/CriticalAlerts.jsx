'use client';

import { Card } from '@/components/ui/Card';
import { WarningIcon } from '@/components/icons';

function AlertItem({ alert }) {
  const { type, severity, message, count } = alert;

  return (
    <div className={`alert-card alert-card-${severity} group`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          {/* Badge */}
          <div className={`alert-badge alert-badge-${severity}`}>
            <WarningIcon
              className="w-5 h-5"
              color={
                severity === 'error'
                  ? '#EF4444'
                  : severity === 'warning'
                  ? '#F59E0B'
                  : '#2D9CDB'
              }
            />
          </div>

          {/* Message */}
          <p className="text-body-sm font-medium text-neutral-900 flex-1">{message}</p>
        </div>

        {/* Action Button */}
        <button className={`alert-action-btn alert-action-btn-${severity}`}>
          View {count > 1 ? 'All' : ''}
        </button>
      </div>
    </div>
  );
}

export function CriticalAlerts({ alerts = [] }) {
  if (!alerts || alerts.length === 0) {
    return null;
  }

  return (
    <Card
      elevated={true}
      className="overflow-hidden relative"
      style={{
        background:
          'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(250,252,255,0.95) 100%)',
        border: '1px solid rgba(245,158,11,0.2)',
      }}
    >
      {/* Decorative orb */}
      <div
        className="radial-orb radial-orb-warning"
        style={{
          width: '400px',
          height: '400px',
          top: 0,
          right: 0,
          transform: 'translate(30%, -30%)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="accent-bar accent-bar-warning" />
          <div className="alert-badge alert-badge-warning">
            <WarningIcon className="w-5 h-5" color="#F59E0B" />
          </div>
          <h2 className="section-title">Critical Alerts</h2>
        </div>

        {/* Alerts List */}
        <div className="space-y-3">
          {alerts.map((alert, index) => (
            <AlertItem key={index} alert={alert} />
          ))}
        </div>
      </div>
    </Card>
  );
}
