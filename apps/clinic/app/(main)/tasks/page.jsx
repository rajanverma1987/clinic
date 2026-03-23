'use client';

import { Layout } from '@/components/layout/Layout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { apiClient } from '@/lib/api/client';
import { showError, showSuccess } from '@/lib/utils/toast';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

export default function TasksPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const userId = user?.userId ?? user?.id ?? user?._id;

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [updatingId, setUpdatingId] = useState(null);

  const fetchTasks = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('assigneeId', userId);
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
      const res = await apiClient.get(`/tasks?${params}`);
      if (res.success && res.data?.items) {
        setTasks(res.data.items);
      } else {
        setTasks([]);
      }
    } catch (_err) {
      setTasks([]);
      showError(t('tasks.failedToLoad'));
    } finally {
      setLoading(false);
    }
  }, [userId, statusFilter, t]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchTasks();
    }
  }, [authLoading, user, fetchTasks]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  const handleMarkComplete = async (taskId) => {
    setUpdatingId(taskId);
    try {
      const res = await apiClient.put(`/tasks/${taskId}`, { status: 'completed' });
      if (res.success) {
        showSuccess(t('tasks.markedComplete'));
        fetchTasks();
      } else {
        showError(res.error?.message || t('tasks.updateFailed'));
      }
    } catch (err) {
      showError(err?.message || t('tasks.updateFailed'));
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusLabel = (status) => {
    const map = {
      pending: t('tasks.statusPending'),
      in_progress: t('tasks.statusInProgress'),
      completed: t('tasks.statusCompleted'),
      cancelled: t('tasks.statusCancelled'),
    };
    return map[status] || status;
  };

  const getPriorityLabel = (priority) => {
    const map = {
      low: t('tasks.priorityLow'),
      medium: t('tasks.priorityMedium'),
      high: t('tasks.priorityHigh'),
      urgent: t('tasks.priorityUrgent'),
    };
    return map[priority] || priority || '—';
  };

  if (!user) return null;

  return (
    <Layout>
      <PageHeader
        title={t('tasks.title')}
        subtitle={t('tasks.myTasks')}
        notifications={[]}
        unreadCount={0}
      />
      <div className='p-4 max-w-5xl'>
        <Card>
          <div className='p-5'>
            <div className='flex flex-wrap items-center gap-4 mb-4'>
              <label className='text-sm font-medium text-neutral-700 dark:text-neutral-300'>
                {t('tasks.filterByStatus')}
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className='px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm'
              >
                <option value='all'>{t('tasks.allStatuses')}</option>
                <option value='pending'>{t('tasks.statusPending')}</option>
                <option value='in_progress'>{t('tasks.statusInProgress')}</option>
                <option value='completed'>{t('tasks.statusCompleted')}</option>
                <option value='cancelled'>{t('tasks.statusCancelled')}</option>
              </select>
              <Button variant='secondary' size='sm' onClick={() => fetchTasks()} disabled={loading}>
                {t('common.refresh')}
              </Button>
            </div>
            {loading ? (
              <Loader type='section' text={t('common.loading')} />
            ) : tasks.length === 0 ? (
              <p className='text-sm text-neutral-500 dark:text-neutral-400'>{t('tasks.noTasks')}</p>
            ) : (
              <div className='clinic-table-wrap'>
                <table className='clinic-table'>
                  <thead>
                    <tr>
                      <th>{t('tasks.titleColumn')}</th>
                      <th>{t('tasks.dueDate')}</th>
                      <th>{t('tasks.priority')}</th>
                      <th>{t('common.status')}</th>
                      <th className='text-right'>{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map((task) => (
                      <tr key={task._id}>
                        <td>
                          <div className='font-medium'>{task.title}</div>
                          {task.description && (
                            <div className='text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2'>
                              {task.description}
                            </div>
                          )}
                        </td>
                        <td>
                          {task.dueDate
                            ? new Date(task.dueDate).toLocaleDateString()
                            : '—'}
                        </td>
                        <td>{getPriorityLabel(task.priority)}</td>
                        <td>{getStatusLabel(task.status)}</td>
                        <td className='text-right'>
                          {task.status !== 'completed' && (
                            <Button
                              variant='secondary'
                              size='sm'
                              onClick={() => handleMarkComplete(task._id)}
                              disabled={updatingId === task._id}
                            >
                              {updatingId === task._id
                                ? t('common.loading')
                                : t('tasks.markComplete')}
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Card>
      </div>
    </Layout>
  );
}
