'use client';

import { FileDownIcon, MailIcon, RefreshCwIcon } from '@/components/icons';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { apiClient } from '@/lib/api/client';
import { extractArrayData, extractPaginationData } from '@/lib/utils/api-response-extractor';
import { logger } from '@/lib/utils/logger';
import { showError, showSuccess } from '@/lib/utils/toast';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AdminActivityLogsPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { user, loading: authLoading } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userIdFilter, setUserIdFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [resourceFilter, setResourceFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, pages: 1 });
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      if (user.role !== 'super_admin') {
        router.push('/dashboard');
        return;
      }
      fetchLogs();
    }
  }, [authLoading, user, pagination.page, userIdFilter, actionFilter, resourceFilter]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      if (userIdFilter) params.append('userId', userIdFilter);
      if (actionFilter) params.append('action', actionFilter);
      if (resourceFilter) params.append('resource', resourceFilter);
      const response = await apiClient.get(`/admin/activity-logs?${params.toString()}`);
      if (response.success && response.data) {
        setLogs(extractArrayData(response));
        const pag = extractPaginationData(response);
        setPagination((p) => ({
          ...p,
          page: pag.page ?? p.page,
          limit: pag.limit ?? p.limit,
          total: pag.total ?? 0,
          pages: pag.totalPages ?? pag.pages ?? 1,
        }));
      }
    } catch (err) {
      logger.error('Failed to fetch activity logs:', err);
      showError(t('admin.activityLogsFetchFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleExportCsv = () => {
    if (!logs.length) {
      showError(t('admin.activityLogsNotFound'));
      return;
    }
    setExporting(true);
    try {
      const headers = [
        t('admin.activityLogsTime'),
        t('admin.activityLogsUser'),
        t('admin.activityLogsAction'),
        t('admin.activityLogsResource'),
        t('admin.activityLogsResourceId'),
        t('admin.activityLogsPhi'),
      ];
      const rows = logs.map((l) => [
        l.timestamp ? new Date(l.timestamp).toISOString() : '',
        l.userName || l.userEmail || l.userId || '',
        l.action || '',
        l.resource || '',
        l.resourceId || '',
        l.phiAccessed ? 'Yes' : '',
      ]);
      const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
      ].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `activity-logs-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showSuccess(t('admin.activityLogsExportSuccess', 'Export downloaded'));
    } catch (err) {
      logger.error('Activity logs export failed:', err);
      showError(t('admin.activityLogsExportFailed', 'Export failed'));
    } finally {
      setExporting(false);
    }
  };

  const handleEmailReport = () => {
    showSuccess(t('admin.activityLogsEmailReportComingSoon', 'Email report is coming soon'));
  };

  if (authLoading || loading) return <Loader type='page' text={t('common.loading')} />;
  if (user?.role !== 'super_admin') return null;

  const pages =
    (pagination.pages ?? Math.ceil((pagination.total || 0) / (pagination.limit || 50))) || 1;

  return (
    <Layout title={t('admin.activityLogs')} subtitle={t('admin.activityLogsSubtitle')}>
      <div className='admin-page-content'>
        <Card className='mb-6'>
          <div className='flex flex-col sm:flex-row sm:items-end gap-4'>
            <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1 min-w-0'>
              <div>
                <label className='block text-body-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1'>
                  {t('admin.activityLogsUserId')}
                </label>
                <Input
                  type='text'
                  placeholder={t('admin.activityLogsFilterUserId')}
                  value={userIdFilter}
                  onChange={(e) => setUserIdFilter(e.target.value)}
                  className='form-control-height w-full'
                />
              </div>
              <div>
                <label className='block text-body-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1'>
                  {t('admin.activityLogsAction')}
                </label>
                <Input
                  type='text'
                  placeholder={t('admin.activityLogsFilterActionPlaceholder')}
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value)}
                  className='form-control-height w-full'
                />
              </div>
              <div>
                <label className='block text-body-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1'>
                  {t('admin.activityLogsResource')}
                </label>
                <Input
                  type='text'
                  placeholder={t('admin.activityLogsFilterResourcePlaceholder')}
                  value={resourceFilter}
                  onChange={(e) => setResourceFilter(e.target.value)}
                  className='form-control-height w-full'
                />
              </div>
            </div>
            <div className='flex gap-2 shrink-0'>
              <Button
                variant='ghost'
                size='md'
                onClick={() => {
                  setUserIdFilter('');
                  setActionFilter('');
                  setResourceFilter('');
                  setPagination((p) => ({ ...p, page: 1 }));
                  setTimeout(() => fetchLogs(), 0);
                }}
              >
                {t('common.clear')}
              </Button>
              <Button
                variant='primary'
                size='md'
                onClick={() => {
                  setPagination((p) => ({ ...p, page: 1 }));
                  fetchLogs();
                }}
              >
                {t('admin.activityLogsApply')}
              </Button>
            </div>
          </div>
        </Card>
        <Card>
          <div>
            <div className='flex flex-wrap items-center justify-between gap-3 mb-4'>
              <h2 className='text-body-md font-semibold text-neutral-900 dark:text-neutral-100'>
                {t('admin.activityLogsLogsCount', { count: pagination.total })}
              </h2>
              <div className='flex items-center gap-1'>
                <Button
                  variant='secondary'
                  size='sm'
                  onClick={handleExportCsv}
                  disabled={exporting || logs.length === 0}
                  iconOnly
                  aria-label={t('admin.activityLogsExportCsv')}
                  title={t('admin.activityLogsExportCsv')}
                >
                  {exporting ? (
                    <RefreshCwIcon className='w-4 h-4 animate-spin' aria-hidden />
                  ) : (
                    <FileDownIcon className='w-4 h-4' aria-hidden />
                  )}
                </Button>
                <Button
                  variant='secondary'
                  size='sm'
                  onClick={handleEmailReport}
                  iconOnly
                  aria-label={t('admin.activityLogsEmailReport')}
                  title={t('admin.activityLogsEmailReport')}
                >
                  <MailIcon className='w-4 h-4' aria-hidden />
                </Button>
              </div>
            </div>
            {logs.length === 0 ? (
              <p className='text-neutral-500'>{t('admin.activityLogsNotFound')}</p>
            ) : (
              <div className='clinic-table-wrap'>
                <table className='clinic-table'>
                  <thead>
                    <tr>
                      <th>{t('admin.activityLogsTime')}</th>
                      <th>{t('admin.activityLogsUser')}</th>
                      <th>{t('admin.activityLogsAction')}</th>
                      <th>{t('admin.activityLogsResource')}</th>
                      <th>{t('admin.activityLogsResourceId')}</th>
                      <th>{t('admin.activityLogsPhi')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((l) => (
                      <tr key={l._id}>
                        <td className='text-neutral-600'>
                          {l.timestamp ? new Date(l.timestamp).toLocaleString() : '—'}
                        </td>
                        <td>{l.userName || l.userEmail || l.userId || '—'}</td>
                        <td>{l.action || '—'}</td>
                        <td>{l.resource || '—'}</td>
                        <td className='text-neutral-600'>{l.resourceId || '—'}</td>
                        <td>{l.phiAccessed ? 'Yes' : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {pages > 1 && (
              <div className='mt-6 flex items-center justify-between'>
                <div className='text-sm text-neutral-600'>
                  {t('admin.activityLogsPageOf', {
                    page: pagination.page,
                    pages,
                    total: pagination.total,
                  })}
                </div>
                <div className='flex gap-2'>
                  <Button
                    variant='secondary'
                    size='sm'
                    onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                    disabled={pagination.page <= 1}
                  >
                    {t('common.previous')}
                  </Button>
                  <Button
                    variant='secondary'
                    size='sm'
                    onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                    disabled={pagination.page >= pages}
                  >
                    {t('common.next')}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </Layout>
  );
}
