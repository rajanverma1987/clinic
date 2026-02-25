'use client';

import { Loader } from '@/components/ui/Loader';
import { useI18n } from '@/contexts/I18nContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/** Redirect /settings to first tab (general). Layout renders tab bar + children. */
export default function SettingsIndexPage() {
  const router = useRouter();
  const { t } = useI18n();
  useEffect(() => {
    router.replace('/settings/general');
  }, [router]);
  return (
    <div className='flex items-center justify-center min-h-[200px]'>
      <Loader type='section' text={t('common.loading')} />
    </div>
  );
}
