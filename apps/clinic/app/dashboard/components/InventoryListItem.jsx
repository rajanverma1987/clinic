'use client';

import { ChevronRightIcon, InventoryIcon, WarningIcon } from '@/components/icons';

export function InventoryListItem({ item, onClick }) {
  const itemName = item.name || item.itemName || 'Unknown Item';
  const unit = item.unit || 'units';
  // Prefer API shape: availableQuantity / lowStockThreshold; fallback for report shape
  const currentStock = item.availableQuantity ?? item.currentStock ?? item.stock ?? 0;
  const minStock = item.lowStockThreshold ?? item.minStock ?? item.minimumStock ?? 0;

  const isCritical = currentStock === 0;
  const isLow = currentStock > 0 && currentStock <= minStock;

  return (
    <button
      type='button'
      className='dashboard-list-item dashboard-list-item-error group w-full text-left cursor-pointer border-0 bg-transparent p-0'
      onClick={onClick}
      aria-label={`${itemName}, ${isCritical ? 'Out of stock' : `Low stock: ${currentStock} ${unit}`}`}
    >
      <div className='flex items-start justify-between gap-3'>
        <div className='flex items-start gap-3 flex-1 min-w-0'>
          {/* Icon */}
          <div
            className='w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0'
            style={{
              background:
                'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
            }}
          >
            {isCritical ? (
              <WarningIcon className='icon icon-xs text-status-error' />
            ) : (
              <InventoryIcon className='icon icon-xs text-status-error' />
            )}
          </div>

          {/* Content */}
          <div className='flex-1 min-w-0'>
            <h4 className='text-body-sm font-semibold text-neutral-900 mb-1 truncate'>
              {itemName}
            </h4>
            <p className='text-body-xs text-neutral-600 mb-1.5'>
              {isCritical ? 'Out of stock' : `Low stock: ${currentStock} ${unit}`}
            </p>
            <div className='text-body-xs text-neutral-500'>
              Minimum required: {minStock} {unit}
            </div>
          </div>
        </div>

        {/* Arrow */}
        <ChevronRightIcon className='icon icon-sm text-neutral-400 group-hover:text-status-error transition-colors flex-shrink-0' />
      </div>
    </button>
  );
}
