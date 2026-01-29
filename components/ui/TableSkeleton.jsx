'use client';

/**
 * TableSkeleton – loading placeholder for data tables (Phase 7.2).
 * Renders N placeholder rows with shimmer for consistent loading UX.
 */
export function TableSkeleton({ rows = 5, cols = 5, className = '' }) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className='w-full'>
        <thead>
          <tr className='border-b border-neutral-200'>
            {Array.from({ length: cols }, (_, i) => (
              <th key={i} className='text-left py-3 px-4'>
                <div className='h-4 bg-neutral-200 rounded animate-pulse w-20' />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }, (_, rowIndex) => (
            <tr key={rowIndex} className='border-b border-neutral-100'>
              {Array.from({ length: cols }, (_, colIndex) => (
                <td key={colIndex} className='py-3 px-4'>
                  <div
                    className='h-4 bg-neutral-100 rounded animate-pulse'
                    style={{ width: colIndex === 0 ? '60%' : colIndex === cols - 1 ? '80px' : '40%' }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
