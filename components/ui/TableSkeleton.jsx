'use client';

/**
 * TableSkeleton – loading placeholder for data tables (Phase 7.2).
 * Renders N placeholder rows with shimmer for consistent loading UX.
 */
export function TableSkeleton({ rows = 5, cols = 5, className = '' }) {
  return (
    <div className={`clinic-table-wrap ${className}`.trim()}>
      <table className='clinic-table'>
        <thead>
          <tr>
            {Array.from({ length: cols }, (_, i) => (
              <th key={i}>
                <div className='h-4 bg-neutral-200 dark:bg-neutral-600 rounded animate-pulse w-20' />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }, (_, rowIndex) => (
            <tr key={rowIndex}>
              {Array.from({ length: cols }, (_, colIndex) => (
                <td key={colIndex}>
                  <div
                    className='h-4 bg-neutral-100 dark:bg-neutral-700 rounded animate-pulse'
                    style={{
                      width: colIndex === 0 ? '60%' : colIndex === cols - 1 ? '80px' : '40%',
                    }}
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
