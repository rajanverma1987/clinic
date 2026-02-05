'use client';

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
import { showError } from '@/lib/utils/toast';
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

  if (authLoading || loading) return <Loader type='page' text={t('common.loading')} />;
  if (user?.role !== 'super_admin') return null;

  const pages =
    (pagination.pages ?? Math.ceil((pagination.total || 0) / (pagination.limit || 50))) || 1;

  return (
    <Layout
      title={t('admin.activityLogs')}
      subtitle={t('admin.activityLogsSubtitle')}
      actionButton={
        <Button variant='primary' onClick={() => router.push('/admin/users')}>
          {t('admin.backToUsers')}
        </Button>
      }
    >
      <div style={{ padding: '0 10px' }}>
        <Card className='mb-6'>
          <div className='p-6'>
            <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-2'>
                  {t('admin.activityLogsUserId')}
                </label>
                <Input
                  type='text'
                  placeholder={t('admin.activityLogsFilterUserId')}
                  value={userIdFilter}
                  onChange={(e) => setUserIdFilter(e.target.value)}
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-2'>
                  {t('admin.activityLogsAction')}
                </label>
                <Input
                  type='text'
                  placeholder={t('admin.activityLogsFilterActionPlaceholder')}
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value)}
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-2'>
                  {t('admin.activityLogsResource')}
                </label>
                <Input
                  type='text'
                  placeholder={t('admin.activityLogsFilterResourcePlaceholder')}
                  value={resourceFilter}
                  onChange={(e) => setResourceFilter(e.target.value)}
                />
              </div>
              <div className='flex items-end'>
                <Button
                  variant='primary'
                  onClick={() => {
                    setPagination((p) => ({ ...p, page: 1 }));
                    fetchLogs();
                  }}
                  className='w-full'
                >
                  {t('admin.activityLogsApply')}
                </Button>
              </div>
            </div>
          </div>
        </Card>
        <Card>
          <div className='p-6'>
            <h2 className='text-lg font-semibold text-neutral-900 mb-4'>
              {t('admin.activityLogsLogsCount', { count: pagination.total })}
            </h2>
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
