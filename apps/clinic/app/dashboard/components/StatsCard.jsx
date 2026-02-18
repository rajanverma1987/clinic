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

const colorSchemeToVar = {
  primary: 'var(--color-primary-500)',
  secondary: 'var(--color-primary-500)',
  success: 'var(--color-secondary-500)',
  warning: 'var(--color-status-warning)',
  error: 'var(--color-status-error)',
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
  subtitle,
  trend,
  icon = 'calendar',
  colorScheme = 'primary',
  layout = 'default',
  onClick,
  loading = false,
}) {
  const IconComponent = iconMap[icon] || CalendarIcon;
  const displayTrend = normalizeTrend(trend);
  const layoutClass = layout && layout !== 'default' ? `stat-card-layout-${layout}` : '';

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

  const valueBlock = (
    <div className='value-trend-row flex items-end justify-between gap-2 flex-wrap'>
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
  );

  const iconColor = colorSchemeToVar[colorScheme] || colorSchemeToVar.primary;
  const iconBlock = (
    <div className='stat-icon-wrap' aria-hidden>
      <div
        className={`stat-icon stat-icon-${colorScheme}`}
        style={{ color: iconColor }}
      >
        <IconComponent className='icon icon-sm' />
      </div>
    </div>
  );

  const labelBlock = (
    <div className='flex items-center gap-2 mb-3'>
      <div className={`accent-bar accent-bar-${colorScheme}`} />
      <p className='stat-label'>{title}</p>
    </div>
  );

  const labelBlockMinimal = (
    <div className='flex items-center gap-2 mb-1'>
      <div className={`accent-bar accent-bar-${colorScheme}`} />
      <p className='stat-label'>{title}</p>
    </div>
  );

  if (layout === 'compact') {
    return (
      <div
        className={`stat-card stat-card-${colorScheme} dashboard-card-gradient cursor-pointer ${layoutClass}`}
        onClick={onClick}
      >
        <div className='stat-card-inner relative z-10 p-4 h-full flex flex-row items-center gap-3'>
          {iconBlock}
          <div className='flex-1 min-w-0'>
            {labelBlock}
            {valueBlock}
            {subtitle && <p className='stat-subtitle'>{subtitle}</p>}
          </div>
        </div>
      </div>
    );
  }

  if (layout === 'stacked') {
    return (
      <div
        className={`stat-card stat-card-${colorScheme} dashboard-card-gradient cursor-pointer ${layoutClass}`}
        onClick={onClick}
      >
        <div className='stat-card-inner relative z-10 p-4 h-full'>
          {iconBlock}
          {valueBlock}
          {labelBlock}
        </div>
      </div>
    );
  }

  if (layout === 'minimal') {
    return (
      <div
        className={`stat-card stat-card-${colorScheme} dashboard-card-gradient cursor-pointer ${layoutClass}`}
        onClick={onClick}
      >
        <div className='stat-card-inner relative z-10 p-4 h-full'>
          <div className='value-trend-row flex-1 min-w-0'>
            {labelBlockMinimal}
            {valueBlock}
          </div>
          {iconBlock}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`stat-card stat-card-${colorScheme} dashboard-card-gradient cursor-pointer ${layoutClass}`}
      onClick={onClick}
    >
      <div className='stat-card-inner relative z-10 p-4 h-full flex flex-col justify-between'>
        {labelBlock}
        {valueBlock}
        <div className='flex justify-end mt-3'>
          {iconBlock}
        </div>
      </div>
    </div>
  );
}

export const StatsCard = React.memo(StatsCardInner);
