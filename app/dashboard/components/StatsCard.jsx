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
        <div className='relative z-10 p-4 h-full flex flex-col justify-between'>
          <div className='skeleton skeleton-text w-24 mb-3' />
          <div className='skeleton skeleton-text-lg w-32 mb-3' />
          <div className='flex justify-end'>
            <div className='skeleton skeleton-stat-icon' />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div
      className={`stat-card stat-card-${colorScheme} dashboard-card-gradient cursor-pointer`}
      onClick={onClick}
    >
      {/* Content */}
      <div className='relative z-10 p-4 h-full flex flex-col justify-between'>
        {/* Header with accent bar and label */}
        <div className='flex items-center gap-2 mb-3'>
          <div className={`accent-bar accent-bar-${colorScheme}`} />
          <p className={`stat-label`}>{title}</p>
        </div>

        {/* Value with trend */}
        <div className='flex items-end justify-between mb-3'>
          <div className='stat-value'>{value}</div>
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
            <IconComponent className='icon icon-sm' color='white' />
          </div>
        </div>
      </div>
    </div>
  );
}
