'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { apiClient } from '@/lib/api/client';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { SearchBar } from '@/components/ui/SearchBar';
import { Tag } from '@/components/ui/Tag';
import { DatePicker } from '@/components/ui/DatePicker';

interface Appointment {
  _id: string;
  patientId: {
    firstName: string;
    lastName: string;
    patientId: string;
  };
  doctorId: {
    firstName: string;
    lastName: string;
  };
  appointmentDate: string;
  startTime: string;
  endTime: string;
  type: string;
  status: string;
  isTelemedicine?: boolean;
  telemedicineSessionId?: string;
}

interface PaginationResult {
  data: Appointment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

interface TenantSettings {
  settings: {
    locale: string;
    timezone: string;
  };
}

export default function AppointmentsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [todayCount, setTodayCount] = useState(0);
  const [tomorrowCount, setTomorrowCount] = useState(0);
  const [statsLoading, setStatsLoading] = useState(true);
  const [settings, setSettings] = useState<TenantSettings | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await apiClient.get<TenantSettings>('/settings');
        if (response.success && response.data) {
          setSettings(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      }
    };
    if (!authLoading && user) {
      fetchSettings();
    }
  }, [authLoading, user]);

  const formatDateDisplay = useCallback(
    (date: Date, options?: Intl.DateTimeFormatOptions) => {
      try {
        return new Intl.DateTimeFormat(settings?.settings.locale || 'en-US', {
          timeZone: settings?.settings.timezone || 'UTC',
          ...options,
        }).format(date);
      } catch (error) {
        console.error('Failed to format date:', error);
        return date.toLocaleDateString();
      }
    },
    [settings?.settings.locale, settings?.settings.timezone]
  );

  const formatDateForApi = useCallback((date: Date) => {
    try {
      return new Intl.DateTimeFormat('en-CA', {
        timeZone: settings?.settings.timezone || 'UTC',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(date);
    } catch {
      return date.toISOString().split('T')[0];
    }
  }, [settings?.settings.timezone]);

  const fetchStats = useCallback(async () => {
    if (!settings) return; // Wait for settings to load
    
    setStatsLoading(true);
    try {
      const timezone = settings.settings.timezone || 'UTC';
      const now = new Date();
      
      // Format today's date in clinic timezone as YYYY-MM-DD
      // Use Intl.DateTimeFormat to ensure correct timezone handling
      const todayStr = new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(now);
      
      // Get tomorrow by adding 1 day
      const tomorrowDate = new Date(now);
      tomorrowDate.setDate(tomorrowDate.getDate() + 1);
      const tomorrowStr = new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(tomorrowDate);

      console.log('Fetching stats:', { todayStr, tomorrowStr, timezone, now: now.toISOString() });

      // Fetch counts using the appointments API with date filter
      const [todayResponse, tomorrowResponse] = await Promise.all([
        apiClient.get<PaginationResult>(`/appointments?page=1&limit=1&date=${todayStr}`),
        apiClient.get<PaginationResult>(`/appointments?page=1&limit=1&date=${tomorrowStr}`),
      ]);

      const todayTotal = todayResponse.success && todayResponse.data?.pagination ? (todayResponse.data.pagination.total || 0) : 0;
      const tomorrowTotal = tomorrowResponse.success && tomorrowResponse.data?.pagination ? (tomorrowResponse.data.pagination.total || 0) : 0;

      console.log('Stats results:', { 
        todayTotal, 
        tomorrowTotal,
        todayStr,
        tomorrowStr,
        todayResponseData: todayResponse.data,
        tomorrowResponseData: tomorrowResponse.data,
      });

      setTodayCount(todayTotal);
      setTomorrowCount(tomorrowTotal);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setStatsLoading(false);
    }
  }, [settings]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (!authLoading && user) {
      fetchAppointments();
    }
  }, [authLoading, user, router, currentPage, dateFilter]);

  // Fetch stats separately when settings are loaded
  useEffect(() => {
    if (settings) {
      fetchStats();
    }
  }, [settings, fetchStats]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(dateFilter ? { date: dateFilter } : {}),
      });

      const response = await apiClient.get<PaginationResult>(`/appointments?${params}`);
      if (response.success && response.data) {
        // Handle pagination structure - data is inside response.data.data
        const appointmentsList = response.data.data || [];
        setAppointments(Array.isArray(appointmentsList) ? appointmentsList : []);
        setTotalPages(response.data.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (appointmentId: string, newStatus: string) => {
    try {
      const response = await apiClient.put(`/appointments/${appointmentId}/status`, {
        status: newStatus,
      });
      if (response.success) {
        fetchAppointments();
      }
    } catch (error) {
      console.error('Failed to update appointment status:', error);
    }
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      scheduled: t('appointments.scheduled'),
      confirmed: t('appointments.confirmed'),
      completed: t('appointments.completed'),
      cancelled: t('appointments.cancelled'),
      arrived: t('appointments.arrived'),
      in_progress: t('appointments.inProgress'),
    };
    return statusMap[status] || status;
  };

  const columns = [
    {
      header: t('appointments.patient'),
      accessor: (row: Appointment) =>
        `${row.patientId?.firstName || ''} ${row.patientId?.lastName || ''}`,
    },
    {
      header: t('appointments.doctor'),
      accessor: (row: Appointment) =>
        `${row.doctorId?.firstName || ''} ${row.doctorId?.lastName || ''}`,
    },
    {
      header: t('appointments.date'),
      accessor: (row: Appointment) => new Date(row.appointmentDate).toLocaleDateString(),
    },
    {
      header: t('appointments.time'),
      accessor: (row: Appointment) =>
        `${new Date(row.startTime).toLocaleTimeString()} - ${new Date(row.endTime).toLocaleTimeString()}`,
    },
    { header: t('appointments.type'), accessor: 'type' as keyof Appointment },
    {
      header: 'Method',
      accessor: (row: Appointment) => (
        <Tag variant={row.isTelemedicine ? 'default' : 'success'} size="sm" className="flex items-center gap-1 w-fit">
          {row.isTelemedicine ? (
            <>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Video
            </>
          ) : (
            <>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              In-Person
            </>
          )}
        </Tag>
      ),
    },
    {
      header: t('appointments.status'),
      accessor: (row: Appointment) => {
        const statusVariant = 
          row.status === 'completed' ? 'success' :
          row.status === 'cancelled' ? 'danger' :
          row.status === 'in_progress' || row.status === 'arrived' ? 'primary' :
          'default';
        return (
          <Tag variant={statusVariant} size="sm">
            {getStatusLabel(row.status)}
          </Tag>
        );
      },
    },
    {
      header: t('common.actions'),
      accessor: (row: Appointment) => (
        <div className="flex gap-2">
          {row.status === 'scheduled' && (
            <Button
              size="sm"
              variant="secondary"
              onClick={(e) => {
                e.stopPropagation();
                handleStatusChange(row._id, 'arrived');
              }}
            >
              {t('appointments.markArrived')}
            </Button>
          )}
          {row.status === 'arrived' && (
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleStatusChange(row._id, 'in_progress');
              }}
            >
              {t('appointments.startAppointment')}
            </Button>
          )}
          {row.status === 'in_progress' && (
            <Button
              size="sm"
              variant="secondary"
              onClick={(e) => {
                e.stopPropagation();
                handleStatusChange(row._id, 'completed');
              }}
            >
              {t('appointments.completeAppointment')}
            </Button>
          )}
        </div>
      ),
    },
  ];

  if (authLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
            <div className="text-gray-500">{t('common.loading')}</div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Redirecting to login...</div>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('appointments.title')}</h1>
            <p className="text-gray-600 mt-2">{t('appointments.appointmentList')}</p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
            <div className="text-gray-500">{t('common.loading')}</div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('appointments.title')}</h1>
          <p className="text-gray-600 mt-2">{t('appointments.appointmentList')}</p>
        </div>
        <Button onClick={() => router.push('/appointments/new')}>+ {t('appointments.bookAppointment')}</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card className="bg-blue-50 border border-blue-100">
          <p className="text-sm font-medium text-blue-600 mb-2">Today's Appointments</p>
          <div className="flex items-baseline gap-3">
            <p className="text-4xl font-bold text-blue-900">
              {statsLoading ? '—' : todayCount}
            </p>
            <span className="text-sm text-blue-700">
              {formatDateDisplay(new Date(), { year: 'numeric', month: 'short', day: 'numeric' })}
            </span>
          </div>
          <p className="text-xs text-blue-600 mt-3">
            Includes all appointments scheduled for today
          </p>
        </Card>

        <Card className="bg-emerald-50 border border-emerald-100">
          <p className="text-sm font-medium text-emerald-600 mb-2">Tomorrow's Appointments</p>
          <div className="flex items-baseline gap-3">
            <p className="text-4xl font-bold text-emerald-900">
              {statsLoading ? '—' : tomorrowCount}
            </p>
            <span className="text-sm text-emerald-700">
              {formatDateDisplay(
                new Date(new Date().setDate(new Date().getDate() + 1)),
                { year: 'numeric', month: 'short', day: 'numeric' }
              )}
            </span>
          </div>
          <p className="text-xs text-emerald-600 mt-3">
            Scheduled visits and video consultations for tomorrow
          </p>
        </Card>
      </div>

      <Card className="mb-6">
        <div className="flex gap-4 items-end flex-wrap">
          <div className="flex items-center gap-3">
            <DatePicker
              label={t('appointments.selectDate')}
              value={dateFilter || ''}
              onChange={(e) => {
                setDateFilter(e.target.value || null);
                setCurrentPage(1);
              }}
              className="w-full md:w-auto"
            />
            {dateFilter && (
              <Button
                variant="outline"
                type="button"
                onClick={() => {
                  setDateFilter(null);
                  setCurrentPage(1);
                }}
              >
                {t('common.clear')}
              </Button>
            )}
          </div>
        </div>
      </Card>

      <Card>
        <Table
          data={appointments}
          columns={columns}
          onRowClick={(row) => router.push(`/appointments/${row._id}`)}
          emptyMessage={t('common.noDataFound')}
        />

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              {t('common.previous')}
            </Button>
            <span className="text-sm text-gray-600">
              {t('common.page')} {currentPage} {t('common.of')} {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              {t('common.next')}
            </Button>
          </div>
        )}
      </Card>
    </Layout>
  );
}

