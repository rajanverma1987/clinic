'use client';

import { useInView } from '@/hooks/useInView';

/**
 * Renders children only when the wrapper scrolls into view (with rootMargin).
 * Shows skeleton until then to avoid rendering heavy content below the fold.
 *
 * @param {object} props
 * @param {React.ReactNode} props.children - Content to render when in view
 * @param {React.ReactNode} [props.fallback] - Skeleton or placeholder (default: min-height block)
 * @param {string} [props.className] - Wrapper class
 */
export function LazyWidget({ children, fallback = null, className = '' }) {
  const { ref, hasBeenInView } = useInView({ rootMargin: '200px', threshold: 0.1 });

  return (
    <div ref={ref} className={className || 'min-h-[300px]'}>
      {hasBeenInView ? children : fallback ?? <div className='min-h-[300px] animate-pulse rounded-lg bg-neutral-100 dark:bg-neutral-800' />}
    </div>
  );
}
