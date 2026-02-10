/**
 * Skeleton Loader Component
 * Matches ENTERPRISE_DASHBOARD_PERFORMANCE.md spec exactly.
 */

export function SkeletonLoader({ type = 'text', className = '' }) {
  const baseClasses = 'animate-pulse bg-gray-200 dark:bg-gray-700 rounded';

  const variants = {
    text: `h-4 ${className || 'w-full'}`,
    title: `h-6 ${className || 'w-3/4'}`,
    circle: `rounded-full ${className || 'w-12 h-12'}`,
    rectangle: `${className || 'w-full h-32'}`,
    card: `${className || 'w-full h-48'}`,
  };

  return <div className={`${baseClasses} ${variants[type]}`} />;
}

export function SkeletonCard() {
  return (
    <div className='border rounded-lg p-4 space-y-3'>
      <SkeletonLoader type='title' className='w-1/2' />
      <SkeletonLoader type='text' />
      <SkeletonLoader type='text' className='w-4/5' />
      <SkeletonLoader type='text' className='w-3/5' />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }) {
  return (
    <div className='space-y-3'>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className='flex gap-4'>
          <SkeletonLoader type='circle' className='w-10 h-10' />
          <div className='flex-1 space-y-2'>
            <SkeletonLoader type='text' className='w-1/4' />
            <SkeletonLoader type='text' className='w-1/2' />
          </div>
        </div>
      ))}
    </div>
  );
}
