'use client';

import { Card } from '@/components/ui/Card';

export function ChartCard({ title, data, colorScheme = 'primary', loading = false }) {
  if (loading || !data || data.length === 0) {
    return (
      <Card className={`chart-card chart-card-${colorScheme} dashboard-card-gradient`}>
        <div className="p-6 relative z-10">
          <div className="skeleton skeleton-text w-40 mb-6" />
          <div className="skeleton" style={{ height: '220px' }} />
        </div>
      </Card>
    );
  }

  const chartData = data.slice(-14);
  const maxBarValue = Math.max(...chartData.map((d) => d.value || d.total || d.count || 0), 1);
  const chartHeight = 200;

  const colorClasses = {
    primary: 'bg-primary-500 hover:bg-primary-600',
    secondary: 'bg-secondary-500 hover:bg-secondary-600',
    warning: 'bg-status-warning hover:bg-status-warning/80',
  };

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
          top: 0,
          right: 0,
          transform: 'translate(40%, -40%)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 p-6">
        {/* Header */}
        <div className="section-header">
          <div className={`accent-bar accent-bar-${colorScheme}`} />
          <h2 className="section-title">{title}</h2>
        </div>

        {/* Chart */}
        <div className="relative">
          <div className="flex items-end h-[220px] border-b border-l border-neutral-200 pl-8 pr-4 pb-8">
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between text-xs text-neutral-500">
              {[100, 75, 50, 25, 0].map((percent) => (
                <span key={percent} className="transform -translate-x-full pr-2">
                  {Math.round((maxBarValue * percent) / 100)}
                </span>
              ))}
            </div>

            {/* Bars */}
            <div className="flex-1 flex items-end justify-between gap-1.5">
              {chartData.map((item, index) => {
                const value = item.value || item.total || item.count || 0;
                const percentage = (value / maxBarValue) * 100;
                const barHeight = (percentage / 100) * chartHeight;

                return (
                  <div key={index} className="flex-1 flex flex-col items-center group relative">
                    <div
                      className={`w-full ${
                        colorClasses[colorScheme] || colorClasses.primary
                      } rounded-t cursor-pointer`}
                      style={{
                        height: `${Math.max(barHeight, value > 0 ? 2 : 0)}px`,
                        minHeight: value > 0 ? '2px' : '0',
                      }}
                      title={`${new Date(item.period || item.date).toLocaleDateString()}: ${value}`}
                    />
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-neutral-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                      {value}
                    </div>
                    <span className="text-xs text-neutral-600 mt-2 text-center leading-tight">
                      {(() => {
                        const date = new Date(item.period || item.date);
                        if (chartData.length <= 7) {
                          return date.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          });
                        } else {
                          return date.toLocaleDateString('en-US', { month: 'short' });
                        }
                      })()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
