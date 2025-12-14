'use client';

import AppointmentCalendar from '@/components/appointments/AppointmentCalendar';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { Table } from '@/components/ui/Table';
import { Tag } from '@/components/ui/Tag';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { useSettings } from '@/hooks/useSettings';
import { apiClient } from '@/lib/api/client';
import { showError, showSuccess } from '@/lib/utils/toast';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { FaVideo, FaBuilding, FaCheck, FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

export default function AppointmentsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const { locale } = useSettings();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [todayCount, setTodayCount] = useState(0);
  const [tomorrowCount, setTomorrowCount] = useState(0);
  const [statsLoading, setStatsLoading] = useState(true);
  const [settings, setSettings] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showCalendar, setShowCalendar] = useState(true);
  const [doctorIdInitialized, setDoctorIdInitialized] = useState(false);
  const [loadingAppointmentId, setLoadingAppointmentId] = useState(null);
  const [notifications, setNotifications] = useState(3); // Mock notification count

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await apiClient.get('/settings');
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

  // Fetch doctors list for clinic_admin (includes both 'doctor' and 'clinic_admin' roles)
  useEffect(() => {
    const fetchDoctors = async () => {
      if (!authLoading && user && (user.role === 'clinic_admin' || user.role === 'super_admin')) {
        try {
          // Fetch both doctors and clinic_admins (since clinic_admin is also a doctor)
          const [doctorsResponse, clinicAdminsResponse] = await Promise.all([
            apiClient.get('/users?role=doctor'),
            apiClient.get('/users?role=clinic_admin'),
          ]);

          console.log('=== Doctors API Debug ===');
          console.log('Doctors response:', doctorsResponse);
          console.log('Clinic Admins response:', clinicAdminsResponse);

          let allDoctors = [];

          // Extract doctors from first response
          if (doctorsResponse.success && doctorsResponse.data) {
            const doctorsList = doctorsResponse.data?.data || doctorsResponse.data || [];
            if (Array.isArray(doctorsList)) {
              allDoctors = [...allDoctors, ...doctorsList];
            }
          }

          // Extract clinic_admins from second response
          if (clinicAdminsResponse.success && clinicAdminsResponse.data) {
            const clinicAdminsList =
              clinicAdminsResponse.data?.data || clinicAdminsResponse.data || [];
            if (Array.isArray(clinicAdminsList)) {
              allDoctors = [...allDoctors, ...clinicAdminsList];
            }
          }

          console.log('Combined doctors list:', allDoctors);
          console.log('Total count:', allDoctors.length);

          if (Array.isArray(allDoctors) && allDoctors.length > 0) {
            // Filter only active doctors (isActive !== false means include undefined/null/true)
            const activeDoctors = allDoctors.filter((d) => d && d.isActive !== false);
            console.log('Active doctors after filter:', activeDoctors);
            console.log('Setting doctors state with:', activeDoctors);
            setDoctors(activeDoctors);
          } else {
            console.warn('No doctors found. Total count:', allDoctors.length);
            setDoctors([]); // Set empty array to show "No doctors available"
          }
        } catch (error) {
          console.error('Failed to fetch doctors - exception:', error);
          setDoctors([]);
        }
      } else {
        // If not clinic_admin, clear doctors list
        setDoctors([]);
      }
    };
    fetchDoctors();
  }, [authLoading, user]);

  // Set selected doctor to current user by default (for all roles) - only on initial load
  useEffect(() => {
    if (user && user.userId && !doctorIdInitialized) {
      // Set logged-in user as default selected doctor on initial load
      // This applies to all roles: doctor, clinic_admin, super_admin, receptionist
      setSelectedDoctorId(user.userId);
      setDoctorIdInitialized(true);
    }
  }, [user, doctorIdInitialized]);

  const formatDateDisplay = useCallback(
    (date, options) => {
      try {
        return new Intl.DateTimeFormat(settings?.settings?.locale || 'en-US', {
          timeZone: settings?.settings?.timezone || 'UTC',
          ...options,
        }).format(date);
      } catch (error) {
        console.error('Failed to format date:', error);
        return date.toLocaleDateString();
      }
    },
    [settings]
  );

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
      // Exclude video consultations from stats (they go to queue)
      const [todayResponse, tomorrowResponse] = await Promise.all([
        apiClient.get(`/appointments?page=1&limit=1000&date=${todayStr}`),
        apiClient.get(`/appointments?page=1&limit=1000&date=${tomorrowStr}`),
      ]);

      // Filter out video consultations from counts
      const todayList =
        todayResponse.success && todayResponse.data?.data ? todayResponse.data.data : [];
      const tomorrowList =
        tomorrowResponse.success && tomorrowResponse.data?.data ? tomorrowResponse.data.data : [];

      const todayTotal = todayList.filter(
        (apt) => !apt.isTelemedicine && apt.status !== 'arrived'
      ).length;
      const tomorrowTotal = tomorrowList.filter(
        (apt) => !apt.isTelemedicine && apt.status !== 'arrived'
      ).length;

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

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '1000', // Show all appointments
      });

      // Add filters
      if (selectedDoctorId) {
        params.append('doctorId', selectedDoctorId);
      }
      if (selectedStatus) {
        params.append('status', selectedStatus);
      }

      const response = await apiClient.get(`/appointments?${params}`);
      if (response.success && response.data) {
        // Handle pagination structure - data is inside response.data.data
        const appointmentsList = response.data.data || [];
        // Filter out:
        // 1. Video consultations (isTelemedicine: true) - they go directly to queue
        // 2. Appointments with "arrived" status - they should only appear in queue
        const filteredAppointments = appointmentsList.filter(
          (apt) => !apt.isTelemedicine && apt.status !== 'arrived'
        );
        setAppointments(Array.isArray(filteredAppointments) ? filteredAppointments : []);
        setTotalPages(response.data.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, selectedDoctorId, selectedStatus]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (!authLoading && user) {
      fetchAppointments();
    }
  }, [authLoading, user, router, fetchAppointments]);

  // Fetch stats separately when settings are loaded
  useEffect(() => {
    if (settings) {
      fetchStats();
    }
  }, [settings, fetchStats]);

  const handleStatusChange = async (appointmentId, newStatus, patientName) => {
    // Set loading state for this specific appointment
    setLoadingAppointmentId(appointmentId);

    try {
      const response = await apiClient.put(`/appointments/${appointmentId}/status`, {
        status: newStatus,
      });
      if (response.success) {
        // Show success message based on status
        if (newStatus === 'arrived') {
          showSuccess(`${patientName || 'Patient'} marked as arrived and added to the queue!`);
          // Refresh both appointments and stats
          // Small delay to ensure backend processing is complete
          setTimeout(() => {
            fetchAppointments();
            fetchStats();
            setLoadingAppointmentId(null);
          }, 500);
        } else if (newStatus === 'in_progress') {
          showSuccess(`Appointment started for ${patientName || 'patient'}`);
          fetchAppointments();
          setLoadingAppointmentId(null);
        } else if (newStatus === 'completed') {
          showSuccess(`Appointment completed for ${patientName || 'patient'}`);
          fetchAppointments();
          fetchStats();
          setLoadingAppointmentId(null);
        } else if (newStatus === 'cancelled') {
          showSuccess(`Appointment cancelled for ${patientName || 'patient'}`);
          fetchAppointments();
          fetchStats();
          setLoadingAppointmentId(null);
        } else {
          showSuccess('Appointment status updated successfully');
          fetchAppointments();
          setLoadingAppointmentId(null);
        }
      } else {
        // Handle error from API response
        const errorMessage = response.error?.message || 'Failed to update appointment status';
        // If it's a duplicate queue error but appointment was updated, show success
        if (errorMessage.includes('duplicate') && errorMessage.includes('queue')) {
          showSuccess(`${patientName || 'Patient'} marked as arrived. Already in queue.`);
          setTimeout(() => {
            fetchAppointments();
            fetchStats();
            setLoadingAppointmentId(null);
          }, 500);
        } else {
          showError(errorMessage);
          setLoadingAppointmentId(null);
        }
      }
    } catch (error) {
      console.error('Failed to update appointment status:', error);
      const errorMessage =
        error?.response?.data?.error?.message ||
        error?.message ||
        'Failed to update appointment status. Please try again.';

      // If it's a duplicate queue error, show a more user-friendly message
      if (errorMessage.includes('duplicate') && errorMessage.includes('queue')) {
        showSuccess(`${patientName || 'Patient'} is already in queue.`);
        setTimeout(() => {
          fetchAppointments();
          fetchStats();
          setLoadingAppointmentId(null);
        }, 500);
      } else {
        showError(errorMessage);
        setLoadingAppointmentId(null);
      }
    }
  };

  const getStatusLabel = (status) => {
    const statusMap = {
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
      accessor: (row) => `${row.patientId?.firstName || ''} ${row.patientId?.lastName || ''}`,
    },
    {
      header: t('appointments.doctor'),
      accessor: (row) => `${row.doctorId?.firstName || ''} ${row.doctorId?.lastName || ''}`,
    },
    {
      header: t('appointments.date'),
      accessor: (row) => new Date(row.appointmentDate).toLocaleDateString(),
    },
    {
      header: t('appointments.time'),
      accessor: (row) =>
        `${new Date(row.startTime).toLocaleTimeString()} - ${new Date(
          row.endTime
        ).toLocaleTimeString()}`,
    },
    { header: t('appointments.type'), accessor: 'type' },
    {
      header: 'Method',
      accessor: (row) => (
        <Tag
          variant={row.isTelemedicine ? 'default' : 'success'}
          size='sm'
          className='flex items-center gap-1 w-fit'
        >
          {row.isTelemedicine ? (
            <>
              <FaVideo className='w-3 h-3' />
              Video
            </>
          ) : (
            <>
              <FaBuilding className='w-3 h-3' />
              In-Person
            </>
          )}
        </Tag>
      ),
    },
    {
      header: t('appointments.status'),
      accessor: (row) => {
        const statusVariant =
          row.status === 'completed'
            ? 'success'
            : row.status === 'cancelled'
            ? 'danger'
            : row.status === 'in_progress' || row.status === 'arrived'
            ? 'primary'
            : 'default';
        return (
          <Tag variant={statusVariant} size='sm'>
            {getStatusLabel(row.status)}
          </Tag>
        );
      },
    },
    {
      header: t('common.actions'),
      accessor: (row) => {
        const patientName = `${row.patientId?.firstName || ''} ${
          row.patientId?.lastName || ''
        }`.trim();
        return (
          <div className='flex gap-2'>
            {(row.status === 'scheduled' || row.status === 'confirmed') && (
              <>
                <Button
                  size='sm'
                  variant='secondary'
                  iconOnly
                  isLoading={loadingAppointmentId === row._id}
                  disabled={loadingAppointmentId === row._id}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStatusChange(row._id, 'arrived', patientName);
                  }}
                  title={t('appointments.markArrived') || 'Mark as Arrived'}
                >
                  <FaCheck />
                </Button>
                <Button
                  size='sm'
                  variant='danger'
                  iconOnly
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStatusChange(row._id, 'cancelled', patientName);
                  }}
                  disabled={loadingAppointmentId === row._id}
                  title={t('appointments.cancelAppointment') || 'Cancel Appointment'}
                >
                  <FaTimes />
                </Button>
              </>
            )}
          </div>
        );
      },
    },
  ];

  // Redirect if not authenticated (non-blocking)
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  // Show empty state while redirecting
  if (!user) {
    return null;
  }

  if (loading) {
    return <Loader fullScreen size='lg' />;
  }

  return (
    <Layout>
      <div style={{ padding: '0 10px' }}>
        <DashboardHeader
          title={t('appointments.title')}
          subtitle={formatDateDisplay(new Date(), {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
          notifications={notifications}
          actionButton={
            <Button
              onClick={() => router.push('/appointments/new')}
              variant='primary'
              size='md'
              className='whitespace-nowrap'
            >
              + {t('appointments.bookAppointment')}
            </Button>
          }
        />

        {/* Filters Section */}
        <Card className='mb-6 p-4'>
          <div className='flex flex-wrap items-end gap-4'>
            {/* Doctor Filter - Only for clinic_admin */}
            {(user?.role === 'clinic_admin' || user?.role === 'super_admin') && (
              <div className='flex-1 min-w-[200px]'>
                <label className='block text-body-sm font-medium text-neutral-900 mb-1'>
                  {t('appointments.filterByDoctor') || 'Filter by Doctor'}
                </label>
                <select
                  value={selectedDoctorId}
                  onChange={(e) => {
                    setSelectedDoctorId(e.target.value);
                    setCurrentPage(1); // Reset to first page when filter changes
                  }}
                  className='w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500'
                >
                  <option value=''>{t('appointments.allDoctors') || 'All Doctors'}</option>
                  {doctors && Array.isArray(doctors) && doctors.length > 0 ? (
                    doctors.map((doctor) => {
                      // Handle both id and _id properties
                      const doctorId = doctor.id || doctor._id?.toString() || '';
                      const doctorName =
                        `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim() ||
                        doctor.email ||
                        'Unknown Doctor';
                      return (
                        <option key={doctorId} value={doctorId}>
                          {doctorName}
                        </option>
                      );
                    })
                  ) : (
                    <option value='' disabled>
                      {doctors === null || doctors === undefined
                        ? t('appointments.loadingDoctors') || 'Loading doctors...'
                        : t('appointments.noDoctorsAvailable') || 'No doctors available'}
                    </option>
                  )}
                </select>
              </div>
            )}

            {/* Status Filter - For all roles */}
            <div className='flex-1 min-w-[200px]'>
              <label className='block text-body-sm font-medium text-neutral-900 mb-1'>
                {t('appointments.filterByStatus') || 'Filter by Status'}
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setCurrentPage(1); // Reset to first page when filter changes
                }}
                className='w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500'
              >
                <option value=''>{t('appointments.allStatuses') || 'All Statuses'}</option>
                <option value='scheduled'>{t('appointments.scheduled')}</option>
                <option value='confirmed'>{t('appointments.confirmed')}</option>
                <option value='in_progress'>{t('appointments.inProgress')}</option>
                <option value='completed'>{t('appointments.completed')}</option>
                <option value='cancelled'>{t('appointments.cancelled')}</option>
              </select>
            </div>

            {/* Toggle Calendar Button - For receptionist and doctor */}
            {(user?.role === 'receptionist' ||
              user?.role === 'doctor' ||
              user?.role === 'clinic_admin' ||
              user?.role === 'super_admin') && (
              <div className='flex items-end'>
                <Button
                  variant='secondary'
                  size='md'
                  onClick={() => setShowCalendar(!showCalendar)}
                  className='whitespace-nowrap'
                >
                  {showCalendar ? t('appointments.hideCalendar') : t('appointments.showCalendar')}
                </Button>
              </div>
            )}
          </div>
        </Card>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-6'>
          <Card className='bg-primary-100 border border-primary-300'>
            <p className='text-body-sm font-medium text-primary-700 mb-2'>Today&apos;s Appointments</p>
            <div className='flex items-baseline gap-3'>
              <p className='text-h1 font-bold text-primary-900'>
                {statsLoading ? '—' : todayCount}
              </p>
              <span className='text-body-sm text-primary-700'>
                {formatDateDisplay(new Date(), { year: 'numeric', month: 'short', day: 'numeric' })}
              </span>
            </div>
            <p className='text-body-xs text-primary-500 mt-3'>
              Includes all appointments scheduled for today
            </p>
          </Card>

          <Card className='bg-secondary-100 border border-secondary-300'>
            <p className='text-body-sm font-medium text-secondary-700 mb-2'>
              Tomorrow&apos;s Appointments
            </p>
            <div className='flex items-baseline gap-3'>
              <p className='text-h1 font-bold text-secondary-700'>
                {statsLoading ? '—' : tomorrowCount}
              </p>
              <span className='text-body-sm text-secondary-700'>
                {formatDateDisplay(new Date(new Date().setDate(new Date().getDate() + 1)), {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
            <p className='text-body-xs text-secondary-500 mt-3'>
              Scheduled visits and video consultations for tomorrow
            </p>
          </Card>
        </div>

        {/* Calendar Section - Show for receptionist, doctor, and clinic_admin */}
        {showCalendar &&
          (user?.role === 'receptionist' ||
            user?.role === 'doctor' ||
            user?.role === 'clinic_admin' ||
            user?.role === 'super_admin') && (
            <div className='mb-6'>
              <AppointmentCalendar
                selectedDoctorId={selectedDoctorId || (user?.role === 'doctor' ? user.userId : '')}
                selectedDate={new Date()}
                onSlotSelect={(slot) => {
                  // Navigate to new appointment page with pre-filled data
                  const dateStr = slot.date.toISOString().split('T')[0];
                  const startTimeStr = slot.startTime.toISOString();
                  const endTimeStr = slot.endTime.toISOString();
                  const doctorIdParam =
                    selectedDoctorId || (user?.role === 'doctor' ? user.userId : '') || '';

                  // Build URL with query parameters
                  const params = new URLSearchParams();
                  if (doctorIdParam) params.append('doctorId', doctorIdParam);
                  params.append('date', dateStr);
                  params.append('startTime', startTimeStr);
                  params.append('endTime', endTimeStr);

                  router.push(`/appointments/new?${params.toString()}`);
                }}
                settings={settings?.settings}
              />
            </div>
          )}

          <Table
            data={appointments}
            columns={columns}
            onRowClick={(row) => router.push(`/appointments/${row._id}`)}
            emptyMessage={t('common.noDataFound')}
          />

          {totalPages > 1 && (
            <div className='mt-4 flex items-center justify-between'>
              <Button
                variant='secondary'
                size='sm'
                iconOnly
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                title={t('common.previous') || 'Previous'}
              >
                <FaChevronLeft />
              </Button>
              <span className='text-body-sm text-neutral-700'>
                {t('common.page')} {currentPage} {t('common.of')} {totalPages}
              </span>
              <Button
                variant='secondary'
                size='sm'
                iconOnly
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                title={t('common.next') || 'Next'}
              >
                <FaChevronRight />
              </Button>
            </div>
          )}
      </div>
    </Layout>
  );
}
