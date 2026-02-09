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
    href: '/admin/financial/revenue',
    labelKey: 'admin.financialRevenueDashboard',
    descKey: 'admin.financialRevenueDashboardDesc',
  },
  {
    href: '/admin/financial/disputes',
    labelKey: 'admin.financialPaymentDisputes',
    descKey: 'admin.financialPaymentDisputesDesc',
  },
  {
    href: '/admin/financial/settlements',
    labelKey: 'admin.financialDoctorSettlements',
    descKey: 'admin.financialDoctorSettlementsDesc',
  },
  {
    href: '/admin/financial/commission',
    labelKey: 'admin.financialCommissionSettings',
    descKey: 'admin.financialCommissionSettingsDesc',
  },
  {
    href: '/admin/financial/invoicing',
    labelKey: 'admin.financialInvoicing',
    descKey: 'admin.financialInvoicingDesc',
  },
];

export default function AdminFinancialPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { user, loading: authLoading } = useAuth();
  useEffect(() => {
    if (!authLoading && user?.role !== 'super_admin') router.push('/dashboard');
  }, [authLoading, user, router]);
  if (authLoading || user?.role !== 'super_admin') return null;
  return (
    <Layout
      title={t('admin.financialManagement')}
      subtitle={t('admin.financialManagementSubtitle')}
      actionButton={
        <Button variant='primary' href='/admin'>
          {t('common.backToDashboard')}
        </Button>
      }
    >
      <div style={{ padding: '0 10px' }} className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        {items.map(({ href, labelKey, descKey }) => (
          <Card key={href} className='p-6'>
            <h3 className='text-lg font-semibold text-neutral-900 mb-2'>{t(labelKey)}</h3>
            <p className='text-sm text-neutral-600 mb-4'>{t(descKey)}</p>
            <Button variant='secondary' href={href}>
              {t('common.open')}
            </Button>
          </Card>
        ))}
      </div>
    </Layout>
  );
}
