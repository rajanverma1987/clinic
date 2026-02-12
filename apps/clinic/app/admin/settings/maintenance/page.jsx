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

export default function AdminSettingsMaintenancePage() {
  const router = useRouter();
  const { t } = useI18n();
  const { user, loading: authLoading } = useAuth();
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      if (user.role !== 'super_admin') router.push('/dashboard');
      else fetchSettings();
    }
  }, [authLoading, user]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/admin/settings/maintenance');
      if (res.success && res.data) setMaintenanceMode(res.data.maintenanceMode || false);
    } catch (err) {
      showError(t('admin.failedToLoadSettings'));
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async () => {
    try {
      setSaving(true);
      const res = await apiClient.put('/admin/settings/maintenance', {
        maintenanceMode: !maintenanceMode,
      });
      if (res.success) {
        setMaintenanceMode(!maintenanceMode);
        showSuccess(
          !maintenanceMode
            ? t('admin.maintenanceEnabled') || 'Maintenance mode enabled'
            : t('admin.maintenanceDisabled') || 'Maintenance mode disabled',
        );
      } else {
        showError(res.error?.message || t('admin.failedToSaveSettings'));
      }
    } catch (err) {
      showError(t('admin.failedToSaveSettings'));
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) return <Loader type="page" text={t('common.loading')} />;
  if (user?.role !== 'super_admin') return null;

  return (
    <Layout
      title={t('admin.maintenanceMode') || 'Maintenance Mode'}
      subtitle={t('admin.maintenanceModeDesc') || 'Enable maintenance mode to block non-admin access'}
    >
      <div className="admin-page-content">
        <Card className="p-6 max-w-2xl">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-neutral-800">
                {t('admin.maintenanceMode') || 'Maintenance Mode'}
              </h3>
              <p className="text-sm text-neutral-600 mt-1">
                {maintenanceMode
                  ? t('admin.maintenanceModeOnDesc') || 'Site is in maintenance. Only Super Admins can access.'
                  : t('admin.maintenanceModeOffDesc') || 'Site is operational. All users can access.'}
              </p>
            </div>
            <Button
              variant={maintenanceMode ? 'primary' : 'secondary'}
              onClick={handleToggle}
              disabled={saving}
            >
              {maintenanceMode
                ? t('admin.disableMaintenance') || 'Disable Maintenance'
                : t('admin.enableMaintenance') || 'Enable Maintenance'}
            </Button>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
