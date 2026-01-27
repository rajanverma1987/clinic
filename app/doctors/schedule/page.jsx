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
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, '0');
  return `${hour}:00`;
});

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
  const [emergencySlots, setEmergencySlots] = useState([]); // Array of {date, startTime, endTime}
  const [blockedSlots, setBlockedSlots] = useState([]); // Array of {date, startTime, endTime, reason}
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [newEmergencySlot, setNewEmergencySlot] = useState({ date: '', startTime: '', endTime: '' });
  const [newBlockedSlot, setNewBlockedSlot] = useState({ date: '', startTime: '', endTime: '', reason: '' });
  const [clinics, setClinics] = useState([]);
  const [selectedClinic, setSelectedClinic] = useState(null); // For per-location schedule
  const [isOnline, setIsOnline] = useState(true); // Online/Offline availability

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'doctor') {
      router.push('/dashboard');
      return;
    }
    fetchDoctorSchedule();
  }, [authLoading, user, router]);

  const fetchDoctorSchedule = async () => {
    try {
      setLoading(true);
      // Get doctor profile
      const doctorResponse = await apiClient.get(`/doctors/user/${user._id}`);
      if (!doctorResponse.success || !doctorResponse.data) {
        throw new Error('Doctor profile not found');
      }

      const currentDoctorId = doctorResponse.data._id;
      setDoctorId(currentDoctorId);

      // Fetch schedule
      const scheduleResponse = await apiClient.get(`/doctors/${currentDoctorId}/schedule`);
      if (scheduleResponse.success && scheduleResponse.data) {
        setSchedule(scheduleResponse.data.schedule || {});
        setBreaks(scheduleResponse.data.breaks || {});
        setSlotDuration(scheduleResponse.data.slotDuration || 30);
        setBufferTime(scheduleResponse.data.bufferTime || 0);
        setIsOnline(scheduleResponse.data.isOnline !== false);
      }

      // Fetch clinics for per-location schedule
      try {
        const clinicsResponse = await apiClient.get(`/doctors/${currentDoctorId}`);
        if (clinicsResponse.success && clinicsResponse.data?.clinics) {
          setClinics(clinicsResponse.data.clinics || []);
          if (clinicsResponse.data.clinics.length > 0) {
            setSelectedClinic(clinicsResponse.data.clinics[0]._id || clinicsResponse.data.clinics[0].id);
          }
        }
      } catch (err) {
        console.warn('Failed to fetch clinics:', err);
      }

      // Fetch holidays/leaves
      const leavesResponse = await apiClient.get(`/doctors/${currentDoctorId}/leaves`);
      if (leavesResponse.success && leavesResponse.data) {
        setHolidays(leavesResponse.data || []);
      }

      // Fetch emergency slots
      try {
        const emergencyResponse = await apiClient.get(`/doctors/${currentDoctorId}/emergency-slots`);
        if (emergencyResponse.success && emergencyResponse.data) {
          setEmergencySlots(emergencyResponse.data || []);
        }
      } catch (err) {
        console.warn('Emergency slots endpoint not available:', err);
      }

      // Fetch blocked slots
      try {
        const blockedResponse = await apiClient.get(`/doctors/${currentDoctorId}/blocked-slots`);
        if (blockedResponse.success && blockedResponse.data) {
          setBlockedSlots(blockedResponse.data || []);
        }
      } catch (err) {
        console.warn('Blocked slots endpoint not available:', err);
      }

      // Fetch emergency slots
      try {
        const emergencyResponse = await apiClient.get(`/doctors/${currentDoctorId}/emergency-slots`);
        if (emergencyResponse.success) {
          setEmergencySlots(emergencyResponse.data || []);
        }
      } catch (err) {
        console.warn('Emergency slots endpoint not available:', err);
      }

      // Fetch blocked slots
      try {
        const blockedResponse = await apiClient.get(`/doctors/${currentDoctorId}/blocked-slots`);
        if (blockedResponse.success) {
          setBlockedSlots(blockedResponse.data || []);
        }
      } catch (err) {
        console.warn('Blocked slots endpoint not available:', err);
      }
    } catch (err) {
      console.error('Failed to fetch doctor schedule:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDayToggle = (day) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: prev[day]
        ? null
        : {
            startTime: '09:00',
            endTime: '17:00',
          },
    }));
  };

  const handleTimeChange = (day, field, value) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }));
  };

  const handleBreakToggle = (day) => {
    setBreaks((prev) => ({
      ...prev,
      [day]: prev[day]
        ? null
        : {
            startTime: '12:00',
            endTime: '13:00',
          },
    }));
  };

  const handleBreakTimeChange = (day, field, value) => {
    setBreaks((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
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
        emergencySlots,
        blockedSlots,
        isOnline,
        clinicId: selectedClinic, // For per-location schedule
      });

      if (response.success) {
        alert('Schedule saved successfully');
      } else {
        alert('Failed to save schedule');
      }
    } catch (err) {
      console.error('Failed to save schedule:', err);
      alert('Failed to save schedule');
    } finally {
      setSaving(false);
    }
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
      <div className='max-w-6xl mx-auto space-y-6'>
        <PageHeader
          title='Schedule Management'
          subtitle='Manage your working hours, breaks, and availability'
        />

        {/* Online/Offline Toggle */}
        <Card>
          <div className='p-4 flex items-center justify-between'>
            <div>
              <h3 className='text-lg font-bold text-neutral-900 mb-1'>Availability Status</h3>
              <p className='text-sm text-neutral-600'>
                {isOnline ? 'You are currently online and accepting appointments' : 'You are currently offline'}
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
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </label>
          </div>
        </Card>

        {/* Clinic Selection for Per-Location Schedule */}
        {clinics.length > 1 && (
          <Card>
            <div className='p-4'>
              <label className='block text-sm font-medium text-neutral-700 mb-2'>
                Select Clinic Location
              </label>
              <select
                className='w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
                value={selectedClinic || ''}
                onChange={(e) => setSelectedClinic(e.target.value)}
              >
                <option value=''>All Locations (Default Schedule)</option>
                {clinics.map((clinic) => (
                  <option key={clinic._id || clinic.id} value={clinic._id || clinic.id}>
                    {clinic.name || 'Clinic Location'}
                  </option>
                ))}
              </select>
              <p className='text-xs text-neutral-500 mt-1'>
                {selectedClinic ? 'Managing schedule for selected location' : 'Managing default schedule for all locations'}
              </p>
            </div>
          </Card>
        )}

        {/* Weekly Schedule */}
        <Card>
          <div className='p-6'>
            <div className='flex items-center justify-between mb-6'>
              <h2 className='text-lg font-bold text-neutral-900'>Weekly Schedule</h2>
              <Button onClick={handleSaveSchedule} disabled={saving} variant='primary'>
                {saving ? 'Saving...' : 'Save Schedule'}
              </Button>
            </div>

            <div className='space-y-4'>
              {DAYS_OF_WEEK.map((day) => {
                const daySchedule = schedule[day.toLowerCase()];
                const dayBreak = breaks[day.toLowerCase()];

                return (
                  <div
                    key={day}
                    className='flex items-center gap-4 p-4 border border-neutral-200 rounded-lg'
                  >
                    <div className='w-32'>
                      <label className='flex items-center gap-2 cursor-pointer'>
                        <input
                          type='checkbox'
                          checked={!!daySchedule}
                          onChange={() => handleDayToggle(day.toLowerCase())}
                          className='icon icon-xs text-primary-600 rounded'
                        />
                        <span className='font-medium text-neutral-900'>{day}</span>
                      </label>
                    </div>

                    {daySchedule && (
                      <>
                        <div className='flex items-center gap-2'>
                          <label className='text-sm text-neutral-600'>From</label>
                          <Input
                            type='time'
                            value={daySchedule.startTime}
                            onChange={(e) =>
                              handleTimeChange(day.toLowerCase(), 'startTime', e.target.value)
                            }
                            className='w-32'
                          />
                        </div>
                        <div className='flex items-center gap-2'>
                          <label className='text-sm text-neutral-600'>To</label>
                          <Input
                            type='time'
                            value={daySchedule.endTime}
                            onChange={(e) =>
                              handleTimeChange(day.toLowerCase(), 'endTime', e.target.value)
                            }
                            className='w-32'
                          />
                        </div>

                        <div className='flex items-center gap-2 ml-auto'>
                          <label className='flex items-center gap-2 cursor-pointer'>
                            <input
                              type='checkbox'
                              checked={!!dayBreak}
                              onChange={() => handleBreakToggle(day.toLowerCase())}
                              className='icon icon-xs text-primary-600 rounded'
                            />
                            <span className='text-sm text-neutral-600'>Break</span>
                          </label>
                          {dayBreak && (
                            <>
                              <Input
                                type='time'
                                value={dayBreak.startTime}
                                onChange={(e) =>
                                  handleBreakTimeChange(day.toLowerCase(), 'startTime', e.target.value)
                                }
                                className='w-32'
                              />
                              <span className='text-sm text-neutral-600'>to</span>
                              <Input
                                type='time'
                                value={dayBreak.endTime}
                                onChange={(e) =>
                                  handleBreakTimeChange(day.toLowerCase(), 'endTime', e.target.value)
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
              <h2 className='text-lg font-bold text-neutral-900 mb-4'>Time Slot Settings</h2>
              <div className='space-y-4'>
                <div>
                  <label className='block text-sm font-medium text-neutral-700 mb-2'>
                    Appointment Duration (minutes)
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
                    Buffer Time Between Appointments (minutes)
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
              </div>
            </div>
          </Card>

          <Card>
            <div className='p-6'>
              <div className='flex items-center justify-between mb-4'>
                <h2 className='text-lg font-bold text-neutral-900'>Holidays & Leaves</h2>
                <Button
                  variant='secondary'
                  size='sm'
                  onClick={() => router.push(`/doctors/${doctorId}/leaves`)}
                >
                  Manage Leaves
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
                        {holiday.endDate &&
                          ` - ${new Date(holiday.endDate).toLocaleDateString()}`}
                      </p>
                      {holiday.reason && (
                        <p className='text-sm text-neutral-600 mt-1'>{holiday.reason}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className='text-sm text-neutral-500'>No holidays or leaves scheduled</p>
              )}
            </div>
          </Card>
        </div>

        {/* Emergency Slots */}
        <Card>
          <div className='p-6'>
            <div className='flex items-center justify-between mb-4'>
              <h2 className='text-lg font-bold text-neutral-900'>Emergency Slots</h2>
              <Button
                variant='primary'
                size='sm'
                onClick={() => {
                  setNewEmergencySlot({ date: '', startTime: '', endTime: '' });
                  setShowEmergencyModal(true);
                }}
              >
                + Add Emergency Slot
              </Button>
            </div>
            <p className='text-sm text-neutral-600 mb-4'>
              Emergency slots are available for urgent appointments outside regular hours
            </p>
            {emergencySlots.length > 0 ? (
              <div className='space-y-2'>
                {emergencySlots.map((slot, index) => (
                  <div
                    key={index}
                    className='p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between'
                  >
                    <div>
                      <p className='font-medium text-neutral-900'>
                        {new Date(slot.date).toLocaleDateString()} • {slot.startTime} - {slot.endTime}
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
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className='text-sm text-neutral-500'>No emergency slots configured</p>
            )}
          </div>
        </Card>

        {/* Blocked Time Slots */}
        <Card>
          <div className='p-6'>
            <div className='flex items-center justify-between mb-4'>
              <h2 className='text-lg font-bold text-neutral-900'>Blocked Time Slots</h2>
              <Button
                variant='secondary'
                size='sm'
                onClick={() => {
                  setNewBlockedSlot({ date: '', startTime: '', endTime: '', reason: '' });
                  setShowBlockModal(true);
                }}
              >
                + Block Time Slot
              </Button>
            </div>
            <p className='text-sm text-neutral-600 mb-4'>
              Block specific time slots to prevent appointments from being booked
            </p>
            {blockedSlots.length > 0 ? (
              <div className='space-y-2'>
                {blockedSlots.map((slot, index) => (
                  <div
                    key={index}
                    className='p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between'
                  >
                    <div>
                      <p className='font-medium text-neutral-900'>
                        {new Date(slot.date).toLocaleDateString()} • {slot.startTime} - {slot.endTime}
                      </p>
                      {slot.reason && (
                        <p className='text-sm text-neutral-600 mt-1'>Reason: {slot.reason}</p>
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
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className='text-sm text-neutral-500'>No blocked time slots</p>
            )}
          </div>
        </Card>

        {/* Emergency Slot Modal */}
        {showEmergencyModal && (
          <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
            <Card className='p-6 max-w-md w-full mx-4'>
              <h3 className='text-lg font-bold text-neutral-900 mb-4'>Add Emergency Slot</h3>
              <div className='space-y-4'>
                <div>
                  <label className='block text-sm font-medium text-neutral-700 mb-2'>Date *</label>
                  <Input
                    type='date'
                    value={newEmergencySlot.date}
                    onChange={(e) => setNewEmergencySlot({ ...newEmergencySlot, date: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-neutral-700 mb-2'>Start Time *</label>
                    <Input
                      type='time'
                      value={newEmergencySlot.startTime}
                      onChange={(e) => setNewEmergencySlot({ ...newEmergencySlot, startTime: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-neutral-700 mb-2'>End Time *</label>
                    <Input
                      type='time'
                      value={newEmergencySlot.endTime}
                      onChange={(e) => setNewEmergencySlot({ ...newEmergencySlot, endTime: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className='flex justify-end gap-3'>
                  <Button variant='secondary' onClick={() => setShowEmergencyModal(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant='primary'
                    onClick={() => {
                      if (newEmergencySlot.date && newEmergencySlot.startTime && newEmergencySlot.endTime) {
                        setEmergencySlots([...emergencySlots, newEmergencySlot]);
                        setShowEmergencyModal(false);
                      }
                    }}
                  >
                    Add Slot
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Block Slot Modal */}
        {showBlockModal && (
          <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
            <Card className='p-6 max-w-md w-full mx-4'>
              <h3 className='text-lg font-bold text-neutral-900 mb-4'>Block Time Slot</h3>
              <div className='space-y-4'>
                <div>
                  <label className='block text-sm font-medium text-neutral-700 mb-2'>Date *</label>
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
                    <label className='block text-sm font-medium text-neutral-700 mb-2'>Start Time *</label>
                    <Input
                      type='time'
                      value={newBlockedSlot.startTime}
                      onChange={(e) => setNewBlockedSlot({ ...newBlockedSlot, startTime: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-neutral-700 mb-2'>End Time *</label>
                    <Input
                      type='time'
                      value={newBlockedSlot.endTime}
                      onChange={(e) => setNewBlockedSlot({ ...newBlockedSlot, endTime: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className='block text-sm font-medium text-neutral-700 mb-2'>Reason (Optional)</label>
                  <Input
                    type='text'
                    value={newBlockedSlot.reason}
                    onChange={(e) => setNewBlockedSlot({ ...newBlockedSlot, reason: e.target.value })}
                    placeholder='e.g., Personal appointment, Training...'
                  />
                </div>
                <div className='flex justify-end gap-3'>
                  <Button variant='secondary' onClick={() => setShowBlockModal(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant='primary'
                    onClick={() => {
                      if (newBlockedSlot.date && newBlockedSlot.startTime && newBlockedSlot.endTime) {
                        setBlockedSlots([...blockedSlots, newBlockedSlot]);
                        setShowBlockModal(false);
                      }
                    }}
                  >
                    Block Slot
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
