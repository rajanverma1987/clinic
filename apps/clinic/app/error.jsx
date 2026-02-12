'use client';

import { ErrorDisplay } from '@/components/ui/ErrorDisplay';
import {
  classifyError,
  getUserFriendlyMessage,
  isChunkOrStaleError,
  tryChunkRecovery,
} from '@/lib/utils/error-handler';
import { logger } from '@/lib/utils/logger';
import { useEffect } from 'react';

/**
 * Next.js global error page. Renders when an unhandled error occurs.
 * Uses centralized error-handler for classification and user-facing message.
 * Auto hard-refreshes on chunk/stale-build errors (recoverable via reload).
 */
export default function Error({ error, reset }) {
  useEffect(() => {
    if (isChunkOrStaleError(error)) {
      logger.warn('Chunk/stale error detected, attempting recovery refresh', {
        message: error?.message,
      });
      if (tryChunkRecovery()) return;
    }
    const errorType = classifyError(error);
    logger.error('Global error page caught an error', error, {
      errorBoundary: 'RootErrorBoundary',
      errorType,
    });
  }, [error]);

  const statusCode =
    error?.statusCode ??
    error?.response?.status ??
    (error?.message?.includes('404') ? 404 : null) ??
    (error?.message?.includes('500') ? 500 : null) ??
    500;

  const message = getUserFriendlyMessage(
    error,
    'Something went wrong. Please try again or go back.',
  );

  return (
    <ErrorDisplay
      statusCode={statusCode}
      variant='page'
      showRetry={true}
      showHome={true}
      onRetry={reset}
      message={message}
    />
  );
}
