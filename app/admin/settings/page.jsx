'use client';

import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const items = [
  {
    href: '/admin/settings/general',
    labelKey: 'admin.settingsGeneral',
    descKey: 'admin.settingsGeneralDesc',
  },
  {
    href: '/admin/settings/booking',
    labelKey: 'admin.settingsBooking',
    descKey: 'admin.settingsBookingDesc',
  },
  {
    href: '/admin/settings/payment',
    labelKey: 'admin.settingsPayment',
    descKey: 'admin.settingsPaymentDesc',
  },
  {
    href: '/admin/settings/notification',
    labelKey: 'admin.settingsNotification',
    descKey: 'admin.settingsNotificationDesc',
  },
  {
    href: '/admin/settings/email-sms',
    labelKey: 'admin.settingsEmailSms',
    descKey: 'admin.settingsEmailSmsDesc',
  },
  { href: '/admin/settings/seo', labelKey: 'admin.settingsSeo', descKey: 'admin.settingsSeoDesc' },
  {
    href: '/admin/settings/security',
    labelKey: 'admin.settingsSecurity',
    descKey: 'admin.settingsSecurityDesc',
  },
];

export default function AdminSettingsPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { user, loading: authLoading } = useAuth();
  useEffect(() => {
    if (!authLoading && user?.role !== 'super_admin') router.push('/dashboard');
  }, [authLoading, user, router]);
  if (authLoading || user?.role !== 'super_admin') return null;
  return (
    <Layout
      title={t('admin.settingsConfiguration')}
      subtitle={t('admin.settingsConfigurationSubtitle')}
      actionButton={
        <Button variant='primary' onClick={() => router.push('/admin')}>
          {t('common.backToDashboard')}
        </Button>
      }
    >
      <div style={{ padding: '0 10px' }} className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        {items.map(({ href, labelKey, descKey }) => (
          <Card key={href} className='p-6'>
            <h3 className='text-lg font-semibold text-neutral-900 mb-2'>{t(labelKey)}</h3>
            <p className='text-sm text-neutral-600 mb-4'>{t(descKey)}</p>
            <Button variant='secondary' onClick={() => router.push(href)}>
              {t('admin.configure')}
            </Button>
          </Card>
        ))}
      </div>
    </Layout>
  );
}
