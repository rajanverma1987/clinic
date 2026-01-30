'use client';

import React from 'react';
import { AnimatedNumber } from '@/components/AnimatedNumber';
import {
  CalendarIcon,
  CheckIcon,
  CurrencyIcon,
  DocumentIcon,
  InventoryIcon,
  QueueIcon,
  StarIcon,
  UsersIcon,
  VideoIcon,
} from '@/components/icons';
import { Card } from '@/components/ui/Card';

const iconMap = {
  calendar: CalendarIcon,
  revenue: CurrencyIcon,
  'currency-dollar': CurrencyIcon,
  patients: UsersIcon,
  users: UsersIcon,
  invoice: DocumentIcon,
  'document-text': DocumentIcon,
  inventory: InventoryIcon,
  queue: QueueIcon,
  'check-circle': CheckIcon,
  star: StarIcon,
  video: VideoIcon,
};

function normalizeTrend(trend) {
  if (trend == null) return null;
  if (typeof trend === 'number') {
    const direction = trend >= 0 ? 'up' : 'down';
    const percentage = Math.abs(trend);
    return percentage !== 0 && Number.isFinite(percentage) ? { direction, percentage } : null;
  }
  if (typeof trend === 'object' && trend !== null) {
    const percentage = trend.percentage != null ? Number(trend.percentage) : null;
    if (percentage == null || !Number.isFinite(percentage)) return null;
    const direction = trend.direction === 'down' ? 'down' : 'up';
    return { direction, percentage };
  }
  return null;
}

function StatsCardInner({
  title,
  value,
  trend,
  icon = 'calendar',
  colorScheme = 'primary',
  onClick,
  loading = false,
}) {
  const IconComponent = iconMap[icon] || CalendarIcon;
  const displayTrend = normalizeTrend(trend);

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

        {/* Value with trend (only when we have a valid percentage). Animate numeric values. */}
        <div className='flex items-end justify-between mb-3'>
          <div className='stat-value'>
            {typeof value === 'number' && Number.isFinite(value) && !value.toString().includes('.') ? (
              <AnimatedNumber value={value} format={(n) => (Number.isInteger(n) ? String(n) : n.toFixed(1))} />
            ) : typeof value === 'number' && Number.isFinite(value) ? (
              <AnimatedNumber value={value} format={(n) => n.toFixed(1)} />
            ) : (
              value
            )}
          </div>
          {displayTrend && (
            <div
              className={`trend-indicator ${displayTrend.direction === 'up' ? 'trend-up' : 'trend-down'}`}
              aria-label={`Trend: ${displayTrend.direction} ${displayTrend.percentage}%`}
            >
              <span>{displayTrend.direction === 'up' ? '↑' : '↓'}</span>
              <span>{displayTrend.percentage}%</span>
            </div>
          )}
        </div>

        {/* Icon */}
        <div className='flex justify-end'>
          <div className={`stat-icon stat-icon-${colorScheme}`}>
            <IconComponent className='icon icon-sm text-neutral-50' />
          </div>
        </div>
      </div>
    </div>
  );
}

export const StatsCard = React.memo(StatsCardInner);
