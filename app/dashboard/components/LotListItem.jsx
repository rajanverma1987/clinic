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
      className={`dashboard-list-item dashboard-list-item-${getStatusColor()}`}
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    >
      <div className='flex items-center justify-between'>
        <div className='flex-1 min-w-0'>
          <div className='flex items-center gap-2 mb-1'>
            <span className='font-semibold text-neutral-900 truncate'>{lot.itemName}</span>
            <span className='text-xs text-neutral-500 font-mono'>{lot.batchNumber}</span>
          </div>
          <div className='flex items-center gap-3 text-xs text-neutral-600'>
            <span>{lot.quantity} {lot.unit}</span>
            <span>•</span>
            <span>{formatDate(lot.expiryDate)}</span>
          </div>
        </div>
        <div className='ml-3'>
          <span
            className={`px-2 py-1 rounded text-xs font-semibold ${
              lot.isExpired
                ? 'bg-red-100 text-red-700'
                : lot.isExpiringSoon
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-green-100 text-green-700'
            }`}
          >
            {getStatusText()}
          </span>
        </div>
      </div>
    </div>
  );
}

