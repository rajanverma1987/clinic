'use client';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import { useFeatures } from '@/contexts/FeatureContext';
import { useI18n } from '@/contexts/I18nContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function IntegrationsSettingsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { hasAddon } = useFeatures();
  const { t } = useI18n();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (!hasAddon('apiIntegration')) {
      router.replace('/settings/profile');
    }
  }, [authLoading, user, hasAddon, router]);

  if (authLoading || !user || !hasAddon('apiIntegration')) {
    return null;
  }

  return (
    <div style={{ padding: '0 10px' }}>
      <div className='mb-6'>
        <h1 className='text-2xl font-bold text-neutral-900 dark:text-neutral-100'>
          {t('settings.apiIntegrations')}
        </h1>
        <p className='text-neutral-600 dark:text-neutral-400 mt-1 text-body-sm'>
          {t('subscriptionSpec.apiIntegrationDesc')}
        </p>
      </div>

      <Card className='p-6'>
        <h2 className='text-lg font-semibold mb-2'>{t('settings.apiDocsTitle')}</h2>
        <p className='text-body-sm text-neutral-600 dark:text-neutral-400 mb-4'>
          {t('settings.apiDocsDesc')}
        </p>
        <Link href='/api-docs'>
          <Button variant='primary' size='md'>
            {t('settings.openApiDocs')}
          </Button>
        </Link>
      </Card>

      <Card className='p-6 mt-4'>
        <h2 className='text-lg font-semibold mb-2'>{t('settings.webhooksTitle')}</h2>
        <p className='text-body-sm text-neutral-600 dark:text-neutral-400'>
          {t('settings.webhooksDesc')}
        </p>
      </Card>
    </div>
  );
}
