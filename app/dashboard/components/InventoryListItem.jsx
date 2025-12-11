'use client';

import { InventoryIcon, ChevronRightIcon, WarningIcon } from '@/components/icons';

export function InventoryListItem({ item, onClick }) {
  const itemName = item.name || item.itemName || 'Unknown Item';
  const currentStock = item.currentStock || item.stock || 0;
  const minStock = item.minStock || item.minimumStock || 0;
  const unit = item.unit || 'units';

  const isCritical = currentStock === 0;
  const isLow = currentStock > 0 && currentStock <= minStock;

  return (
    <div className="dashboard-list-item dashboard-list-item-error group" onClick={onClick}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          {/* Icon */}
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(239, 68, 68, 0.1)' }}
          >
            {isCritical ? (
              <WarningIcon className="w-5 h-5 text-status-error" />
            ) : (
              <InventoryIcon className="w-5 h-5 text-status-error" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h4 className="text-body-md font-semibold text-neutral-900 mb-1 truncate">
              {itemName}
            </h4>
            <p className="text-body-sm text-neutral-600 mb-2">
              {isCritical ? 'Out of stock' : `Low stock: ${currentStock} ${unit}`}
            </p>
            <div className="text-body-xs text-neutral-500">
              Minimum required: {minStock} {unit}
            </div>
          </div>
        </div>

        {/* Arrow */}
        <ChevronRightIcon className="w-5 h-5 text-neutral-400 group-hover:text-status-error transition-colors flex-shrink-0 ml-2" />
      </div>
    </div>
  );
}
