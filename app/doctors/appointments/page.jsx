'use client';

import { Layout } from '@/components/layout/Layout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { Tag } from '@/components/ui/Tag';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { apiClient } from '@/lib/api/client';
import { extractArrayData } from '@/lib/utils/api-response-extractor';
import { logger } from '@/lib/utils/logger';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const STATUS_COLORS = {
  scheduled: 'bg-blue-100 text-blue-800',
  confirmed: 'bg-green-100 text-green-800',
  arrived: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-purple-100 text-purple-800',
  completed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
  no_show: 'bg-orange-100 text-orange-800',
};

export default function DoctorAppointmentsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [doctorId, setDoctorId] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [viewMode, setViewMode] = useState('day'); // day, week, month
  const [currentDate, setCurrentDate] = useState(new Date());

  const userId = user?._id ?? user?.id ?? user?.userId;

  useEffect(() => {
    if (authLoading) return;
    if (!user || (user.role || '').toLowerCase() !== 'doctor') {
      router.push('/dashboard');
      return;
    }
    if (!userId || userId === 'undefined') return;
    fetchDoctorId();
  }, [authLoading, user, userId, router]);

  useEffect(() => {
    if (doctorId) {
      fetchAppointments();
    }
  }, [doctorId, viewMode, currentDate]);

  const fetchDoctorId = async () => {
    if (!userId || userId === 'undefined') {
      setLoading(false);
      return;
    }
    try {
      const doctorResponse = await apiClient.get(`/doctors/user/${encodeURIComponent(userId)}`);
      if (doctorResponse.success && doctorResponse.data) {
        setDoctorId(doctorResponse.data._id);
      } else {
        setDoctorId(null);
      }
    } catch (err) {
      setDoctorId(null);
      logger.warn('Doctor profile not found or not yet created');
    } finally {
      setLoading(false);
    }
  };

  const fetchAppointments = async () => {
    if (!doctorId) return;

    try {
      setLoading(true);
      let startDate, endDate;

      const date = new Date(currentDate);
      switch (viewMode) {
        case 'day':
          startDate = new Date(date.setHours(0, 0, 0, 0));
          endDate = new Date(date.setHours(23, 59, 59, 999));
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          weekStart.setHours(0, 0, 0, 0);
          startDate = weekStart;
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          weekEnd.setHours(23, 59, 59, 999);
          endDate = weekEnd;
          break;
        case 'month':
          startDate = new Date(date.getFullYear(), date.getMonth(), 1);
          endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
          break;
      }

      const response = await apiClient.get(
        `/appointments?doctorId=${doctorId}&startDate=${startDate.toISOString().split('T')[0]}&endDate=${endDate.toISOString().split('T')[0]}&limit=100`
      );

      if (response.success) {
        const appointmentsData = extractArrayData(response);
        setAppointments(Array.isArray(appointmentsData) ? appointmentsData : []);
      }
    } catch (err) {
      logger.error('Failed to fetch appointments:', err);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const navigateDate = (direction) => {
    const newDate = new Date(currentDate);
    switch (viewMode) {
      case 'day':
        newDate.setDate(newDate.getDate() + direction);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + direction * 7);
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + direction);
        break;
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getAppointmentsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return appointments.filter((apt) => {
      const aptDate = apt.appointmentDate
        ? new Date(apt.appointmentDate).toISOString().split('T')[0]
        : new Date(apt.startTime).toISOString().split('T')[0];
      return aptDate === dateStr;
    });
  };

  const renderDayView = () => {
    const dayAppointments = getAppointmentsForDate(currentDate);
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className='space-y-4'>
        <div className='grid grid-cols-1 gap-2'>
          {hours.map((hour) => {
            const hourAppointments = dayAppointments.filter((apt) => {
              const aptTime = new Date(apt.startTime);
              return aptTime.getHours() === hour;
            });

            return (
              <div key={hour} className='border-b border-neutral-200 pb-2'>
                <div className='flex gap-4'>
                  <div className='w-20 text-sm font-medium text-neutral-600'>
                    {hour.toString().padStart(2, '0')}:00
                  </div>
                  <div className='flex-1 space-y-2'>
                    {hourAppointments.length > 0 ? (
                      hourAppointments.map((apt) => (
                        <Card
                          key={apt._id}
                          className='p-3 cursor-pointer hover:shadow-md transition-shadow'
                          onClick={() => router.push(`/appointments/${apt._id}`)}
                        >
                          <div className='flex items-start justify-between'>
                            <div className='flex-1'>
                              <div className='flex items-center gap-2 mb-1'>
                                <span className='font-semibold text-neutral-900'>
                                  {apt.patientId?.firstName} {apt.patientId?.lastName}
                                </span>
                                <Tag
                                  className={STATUS_COLORS[apt.status] || 'bg-gray-100 text-gray-800'}
                                >
                                  {apt.status}
                                </Tag>
                              </div>
                              <p className='text-sm text-neutral-600'>
                                {formatTime(apt.startTime)} - {formatTime(apt.endTime)}
                              </p>
                              {apt.type && (
                                <p className='text-xs text-neutral-500 mt-1'>{apt.type}</p>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))
                    ) : (
                      <div className='text-sm text-neutral-400 py-2'>No appointments</div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const weekStart = new Date(currentDate);
    weekStart.setDate(currentDate.getDate() - currentDate.getDay());
    const days = Array.from({ length: 7 }, (_, i) => {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      return day;
    });

    return (
      <div className='grid grid-cols-7 gap-2'>
        {days.map((day, index) => {
          const dayAppointments = getAppointmentsForDate(day);
          const isToday =
            day.toDateString() === new Date().toDateString();

          return (
            <div
              key={index}
              className={`border rounded-lg p-2 ${
                isToday ? 'bg-primary-50 border-primary-300' : 'bg-white border-neutral-200'
              }`}
            >
              <div className='mb-2'>
                <div className='text-xs font-medium text-neutral-600'>
                  {day.toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
                <div
                  className={`text-lg font-bold ${
                    isToday ? 'text-primary-600' : 'text-neutral-900'
                  }`}
                >
                  {day.getDate()}
                </div>
              </div>
              <div className='space-y-1 max-h-96 overflow-y-auto'>
                {dayAppointments.length > 0 ? (
                  dayAppointments.map((apt) => (
                    <div
                      key={apt._id}
                      className='p-2 bg-white rounded border border-neutral-200 cursor-pointer hover:shadow-sm text-xs'
                      onClick={() => router.push(`/appointments/${apt._id}`)}
                    >
                      <div className='font-medium text-neutral-900 truncate'>
                        {apt.patientId?.firstName} {apt.patientId?.lastName}
                      </div>
                      <div className='text-neutral-600'>
                        {formatTime(apt.startTime)}
                      </div>
                      <Tag
                        className={`${STATUS_COLORS[apt.status] || 'bg-gray-100 text-gray-800'} text-xs mt-1`}
                      >
                        {apt.status}
                      </Tag>
                    </div>
                  ))
                ) : (
                  <div className='text-xs text-neutral-400 py-2'>No appointments</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderMonthView = () => {
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDate = new Date(monthStart);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    const weeks = [];
    let currentWeek = [];
    let dateIterator = new Date(startDate);

    while (dateIterator <= monthEnd || currentWeek.length < 7) {
      currentWeek.push(new Date(dateIterator));
      if (currentWeek.length === 7) {
        weeks.push([...currentWeek]);
        currentWeek = [];
      }
      dateIterator.setDate(dateIterator.getDate() + 1);
    }
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(new Date(dateIterator));
        dateIterator.setDate(dateIterator.getDate() + 1);
      }
      weeks.push(currentWeek);
    }

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <div className='space-y-2'>
        <div className='grid grid-cols-7 gap-1 mb-2'>
          {dayNames.map((day) => (
            <div key={day} className='text-center text-sm font-semibold text-neutral-600 py-2'>
              {day}
            </div>
          ))}
        </div>
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className='grid grid-cols-7 gap-1'>
            {week.map((day, dayIndex) => {
              const dayAppointments = getAppointmentsForDate(day);
              const isToday = day.toDateString() === new Date().toDateString();
              const isCurrentMonth = day.getMonth() === monthStart.getMonth();

              return (
                <div
                  key={dayIndex}
                  className={`min-h-24 border rounded-lg p-1 ${
                    isToday
                      ? 'bg-primary-50 border-primary-300'
                      : isCurrentMonth
                      ? 'bg-white border-neutral-200'
                      : 'bg-neutral-50 border-neutral-100'
                  }`}
                >
                  <div
                    className={`text-sm font-medium mb-1 ${
                      isToday
                        ? 'text-primary-600'
                        : isCurrentMonth
                        ? 'text-neutral-900'
                        : 'text-neutral-400'
                    }`}
                  >
                    {day.getDate()}
                  </div>
                  <div className='space-y-0.5'>
                    {dayAppointments.slice(0, 3).map((apt) => (
                      <div
                        key={apt._id}
                        className='text-xs p-1 bg-white rounded border border-neutral-200 cursor-pointer hover:shadow-sm truncate'
                        onClick={() => router.push(`/appointments/${apt._id}`)}
                        title={`${apt.patientId?.firstName} ${apt.patientId?.lastName} - ${formatTime(apt.startTime)}`}
                      >
                        <div className='font-medium truncate'>
                          {formatTime(apt.startTime)} {apt.patientId?.firstName}
                        </div>
                      </div>
                    ))}
                    {dayAppointments.length > 3 && (
                      <div className='text-xs text-neutral-500 text-center'>
                        +{dayAppointments.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <Loader fullScreen size='lg' />
      </Layout>
    );
  }

  if (!user || user.role !== 'doctor') {
    return null;
  }

  return (
    <Layout>
      <div className='max-w-7xl mx-auto space-y-6'>
        <PageHeader
          title='Appointments Calendar'
          subtitle='View and manage your appointments'
        />

        {/* View Controls */}
        <Card>
          <div className='p-4'>
            <div className='flex items-center justify-between'>
              <div className='flex gap-2'>
                <Button
                  variant={viewMode === 'day' ? 'primary' : 'secondary'}
                  size='sm'
                  onClick={() => setViewMode('day')}
                >
                  Day
                </Button>
                <Button
                  variant={viewMode === 'week' ? 'primary' : 'secondary'}
                  size='sm'
                  onClick={() => setViewMode('week')}
                >
                  Week
                </Button>
                <Button
                  variant={viewMode === 'month' ? 'primary' : 'secondary'}
                  size='sm'
                  onClick={() => setViewMode('month')}
                >
                  Month
                </Button>
              </div>

              <div className='flex items-center gap-4'>
                <div className='flex items-center gap-2'>
                  <Button variant='secondary' size='sm' onClick={() => navigateDate(-1)}>
                    ← Prev
                  </Button>
                  <Button variant='secondary' size='sm' onClick={goToToday}>
                    Today
                  </Button>
                  <Button variant='secondary' size='sm' onClick={() => navigateDate(1)}>
                    Next →
                  </Button>
                </div>
                <div className='text-lg font-semibold text-neutral-900'>
                  {viewMode === 'day'
                    ? formatDate(currentDate)
                    : viewMode === 'week'
                    ? `Week of ${formatDate(currentDate)}`
                    : currentDate.toLocaleDateString('en-US', {
                        month: 'long',
                        year: 'numeric',
                      })}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Calendar View */}
        <Card>
          <div className='p-6'>
            {viewMode === 'day' && renderDayView()}
            {viewMode === 'week' && renderWeekView()}
            {viewMode === 'month' && renderMonthView()}
          </div>
        </Card>

        {/* Quick Actions */}
        <div className='flex gap-2'>
          <Button variant='primary' onClick={() => router.push('/appointments/new')}>
            New Appointment
          </Button>
          <Button variant='secondary' onClick={() => router.push('/appointments')}>
            List View
          </Button>
        </div>
      </div>
    </Layout>
  );
}
