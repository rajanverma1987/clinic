'use client';

import { Card } from '@/components/ui/Card';

export function DashboardListCard({
  title,
  data = [],
  loading = false,
  colorScheme = 'primary',
  renderItem,
  emptyMessage = 'No items to display',
  EmptyIcon,
}) {
  if (loading) {
    return (
      <Card className={`dashboard-list-card dashboard-list-card-${colorScheme}`}>
        <div className="p-6 relative z-10">
          <div className="skeleton skeleton-text w-40 mb-6" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton" style={{ height: '80px' }} />
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card
      elevated={true}
      className={`dashboard-list-card dashboard-list-card-${colorScheme} dashboard-card-gradient`}
    >
      {/* Decorative orb */}
      <div
        className={`radial-orb radial-orb-${colorScheme}`}
        style={{
          width: '300px',
          height: '300px',
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

        {/* List */}
        {data && data.length > 0 ? (
          <div className="space-y-3">{data.map((item, index) => renderItem(item, index))}</div>
        ) : (
          <div className="empty-state">
            {EmptyIcon && <div className="empty-state-icon">{EmptyIcon}</div>}
            <p className="text-neutral-500 text-body-sm">{emptyMessage}</p>
          </div>
        )}
      </div>
    </Card>
  );
}
