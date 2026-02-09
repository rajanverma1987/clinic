'use client';

import { Layout } from '@/components/layout/Layout';
import { Loader } from '@/components/ui/Loader';
import { useI18n } from '@/contexts/I18nContext';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Redirect /appointments/[id]/edit?status=... to /appointments/[id]?status=...
 * so the detail page can apply the status from the query.
 */
export default function AppointmentEditRedirectPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useI18n();
  const id = params?.id;

  useEffect(() => {
    if (!id) return;
    const query = searchParams.toString();
    const target = query ? `/appointments/${id}?${query}` : `/appointments/${id}`;
    router.replace(target);
  }, [id, searchParams, router]);

  return (
    <Layout>
      <div className='flex items-center justify-center min-h-[200px]'>
        <Loader type='page' text={t('common.loading')} />
      </div>
    </Layout>
  );
}
