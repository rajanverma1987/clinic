'use client';

import { Card } from '@/components/ui/Card';
import { useI18n } from '@/contexts/I18nContext';
import { memo, useMemo } from 'react';

const CHART_HEIGHT = 160;

/** Resolve display date from item: supports period, date (reports), or key "YYYY-MM" (admin). */
function getItemDate(item) {
  if (item.period) return new Date(item.period);
  if (item.date) return new Date(item.date);
  if (item.key && /^\d{4}-\d{2}$/.test(String(item.key))) return new Date(String(item.key) + '-01');
  return new Date(0);
}

const COLOR_CLASSES = {
  primary:
    'bg-gradient-to-t from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600',
  secondary:
    'bg-gradient-to-t from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600',
  warning:
    'bg-gradient-to-t from-yellow-600 to-yellow-500 hover:from-yellow-700 hover:to-yellow-600',
};

function ChartCardInner({ title, data, colorScheme = 'primary', loading = false }) {
  const { t } = useI18n();

  if (loading || data === null || data === undefined) {
    return (
      <Card
        className={`chart-card chart-card-${colorScheme} dashboard-card-gradient h-full flex flex-col`}
      >
        <div className='relative z-10 p-4 flex-1 flex flex-col min-h-0'>
          <div className='flex items-center gap-2 mb-4'>
            <div className='skeleton w-1 h-4 rounded-full shrink-0' />
            <div className='skeleton skeleton-text w-40' />
          </div>
          <div className='skeleton skeleton-chart flex-1' />
        </div>
      </Card>
    );
  }

  const chartData = useMemo(() => (Array.isArray(data) ? data.slice(-14) : []), [data]);
  const hasData = chartData.length > 0;
  const maxBarValue = useMemo(
    () => Math.max(...chartData.map((d) => d.value || d.total || d.count || 0), 1),
    [chartData],
  );
  const colorClasses = COLOR_CLASSES;
  return (
    <Card
      elevated={true}
      className={`chart-card chart-card-${colorScheme} dashboard-card-gradient`}
    >
      {/* Decorative orb */}
      <div
        className={`radial-orb radial-orb-${colorScheme}`}
        style={{
          width: '400px',
          height: '400px',
          top: '-160px',
          right: '-160px',
        }}
      />

      {/* Content */}
      <div className='relative z-10 p-4 h-full flex flex-col'>
        {/* Header */}
        <div
          className='section-header'
          style={{ alignItems: 'center', gap: '12px', marginBottom: '16px' }}
        >
          <div
            className={`accent-bar accent-bar-${colorScheme}`}
            style={{ flexShrink: 0, height: '20px', width: '4px' }}
          />
          <h2
            className='section-title'
            style={{ margin: 0, fontSize: '16px', fontWeight: '600', lineHeight: '20px' }}
          >
            {title}
          </h2>
        </div>

        {/* Chart */}
        <div className='relative flex-1 min-h-0'>
          {!hasData ? (
            <div className='flex items-center justify-center h-[160px] rounded-lg border border-neutral-200 dark:border-neutral-600 bg-neutral-50/50 dark:bg-neutral-800/50 text-body-sm text-neutral-500 dark:text-neutral-400'>
              {t('dashboard.noDataForPeriod')}
            </div>
          ) : (
            <div className='flex items-end h-full min-h-[160px] border-b border-l border-neutral-300 dark:border-neutral-600 pl-8 pr-3 pb-6'>
              {/* Y-axis labels */}
              <div className='absolute left-0 top-0 bottom-6 flex flex-col justify-between text-body-xs text-neutral-500 dark:text-neutral-400 font-medium'>
                {[100, 75, 50, 25, 0].map((percent) => (
                  <span key={percent} className='pr-2' style={{ marginRight: '100%' }}>
                    {Math.round((maxBarValue * percent) / 100)}
                  </span>
                ))}
              </div>

              {/* Bars */}
              <div className='flex-1 flex items-end justify-between gap-1.5'>
                {chartData.map((item, index) => {
                  const value = item.value || item.total || item.count || 0;
                  const percentage = (value / maxBarValue) * 100;
                  const barHeight = (percentage / 100) * CHART_HEIGHT;

                  return (
                    <div key={index} className='flex-1 flex flex-col items-center group relative'>
                      <div
                        className={`w-full ${
                          colorClasses[colorScheme] || colorClasses.primary
                        } rounded-t cursor-pointer transition-all duration-200 hover:opacity-90`}
                        style={{
                          height: `${Math.max(barHeight, value > 0 ? 3 : 0)}px`,
                          minHeight: value > 0 ? '3px' : '0',
                          boxShadow: value > 0 ? '0 2px 4px rgba(0, 0, 0, 0.1)' : 'none',
                        }}
                        title={`${getItemDate(item).toLocaleDateString()}: ${value}`}
                      />
                      <div
                        className='absolute -top-8 left-1/2 opacity-0 group-hover:opacity-100 bg-neutral-800 dark:bg-neutral-700 text-white text-xs px-2 py-1 rounded-md whitespace-nowrap z-10 shadow-lg transition-opacity duration-200 pointer-events-none'
                        style={{ marginLeft: '-50%', transform: 'translateX(-50%)' }}
                      >
                        {value}
                      </div>
                      <span className='text-body-xs text-neutral-500 dark:text-neutral-400 mt-2 text-center leading-tight font-medium'>
                        {(() => {
                          const date = getItemDate(item);
                          if (item.label && chartData.length > 7) return item.label;
                          if (chartData.length <= 7) {
                            return date.toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                            });
                          }
                          return date.toLocaleDateString(undefined, { month: 'short' });
                        })()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

export const ChartCard = memo(ChartCardInner, (prev, next) => {
  return (
    prev.data === next.data &&
    prev.title === next.title &&
    prev.colorScheme === next.colorScheme &&
    prev.loading === next.loading
  );
});
