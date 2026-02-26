'use client';

import { Layout } from '@/components/layout/Layout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { apiClient } from '@/lib/api/client';
import { extractArrayData } from '@/lib/utils/api-response-extractor';
import { logger } from '@/lib/utils/logger';
import { showError, showSuccess } from '@/lib/utils/toast';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, '0');
  return `${hour}:00`;
});

function getWeekDates(fromDate) {
  const d = new Date(fromDate);
  const day = d.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + mondayOffset);
  d.setHours(0, 0, 0, 0);
  const week = [];
  for (let i = 0; i < 7; i++) {
    const x = new Date(d);
    x.setDate(d.getDate() + i);
    week.push(x);
  }
  return week;
}

export default function DoctorSchedulePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [doctorId, setDoctorId] = useState(null);
  const [schedule, setSchedule] = useState({});
  const [breaks, setBreaks] = useState({});
  const [holidays, setHolidays] = useState([]);
  const [slotDuration, setSlotDuration] = useState(30); // minutes
  const [bufferTime, setBufferTime] = useState(0); // minutes
  const [advanceBookingMinDays, setAdvanceBookingMinDays] = useState(0);
  const [advanceBookingMaxDays, setAdvanceBookingMaxDays] = useState(90);
  const [emergencySlots, setEmergencySlots] = useState([]); // Array of {date, startTime, endTime}
  const [blockedSlots, setBlockedSlots] = useState([]); // Array of {date, startTime, endTime, reason}
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [newEmergencySlot, setNewEmergencySlot] = useState({
    date: '',
    startTime: '',
    endTime: '',
  });
  const [newBlockedSlot, setNewBlockedSlot] = useState({
    date: '',
    startTime: '',
    endTime: '',
    reason: '',
  });
  const [clinics, setClinics] = useState([]);
  const [selectedClinic, setSelectedClinic] = useState(null); // For per-location schedule
  const [isOnline, setIsOnline] = useState(true); // Online/Offline availability
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date();
    const day = d.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + mondayOffset);
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [weekAppointments, setWeekAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);

  const fetchWeekAppointments = useCallback(async () => {
    const uid = user?._id ?? user?.userId;
    if (!uid) return;
    try {
      setLoadingAppointments(true);
      const start = new Date(weekStart);
      const end = new Date(weekStart);
      end.setDate(end.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      const res = await apiClient.get(
        `/appointments?doctorId=${uid}&startDate=${start.toISOString()}&endDate=${end.toISOString()}&limit=100`,
      );
      const list = extractArrayData(res);
      setWeekAppointments(Array.isArray(list) ? list : []);
    } catch (err) {
      logger.warn('Failed to fetch week appointments', { error: err?.message });
      setWeekAppointments([]);
    } finally {
      setLoadingAppointments(false);
    }
  }, [user?._id, user?.userId, weekStart]);

  useEffect(() => {
    if (user?._id && weekStart) fetchWeekAppointments();
  }, [user?._id, weekStart, fetchWeekAppointments]);

  const userId = user?._id ?? user?.id ?? user?.userId ?? null;

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'doctor') {
      router.push('/dashboard');
      return;
    }
    if (!userId) return;
    fetchDoctorSchedule();
  }, [authLoading, user, userId, router]);

  const fetchDoctorSchedule = async () => {
    if (!userId || userId === 'undefined') return;
    try {
      setLoading(true);
      // Get doctor profile
      const doctorResponse = await apiClient.get(`/doctors/user/${encodeURIComponent(userId)}`);
      if (!doctorResponse.success || !doctorResponse.data) {
        throw new Error('Doctor profile not found');
      }

      const currentDoctorId = doctorResponse.data._id;
      setDoctorId(currentDoctorId);

      // Fetch schedule (includes leaves, emergencySlots, blockedSlots)
      const scheduleResponse = await apiClient.get(`/doctors/${currentDoctorId}/schedule`);
      if (scheduleResponse.success && scheduleResponse.data) {
        const d = scheduleResponse.data;
        setSchedule(d.schedule || {});
        setBreaks(d.breaks || {});
        setSlotDuration(d.slotDuration ?? 30);
        setBufferTime(d.bufferTime ?? 0);
        setAdvanceBookingMinDays(d.advanceBookingMinDays ?? 0);
        setAdvanceBookingMaxDays(d.advanceBookingMaxDays ?? 90);
        setIsOnline(d.isOnline !== false);
        if (Array.isArray(d.leaves)) setHolidays(d.leaves);
        if (Array.isArray(d.emergencySlots)) setEmergencySlots(d.emergencySlots);
        if (Array.isArray(d.blockedSlots)) setBlockedSlots(d.blockedSlots);
      }

      // Fetch clinics for per-location schedule
      try {
        const clinicsResponse = await apiClient.get(`/doctors/${currentDoctorId}`);
        if (clinicsResponse.success && clinicsResponse.data?.clinics) {
          setClinics(clinicsResponse.data.clinics || []);
          if (clinicsResponse.data.clinics.length > 0) {
            setSelectedClinic(
              clinicsResponse.data.clinics[0]._id || clinicsResponse.data.clinics[0].id,
            );
          }
        }
      } catch (err) {
        logger.warn('Failed to fetch clinics', { error: err?.message });
      }

      // Leaves, emergencySlots, blockedSlots are included in schedule response above
    } catch (err) {
      logger.error('Failed to fetch doctor schedule', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDayToggle = (dayKey) => {
    setSchedule((prev) => ({
      ...prev,
      [dayKey]: prev[dayKey]
        ? null
        : {
            startTime: '09:00',
            endTime: '17:00',
          },
    }));
  };

  const handleTimeChange = (dayKey, field, value) => {
    setSchedule((prev) => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        [field]: value,
      },
    }));
  };

  const handleBreakToggle = (dayKey) => {
    setBreaks((prev) => ({
      ...prev,
      [dayKey]: prev[dayKey]
        ? null
        : {
            startTime: '12:00',
            endTime: '13:00',
          },
    }));
  };

  const handleBreakTimeChange = (dayKey, field, value) => {
    setBreaks((prev) => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        [field]: value,
      },
    }));
  };

  const handleSaveSchedule = async () => {
    if (!doctorId) return;

    try {
      setSaving(true);
      const response = await apiClient.put(`/doctors/${doctorId}/schedule`, {
        schedule,
        breaks,
        slotDuration,
        bufferTime,
        advanceBookingMinDays,
        advanceBookingMaxDays,
        emergencySlots,
        blockedSlots,
        isOnline,
        clinicId: selectedClinic,
      });

      if (response.success) {
        showSuccess(t('doctors.scheduleSavedSuccess'));
      } else {
        showError(response.error?.message || t('doctors.scheduleSaveFailed'));
      }
    } catch (err) {
      logger.error('Failed to save schedule', err);
      showError(err?.message || t('doctors.scheduleSaveFailed'));
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <Loader type='page' text={t('common.loading')} />
      </Layout>
    );
  }

  if (!user || user.role !== 'doctor') {
    return null;
  }

  return (
    <Layout>
      <div style={{ padding: '0 10px' }} className='space-y-6'>
        <PageHeader
          title={t('doctors.scheduleManagement')}
          subtitle={t('doctors.scheduleManagementSubtitle')}
        />

        {/* Online/Offline Toggle */}
        <Card>
          <div className='p-4 flex items-center justify-between'>
            <div>
              <h3 className='text-lg font-bold text-neutral-900 mb-1'>
                {t('doctors.availabilityStatus')}
              </h3>
              <p className='text-sm text-neutral-600'>
                {isOnline ? t('doctors.onlineMessage') : t('doctors.offlineMessage')}
              </p>
            </div>
            <label className='relative inline-flex items-center cursor-pointer'>
              <input
                type='checkbox'
                checked={isOnline}
                onChange={(e) => setIsOnline(e.target.checked)}
                className='sr-only peer'
              />
              <div className="w-11 h-6 bg-neutral-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              <span className='ml-3 text-sm font-medium text-neutral-700'>
                {isOnline ? t('doctors.online') : t('doctors.offline')}
              </span>
            </label>
          </div>
        </Card>

        {/* Week view + Daily detail */}
        <Card>
          <div className='p-6'>
            <div className='flex items-center justify-between mb-4 flex-wrap gap-2'>
              <h2 className='text-lg font-bold text-neutral-900'>{t('doctors.weekView')}</h2>
              <div className='flex flex-wrap items-center gap-4'>
                <span className='text-xs font-medium text-neutral-500 uppercase'>
                  {t('doctors.calendarLegend')}:
                </span>
                <span className='inline-flex items-center gap-1.5'>
                  <span className='w-3 h-3 rounded-full bg-primary-500' aria-hidden />
                  <span className='text-sm text-neutral-700'>{t('doctors.legendBooked')}</span>
                </span>
                <span className='inline-flex items-center gap-1.5'>
                  <span
                    className='w-3 h-3 rounded-full bg-green-400 border border-green-600'
                    aria-hidden
                  />
                  <span className='text-sm text-neutral-700'>{t('doctors.legendAvailable')}</span>
                </span>
                <span className='inline-flex items-center gap-1.5'>
                  <span
                    className='w-3 h-3 rounded-full bg-red-300 border border-red-500'
                    aria-hidden
                  />
                  <span className='text-sm text-neutral-700'>{t('doctors.legendBlocked')}</span>
                </span>
              </div>
              <div className='flex gap-2'>
                <Button
                  variant='secondary'
                  size='sm'
                  onClick={() => {
                    const prev = new Date(weekStart);
                    prev.setDate(prev.getDate() - 7);
                    setWeekStart(prev);
                  }}
                >
                  {t('doctors.previousWeek')}
                </Button>
                <Button
                  variant='secondary'
                  size='sm'
                  onClick={() => {
                    const next = new Date(weekStart);
                    next.setDate(next.getDate() + 7);
                    setWeekStart(next);
                  }}
                >
                  {t('doctors.nextWeek')}
                </Button>
                <Button
                  variant='secondary'
                  size='sm'
                  onClick={() => {
                    const d = new Date();
                    const day = d.getDay();
                    const mondayOffset = day === 0 ? -6 : 1 - day;
                    d.setDate(d.getDate() + mondayOffset);
                    d.setHours(0, 0, 0, 0);
                    setWeekStart(d);
                    setSelectedDate(new Date());
                  }}
                >
                  {t('doctors.today')}
                </Button>
              </div>
            </div>
            <div className='grid grid-cols-7 gap-2 mb-4'>
              {getWeekDates(weekStart).map((date) => {
                const dateStr = date.toISOString().split('T')[0];
                const isSelected =
                  selectedDate && selectedDate.toISOString().split('T')[0] === dateStr;
                const dayAppointments = weekAppointments.filter((apt) => {
                  const aptDate = apt.appointmentDate || apt.schedule?.date || apt.startTime;
                  if (!aptDate) return false;
                  const d = new Date(aptDate);
                  return d.toISOString().split('T')[0] === dateStr;
                });
                return (
                  <Button
                    type='button'
                    variant='ghost'
                    key={dateStr}
                    onClick={() => setSelectedDate(date)}
                    className={`p-3 rounded-lg border text-center transition-colors ${
                      isSelected
                        ? 'border-primary-600 bg-primary-50 text-primary-900'
                        : 'border-neutral-200 hover:bg-neutral-50 text-neutral-800'
                    }`}
                  >
                    <div className='text-xs font-medium text-neutral-500 uppercase'>
                      {date.toLocaleDateString(undefined, { weekday: 'short' })}
                    </div>
                    <div className='text-lg font-bold'>{date.getDate()}</div>
                    <div className='text-xs text-neutral-600'>
                      {date.toLocaleDateString(undefined, { month: 'short' })}
                    </div>
                    {dayAppointments.length > 0 && (
                      <div className='text-xs mt-1 font-medium text-primary-600'>
                        {dayAppointments.length} {t('doctors.appointments')}
                      </div>
                    )}
                  </Button>
                );
              })}
            </div>
            <div>
              <h3 className='text-sm font-bold text-neutral-900 mb-3'>
                {t('doctors.dailyDetail')} –{' '}
                {selectedDate
                  ? selectedDate.toLocaleDateString(undefined, {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })
                  : ''}
              </h3>
              {loadingAppointments ? (
                <Loader type='inline' text={t('common.loading')} />
              ) : selectedDate ? (
                (() => {
                  const dateStr = selectedDate.toISOString().split('T')[0];
                  const dayList = weekAppointments
                    .filter((apt) => {
                      const aptDate = apt.appointmentDate || apt.schedule?.date || apt.startTime;
                      if (!aptDate) return false;
                      return new Date(aptDate).toISOString().split('T')[0] === dateStr;
                    })
                    .sort(
                      (a, b) =>
                        new Date(a.startTime || a.appointmentDate) -
                        new Date(b.startTime || b.appointmentDate),
                    );
                  return dayList.length > 0 ? (
                    <ul className='space-y-2'>
                      {dayList.map((apt) => {
                        const patientName = apt.patientId
                          ? `${apt.patientId.firstName || ''} ${apt.patientId.lastName || ''}`.trim() ||
                            '—'
                          : '—';
                        const timeStr = apt.startTime
                          ? new Date(apt.startTime).toLocaleTimeString(undefined, {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '—';
                        return (
                          <li
                            key={apt._id}
                            className='flex items-center justify-between p-3 border border-neutral-200 rounded-lg hover:bg-neutral-50 cursor-pointer'
                            onClick={() => router.push(`/appointments/${apt._id}`)}
                          >
                            <span className='font-medium text-neutral-900'>{timeStr}</span>
                            <span className='text-neutral-700'>{patientName}</span>
                            <span className='text-sm text-neutral-600 capitalize'>
                              {apt.type || apt.status || '—'}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className='text-sm text-neutral-500 py-4'>
                      {t('doctors.noAppointmentsThisDay')}
                    </p>
                  );
                })()
              ) : null}
            </div>
          </div>
        </Card>

        {/* Clinic Selection for Per-Location Schedule */}
        {clinics.length > 1 && (
          <Card>
            <div className='p-4'>
              <label className='block text-sm font-medium text-neutral-700 mb-2'>
                {t('doctors.selectClinicLocation')}
              </label>
              <select
                className='w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
                value={selectedClinic || ''}
                onChange={(e) => setSelectedClinic(e.target.value)}
              >
                <option value=''>{t('doctors.allLocationsDefault')}</option>
                {clinics.map((clinic) => (
                  <option key={clinic._id || clinic.id} value={clinic._id || clinic.id}>
                    {clinic.name || t('doctors.clinicLocation')}
                  </option>
                ))}
              </select>
              <p className='text-xs text-neutral-500 mt-1'>
                {selectedClinic
                  ? t('doctors.managingScheduleFor')
                  : t('doctors.managingScheduleDefault')}
              </p>
            </div>
          </Card>
        )}

        {/* Weekly Schedule */}
        <Card>
          <div className='p-6'>
            <div className='flex items-center justify-between mb-6'>
              <h2 className='text-lg font-bold text-neutral-900'>{t('doctors.weeklySchedule')}</h2>
              <Button onClick={handleSaveSchedule} disabled={saving} variant='primary'>
                {saving ? t('doctors.saving') : t('doctors.saveSchedule')}
              </Button>
            </div>

            <div className='space-y-4'>
              {DAY_KEYS.map((dayKey) => {
                const daySchedule = schedule[dayKey];
                const dayBreak = breaks[dayKey];

                return (
                  <div
                    key={dayKey}
                    className='flex items-center gap-4 p-4 border border-neutral-200 rounded-lg'
                  >
                    <div className='w-32'>
                      <label className='flex items-center gap-2 cursor-pointer'>
                        <input
                          type='checkbox'
                          checked={!!daySchedule}
                          onChange={() => handleDayToggle(dayKey)}
                          className='icon icon-xs text-primary-600 rounded'
                        />
                        <span className='font-medium text-neutral-900'>
                          {t(`doctors.day${dayKey.charAt(0).toUpperCase() + dayKey.slice(1)}`)}
                        </span>
                      </label>
                    </div>

                    {daySchedule && (
                      <>
                        <div className='flex items-center gap-2'>
                          <label className='text-sm text-neutral-600'>{t('doctors.from')}</label>
                          <Input
                            type='time'
                            value={daySchedule.startTime}
                            onChange={(e) => handleTimeChange(dayKey, 'startTime', e.target.value)}
                            className='w-32'
                          />
                        </div>
                        <div className='flex items-center gap-2'>
                          <label className='text-sm text-neutral-600'>{t('doctors.to')}</label>
                          <Input
                            type='time'
                            value={daySchedule.endTime}
                            onChange={(e) => handleTimeChange(dayKey, 'endTime', e.target.value)}
                            className='w-32'
                          />
                        </div>

                        <div className='flex items-center gap-2 ml-auto'>
                          <label className='flex items-center gap-2 cursor-pointer'>
                            <input
                              type='checkbox'
                              checked={!!dayBreak}
                              onChange={() => handleBreakToggle(dayKey)}
                              className='icon icon-xs text-primary-600 rounded'
                            />
                            <span className='text-sm text-neutral-600'>{t('doctors.break')}</span>
                          </label>
                          {dayBreak && (
                            <>
                              <Input
                                type='time'
                                value={dayBreak.startTime}
                                onChange={(e) =>
                                  handleBreakTimeChange(dayKey, 'startTime', e.target.value)
                                }
                                className='w-32'
                              />
                              <span className='text-sm text-neutral-600'>{t('doctors.to')}</span>
                              <Input
                                type='time'
                                value={dayBreak.endTime}
                                onChange={(e) =>
                                  handleBreakTimeChange(dayKey, 'endTime', e.target.value)
                                }
                                className='w-32'
                              />
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Schedule Settings */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <Card>
            <div className='p-6'>
              <h2 className='text-lg font-bold text-neutral-900 mb-4'>
                {t('doctors.timeSlotSettings')}
              </h2>
              <div className='space-y-4'>
                <div>
                  <label className='block text-sm font-medium text-neutral-700 mb-2'>
                    {t('doctors.appointmentDurationMinutes')}
                  </label>
                  <Input
                    type='number'
                    min='15'
                    max='120'
                    step='15'
                    value={slotDuration}
                    onChange={(e) => setSlotDuration(parseInt(e.target.value) || 30)}
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-neutral-700 mb-2'>
                    {t('doctors.bufferTimeMinutes')}
                  </label>
                  <Input
                    type='number'
                    min='0'
                    max='30'
                    step='5'
                    value={bufferTime}
                    onChange={(e) => setBufferTime(parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-neutral-700 mb-2'>
                    {t('doctors.advanceBookingMinDays')}
                  </label>
                  <Input
                    type='number'
                    min='0'
                    max='365'
                    value={advanceBookingMinDays}
                    onChange={(e) => setAdvanceBookingMinDays(parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-neutral-700 mb-2'>
                    {t('doctors.advanceBookingMaxDays')}
                  </label>
                  <Input
                    type='number'
                    min='0'
                    max='365'
                    value={advanceBookingMaxDays}
                    onChange={(e) => setAdvanceBookingMaxDays(parseInt(e.target.value) || 90)}
                  />
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className='p-6'>
              <div className='flex items-center justify-between mb-4'>
                <h2 className='text-lg font-bold text-neutral-900'>
                  {t('doctors.holidaysLeaves')}
                </h2>
                <Button
                  variant='secondary'
                  size='sm'
                  onClick={() => doctorId && router.push(`/doctors/${doctorId}/leaves`)}
                  disabled={!doctorId}
                >
                  {t('doctors.manageLeaves')}
                </Button>
              </div>
              {holidays.length > 0 ? (
                <div className='space-y-2'>
                  {holidays.slice(0, 5).map((holiday, index) => (
                    <div
                      key={index}
                      className='p-3 bg-neutral-50 rounded-lg border border-neutral-200'
                    >
                      <p className='font-medium text-neutral-900'>
                        {new Date(holiday.startDate).toLocaleDateString()}
                        {holiday.endDate && ` - ${new Date(holiday.endDate).toLocaleDateString()}`}
                      </p>
                      {holiday.reason && (
                        <p className='text-sm text-neutral-600 mt-1'>{holiday.reason}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className='text-sm text-neutral-500'>{t('doctors.noHolidaysLeaves')}</p>
              )}
            </div>
          </Card>
        </div>

        {/* Emergency Slots */}
        <Card>
          <div className='p-6'>
            <div className='flex items-center justify-between mb-4'>
              <h2 className='text-lg font-bold text-neutral-900'>{t('doctors.emergencySlots')}</h2>
              <Button
                variant='primary'
                size='sm'
                onClick={() => {
                  setNewEmergencySlot({ date: '', startTime: '', endTime: '' });
                  setShowEmergencyModal(true);
                }}
              >
                {t('doctors.addEmergencySlot')}
              </Button>
            </div>
            <p className='text-sm text-neutral-600 mb-4'>{t('doctors.emergencySlotsDesc')}</p>
            {emergencySlots.length > 0 ? (
              <div className='space-y-2'>
                {emergencySlots.map((slot, index) => (
                  <div
                    key={index}
                    className='p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between'
                  >
                    <div>
                      <p className='font-medium text-neutral-900'>
                        {new Date(slot.date).toLocaleDateString()} • {slot.startTime} -{' '}
                        {slot.endTime}
                      </p>
                    </div>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => {
                        const updated = emergencySlots.filter((_, i) => i !== index);
                        setEmergencySlots(updated);
                      }}
                      className='text-red-600'
                    >
                      {t('doctors.remove')}
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className='text-sm text-neutral-500'>{t('doctors.noEmergencySlots')}</p>
            )}
          </div>
        </Card>

        {/* Blocked Time Slots */}
        <Card>
          <div className='p-6'>
            <div className='flex items-center justify-between mb-4'>
              <h2 className='text-lg font-bold text-neutral-900'>
                {t('doctors.blockedTimeSlots')}
              </h2>
              <Button
                variant='secondary'
                size='sm'
                onClick={() => {
                  setNewBlockedSlot({ date: '', startTime: '', endTime: '', reason: '' });
                  setShowBlockModal(true);
                }}
              >
                {t('doctors.blockTimeSlot')}
              </Button>
            </div>
            <p className='text-sm text-neutral-600 mb-4'>{t('doctors.blockedSlotsDesc')}</p>
            {blockedSlots.length > 0 ? (
              <div className='space-y-2'>
                {blockedSlots.map((slot, index) => (
                  <div
                    key={index}
                    className='p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between'
                  >
                    <div>
                      <p className='font-medium text-neutral-900'>
                        {new Date(slot.date).toLocaleDateString()} • {slot.startTime} -{' '}
                        {slot.endTime}
                      </p>
                      {slot.reason && (
                        <p className='text-sm text-neutral-600 mt-1'>
                          {t('doctors.reason')} {slot.reason}
                        </p>
                      )}
                    </div>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => {
                        const updated = blockedSlots.filter((_, i) => i !== index);
                        setBlockedSlots(updated);
                      }}
                      className='text-red-600'
                    >
                      {t('doctors.remove')}
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className='text-sm text-neutral-500'>{t('doctors.noBlockedSlots')}</p>
            )}
          </div>
        </Card>

        {/* Emergency Slot Modal */}
        {showEmergencyModal && (
          <div className='fixed inset-0 bg-neutral-500/30 backdrop-blur-sm flex items-center justify-center z-50'>
            <Card className='p-6 max-w-md w-full mx-4'>
              <h3 className='text-lg font-bold text-neutral-900 mb-4'>
                {t('doctors.addEmergencySlotModal')}
              </h3>
              <div className='space-y-4'>
                <div>
                  <label className='block text-sm font-medium text-neutral-700 mb-2'>
                    {t('doctors.dateRequired')}
                  </label>
                  <Input
                    type='date'
                    value={newEmergencySlot.date}
                    onChange={(e) =>
                      setNewEmergencySlot({ ...newEmergencySlot, date: e.target.value })
                    }
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-neutral-700 mb-2'>
                      {t('doctors.startTimeRequired')}
                    </label>
                    <Input
                      type='time'
                      value={newEmergencySlot.startTime}
                      onChange={(e) =>
                        setNewEmergencySlot({ ...newEmergencySlot, startTime: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-neutral-700 mb-2'>
                      {t('doctors.endTimeRequired')}
                    </label>
                    <Input
                      type='time'
                      value={newEmergencySlot.endTime}
                      onChange={(e) =>
                        setNewEmergencySlot({ ...newEmergencySlot, endTime: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>
                <div className='flex justify-end gap-3'>
                  <Button variant='secondary' onClick={() => setShowEmergencyModal(false)}>
                    {t('doctors.cancel')}
                  </Button>
                  <Button
                    variant='primary'
                    onClick={() => {
                      if (
                        newEmergencySlot.date &&
                        newEmergencySlot.startTime &&
                        newEmergencySlot.endTime
                      ) {
                        setEmergencySlots([...emergencySlots, newEmergencySlot]);
                        setShowEmergencyModal(false);
                      }
                    }}
                  >
                    {t('doctors.addSlot')}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Block Slot Modal */}
        {showBlockModal && (
          <div className='fixed inset-0 bg-neutral-500/30 backdrop-blur-sm flex items-center justify-center z-50'>
            <Card className='p-6 max-w-md w-full mx-4'>
              <h3 className='text-lg font-bold text-neutral-900 mb-4'>
                {t('doctors.blockTimeSlotModal')}
              </h3>
              <div className='space-y-4'>
                <div>
                  <label className='block text-sm font-medium text-neutral-700 mb-2'>
                    {t('doctors.dateRequired')}
                  </label>
                  <Input
                    type='date'
                    value={newBlockedSlot.date}
                    onChange={(e) => setNewBlockedSlot({ ...newBlockedSlot, date: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-neutral-700 mb-2'>
                      {t('doctors.startTimeRequired')}
                    </label>
                    <Input
                      type='time'
                      value={newBlockedSlot.startTime}
                      onChange={(e) =>
                        setNewBlockedSlot({ ...newBlockedSlot, startTime: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-neutral-700 mb-2'>
                      {t('doctors.endTimeRequired')}
                    </label>
                    <Input
                      type='time'
                      value={newBlockedSlot.endTime}
                      onChange={(e) =>
                        setNewBlockedSlot({ ...newBlockedSlot, endTime: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className='block text-sm font-medium text-neutral-700 mb-2'>
                    {t('doctors.reasonOptional')}
                  </label>
                  <Input
                    type='text'
                    value={newBlockedSlot.reason}
                    onChange={(e) =>
                      setNewBlockedSlot({ ...newBlockedSlot, reason: e.target.value })
                    }
                    placeholder={t('doctors.blockSlotPlaceholder')}
                  />
                </div>
                <div className='flex justify-end gap-3'>
                  <Button variant='secondary' onClick={() => setShowBlockModal(false)}>
                    {t('doctors.cancel')}
                  </Button>
                  <Button
                    variant='primary'
                    onClick={() => {
                      if (
                        newBlockedSlot.date &&
                        newBlockedSlot.startTime &&
                        newBlockedSlot.endTime
                      ) {
                        setBlockedSlots([...blockedSlots, newBlockedSlot]);
                        setShowBlockModal(false);
                      }
                    }}
                  >
                    {t('doctors.blockSlot')}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
}
