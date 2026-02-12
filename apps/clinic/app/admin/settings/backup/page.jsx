'use client';

import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { apiClient } from '@/lib/api/client';
import { showError, showSuccess } from '@/lib/utils/toast';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AdminSettingsBackupPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { user, loading: authLoading } = useAuth();
  const [running, setRunning] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  useEffect(() => {
    if (!authLoading && user && user.role !== 'super_admin') {
      router.push('/dashboard');
    }
  }, [authLoading, user, router]);

  const handleBackup = async () => {
    try {
      setRunning(true);
      setLastResult(null);
      const res = await apiClient.post('/admin/settings/backup');
      if (res.success && res.data) {
        setLastResult(res.data);
        showSuccess(
          t('admin.backupCompleted') || `Backup completed: ${res.data.totalDocs} documents in ${res.data.collections?.length || 0} collections`,
        );
      } else {
        showError(res.error?.message || t('admin.backupFailed'));
      }
    } catch (err) {
      showError(err.message || t('admin.backupFailed'));
    } finally {
      setRunning(false);
    }
  };

  if (authLoading || user?.role !== 'super_admin') return null;

  return (
    <Layout
      title={t('admin.backupDatabase') || 'Database Backup'}
      subtitle={t('admin.backupDatabaseDesc') || 'Export database collections (metadata only)'}
    >
      <div className="admin-page-content">
        <Card className="p-6 max-w-2xl">
          <p className="text-neutral-600 mb-4">
            {t('admin.backupDesc') ||
              'Run a database backup. This exports collection metadata and document counts. For full backup, use mongodump.'}
          </p>
          <Button
            variant="primary"
            onClick={handleBackup}
            disabled={running}
            isLoading={running}
          >
            {running ? t('admin.backingUp') || 'Backing up…' : t('admin.runBackup') || 'Run Backup'}
          </Button>
          {lastResult && (
            <div className="mt-4 p-4 bg-neutral-100 rounded-lg text-sm">
              <p className="font-medium">{t('admin.backupResult') || 'Result'}:</p>
              <p>
                {lastResult.collections?.length || 0} {t('admin.collections') || 'collections'},{' '}
                {lastResult.totalDocs || 0} {t('admin.documents') || 'documents'}
              </p>
            </div>
          )}
        </Card>
      </div>
    </Layout>
  );
}
