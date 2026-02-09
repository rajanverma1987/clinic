'use client';

import { Layout } from '@/components/layout/Layout';
import { ErrorDisplay } from '@/components/ui/ErrorDisplay';

/**
 * 404 Not Found Page
 * Premium error page for missing routes
 */
export default function NotFound() {
  return (
    <Layout>
      <div className='flex items-center justify-center min-h-[calc(100vh-200px)]'>
        <ErrorDisplay statusCode={404} variant='default' showRetry={false} showHome={true} />
      </div>
    </Layout>
  );
}
