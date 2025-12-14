'use client';

import {
  CalendarIcon,
  CurrencyIcon,
  DocumentIcon,
  InventoryIcon,
  QueueIcon,
  UsersIcon,
} from '@/components/icons';
import { Card } from '@/components/ui/Card';

const iconMap = {
  calendar: CalendarIcon,
  revenue: CurrencyIcon,
  patients: UsersIcon,
  invoice: DocumentIcon,
  inventory: InventoryIcon,
  queue: QueueIcon,
};

export function StatsCard({
  title,
  value,
  trend,
  icon = 'calendar',
  colorScheme = 'primary',
  onClick,
  loading = false,
}) {
  const IconComponent = iconMap[icon] || CalendarIcon;

  if (loading) {
    return (
      <Card className='stat-card'>
        <div className='relative z-10' style={{ padding: '24px 24px 24px 10px' }}>
          <div className='skeleton skeleton-text w-24 mb-4' />
          <div className='skeleton skeleton-text-lg w-32 mb-4' />
          <div className='skeleton w-12 h-12 rounded-xl' />
        </div>
      </Card>
    );
  }

  return (
    <div
      className={`stat-card stat-card-${colorScheme} dashboard-card-gradient cursor-pointer`}
      onClick={onClick}
    >
      {/* Decorative orb */}
      <div
        className={`radial-orb radial-orb-${colorScheme}`}
        style={{
          width: '400px',
          height: '400px',
          top: '-120px',
          right: '-120px',
        }}
      />

      {/* Content */}
      <div className='relative z-10' style={{ padding: '24px 24px 24px 10px' }}>
        {/* Accent bar and Label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div className={`accent-bar accent-bar-${colorScheme}`} style={{ flexShrink: 0, height: '20px', width: '4px' }} />
          <p className={`stat-label text-neutral-500`} style={{ margin: 0, fontSize: '11px', fontWeight: '600', lineHeight: '20px' }}>{title}</p>
        </div>
        {/* Value with trend */}
        <div className='flex items-end justify-between mb-4'>
          <div className='stat-value text-neutral-900'>{value}</div>
          {trend && (
            <div
              className={`trend-indicator ${trend.direction === 'up' ? 'trend-up' : 'trend-down'}`}
            >
              <span>{trend.direction === 'up' ? '↑' : '↓'}</span>
              <span>{trend.percentage}%</span>
            </div>
          )}
        </div>

        {/* Icon */}
        <div className='flex justify-end'>
          <div className={`stat-icon stat-icon-${colorScheme}`}>
            <IconComponent className='w-6 h-6' color='white' />
          </div>
        </div>
      </div>
    </div>
  );
}
