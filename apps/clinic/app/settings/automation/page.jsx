'use client';

import { Card } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import { useFeatures } from '@/contexts/FeatureContext';
import { useI18n } from '@/contexts/I18nContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AutomationSettingsPage() {
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
    if (!hasAddon('automationPro')) {
      router.replace('/settings/profile');
    }
  }, [authLoading, user, hasAddon, router]);

  if (authLoading || !user || !hasAddon('automationPro')) {
    return null;
  }

  return (
    <div style={{ padding: '0 10px' }}>
      <div className='mb-6'>
        <h1 className='text-2xl font-bold text-neutral-900 dark:text-neutral-100'>
          {t('settings.automation')}
        </h1>
        <p className='text-neutral-600 dark:text-neutral-400 mt-1 text-body-sm'>
          {t('subscriptionSpec.automationProDesc')}
        </p>
      </div>

      <Card className='p-6'>
        <h2 className='text-lg font-semibold mb-2'>{t('settings.automationReminderRules')}</h2>
        <p className='text-body-sm text-neutral-600 dark:text-neutral-400 mb-4'>
          {t('settings.automationReminderRulesDesc')}
        </p>
        <ul className='list-disc list-inside text-body-sm text-neutral-700 dark:text-neutral-300 space-y-1'>
          <li>{t('settings.automationReminderAppointment')}</li>
          <li>{t('settings.automationReminderFollowUp')}</li>
          <li>{t('settings.automationTaskTriggers')}</li>
        </ul>
      </Card>

      <Card className='p-6 mt-4'>
        <h2 className='text-lg font-semibold mb-2'>{t('settings.automationWorkflows')}</h2>
        <p className='text-body-sm text-neutral-600 dark:text-neutral-400'>
          {t('settings.automationWorkflowsDesc')}
        </p>
      </Card>
    </div>
  );
}
