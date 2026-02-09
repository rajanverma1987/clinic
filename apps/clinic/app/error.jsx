'use client';

import { ErrorDisplay } from '@/components/ui/ErrorDisplay';
import { logger } from '@/lib/utils/logger';
import { useEffect } from 'react';

/**
 * Global Error Page
 * Catches unhandled errors at the root level
 * Premium error UI with proper error logging
 */
export default function Error({ error, reset }) {
  useEffect(() => {
    // Log error for debugging
    logger.error('Global error page caught an error', error, {
      errorBoundary: 'RootErrorBoundary',
    });
  }, [error]);

  // Determine status code from error
  const statusCode =
    error?.statusCode ||
    error?.response?.status ||
    (error?.message?.includes('404') ? 404 : null) ||
    (error?.message?.includes('500') ? 500 : null) ||
    500;

  return (
    <ErrorDisplay
      statusCode={statusCode}
      variant='page'
      showRetry={true}
      showHome={true}
      onRetry={reset}
      message={error?.message}
    />
  );
}
