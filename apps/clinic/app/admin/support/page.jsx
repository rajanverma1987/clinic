'use client';

import { ChatIcon } from '@/components/icons';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminSupportPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user) {
      if (user.role !== 'super_admin') {
        router.push('/dashboard');
      }
    }
  }, [authLoading, user, router]);

  if (!user || user?.role !== 'super_admin') return null;

  return (
    <Layout
      title={t('admin.supportTickets') || 'Support Tickets'}
      subtitle={t('admin.supportTicketsSubtitle') || 'Manage support requests from clinics'}
    >
      <div className="admin-page-content">
        <Card className="p-12 text-center">
          <ChatIcon className="icon icon-3xl mx-auto mb-4 text-neutral-400" />
          <h3 className="text-lg font-semibold text-neutral-800 mb-2">
            {t('admin.supportComingSoon') || 'Support tickets coming soon'}
          </h3>
          <p className="text-neutral-600 max-w-md mx-auto">
            {t('admin.supportComingSoonDesc') ||
              'A full support ticket system for managing clinic requests will be available in a future release.'}
          </p>
        </Card>
      </div>
    </Layout>
  );
}
