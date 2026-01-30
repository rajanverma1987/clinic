'use client';

export function LotListItem({ lot, onClick }) {
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusColor = () => {
    if (lot.isExpired) return 'error';
    if (lot.isExpiringSoon) return 'warning';
    return 'primary';
  };

  const getStatusText = () => {
    if (lot.isExpired) return 'Expired';
    if (lot.isExpiringSoon) return `Expires in ${lot.daysUntilExpiry} days`;
    return 'Active';
  };

  return (
    <div
      className={`dashboard-list-item dashboard-list-item-${getStatusColor()} group`}
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    >
      <div className='flex items-center justify-between gap-3'>
        <div className='flex-1 min-w-0'>
          <div className='flex items-center gap-2 mb-1.5'>
            <span className='text-body-md font-semibold text-neutral-900 truncate'>{lot.itemName}</span>
            <span className='text-body-xs text-neutral-500 font-mono px-2 py-0.5 bg-neutral-100 rounded'>{lot.batchNumber}</span>
          </div>
          <div className='flex items-center gap-3 text-body-xs text-neutral-600'>
            <span>{lot.quantity} {lot.unit}</span>
            <span>•</span>
            <span>{formatDate(lot.expiryDate)}</span>
          </div>
        </div>
        <div className='flex-shrink-0'>
          <span
            className={`px-3 py-1.5 rounded-lg text-body-xs font-semibold ${
              lot.isExpired
                ? 'bg-red-50 text-red-700 border border-red-200'
                : lot.isExpiringSoon
                ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                : 'bg-green-50 text-green-700 border border-green-200'
            }`}
          >
            {getStatusText()}
          </span>
        </div>
      </div>
    </div>
  );
}

