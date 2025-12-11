'use client';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Toggle } from '@/components/ui/Toggle';

export function ClinicHoursTab({
  clinicHours,
  updateClinicHour,
  addTimeSlot,
  removeTimeSlot,
  updateTimeSlot,
  saving,
  onSave,
}) {
  const getDayIcon = (day) => {
    const icons = {
      Monday: '📅',
      Tuesday: '📆',
      Wednesday: '🗓️',
      Thursday: '📋',
      Friday: '📝',
      Saturday: '🎯',
      Sunday: '⭐',
    };
    return icons[day] || '📅';
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave();
      }}
      className='space-y-4'
    >
      <Card>
        <div className='p-5'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
            {clinicHours.map((hour, dayIndex) => (
              <div
                key={hour.day}
                className={`rounded-lg border p-3 transition-all ${
                  hour.isOpen
                    ? 'border-primary-200 bg-white shadow-sm'
                    : 'border-neutral-200 bg-neutral-50'
                }`}
              >
                {/* Day Header */}
                <div className='flex items-center justify-between mb-3 pb-2 border-b border-neutral-100'>
                  <div className='flex items-center gap-2'>
                    <span className='text-xl'>{getDayIcon(hour.day)}</span>
                    <span
                      className={`font-semibold text-sm ${
                        hour.isOpen ? 'text-neutral-900' : 'text-neutral-500'
                      }`}
                    >
                      {hour.day}
                    </span>
                  </div>
                  <div className='flex items-center gap-1.5'>
                    {hour.isOpen && (
                      <button
                        type='button'
                        onClick={() => addTimeSlot(dayIndex)}
                        className='p-1 text-primary-600 hover:bg-primary-50 rounded transition-colors'
                        title='Add time slot'
                      >
                        <svg
                          className='w-3.5 h-3.5'
                          fill='none'
                          stroke='currentColor'
                          viewBox='0 0 24 24'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M12 4v16m8-8H4'
                          />
                        </svg>
                      </button>
                    )}
                    <Toggle
                      checked={hour.isOpen}
                      onChange={(e) => updateClinicHour(dayIndex, 'isOpen', e.target.checked)}
                    />
                  </div>
                </div>

                {/* Time Slots */}
                {hour.isOpen && (
                  <div>
                    {hour.timeSlots.length > 0 ? (
                      <div className='space-y-2'>
                        {hour.timeSlots.map((slot, slotIndex) => (
                          <div
                            key={slotIndex}
                            className='group flex items-end gap-2 p-2 bg-neutral-50 rounded border border-neutral-200 hover:border-primary-200 transition-all'
                          >
                            <div className='flex-1'>
                              <label className='block text-xs text-neutral-600 mb-1 font-medium'>
                                Start <span className='text-red-500'>*</span>
                              </label>
                              <Input
                                type='time'
                                value={slot.startTime}
                                onChange={(e) =>
                                  updateTimeSlot(dayIndex, slotIndex, 'startTime', e.target.value)
                                }
                                className='w-full text-sm'
                                required
                              />
                            </div>
                            <div className='pb-2'>
                              <svg
                                className='w-3.5 h-3.5 text-neutral-400'
                                fill='none'
                                stroke='currentColor'
                                viewBox='0 0 24 24'
                              >
                                <path
                                  strokeLinecap='round'
                                  strokeLinejoin='round'
                                  strokeWidth={2}
                                  d='M14 5l7 7m0 0l-7 7m7-7H3'
                                />
                              </svg>
                            </div>
                            <div className='flex-1'>
                              <label className='block text-xs text-neutral-600 mb-1 font-medium'>
                                End <span className='text-red-500'>*</span>
                              </label>
                              <Input
                                type='time'
                                value={slot.endTime}
                                onChange={(e) =>
                                  updateTimeSlot(dayIndex, slotIndex, 'endTime', e.target.value)
                                }
                                className='w-full text-sm'
                                required
                              />
                            </div>
                            {hour.timeSlots.length > 1 && (
                              <button
                                type='button'
                                onClick={() => removeTimeSlot(dayIndex, slotIndex)}
                                className='p-1 text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity'
                                title='Remove time slot'
                              >
                                <svg
                                  className='w-3.5 h-3.5'
                                  fill='none'
                                  stroke='currentColor'
                                  viewBox='0 0 24 24'
                                >
                                  <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                                  />
                                </svg>
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className='text-center py-3'>
                        <button
                          type='button'
                          onClick={() => addTimeSlot(dayIndex)}
                          className='inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-primary-600 hover:bg-primary-50 rounded border border-primary-200 transition-colors'
                        >
                          <svg
                            className='w-3.5 h-3.5'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M12 4v16m8-8H4'
                            />
                          </svg>
                          Add Time Slot
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Closed State */}
                {!hour.isOpen && (
                  <div className='text-center py-3'>
                    <span className='inline-flex items-center px-2.5 py-1 text-xs font-medium bg-neutral-100 text-neutral-500 rounded'>
                      Closed
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className='flex justify-end gap-3 pt-2'>
        <Button type='submit' isLoading={saving} disabled={saving}>
          Save Hours
        </Button>
      </div>
    </form>
  );
}
