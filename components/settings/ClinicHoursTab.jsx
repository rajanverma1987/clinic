'use client';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

export function ClinicHoursTab({
  clinicHours,
  updateClinicHour,
  addTimeSlot,
  removeTimeSlot,
  updateTimeSlot,
  saving,
  onSave,
}) {
  return (
    <Card elevated={true}>
      <div className='mb-8'>
        <div className='flex justify-between items-start mb-6'>
          <div>
            <h2
              className='text-neutral-900 mb-2'
              style={{
                fontSize: '28px',
                lineHeight: '36px',
                letterSpacing: '-0.02em',
                fontWeight: '700',
              }}
            >
              Clinic Operating Hours
            </h2>
            <p
              className='text-neutral-600'
              style={{
                fontSize: '16px',
                lineHeight: '24px',
                fontWeight: '400',
              }}
            >
              Set your clinic&apos;s operating hours for each day of the week
            </p>
          </div>
          <Button onClick={onSave} isLoading={saving} size='md' className='whitespace-nowrap'>
            Save Changes
          </Button>
        </div>
      </div>

      <div className='space-y-4'>
        {clinicHours.map((hour, dayIndex) => (
          <div
            key={hour.day}
            className='p-6 border border-neutral-200 rounded-xl bg-white hover:border-primary-300 hover:shadow-md'
          >
            <div className='flex items-center justify-between mb-4'>
              <div className='flex items-center gap-4'>
                <label className='relative inline-flex items-center cursor-pointer'>
                  <input
                    type='checkbox'
                    checked={hour.isOpen}
                    onChange={(e) => updateClinicHour(dayIndex, 'isOpen', e.target.checked)}
                    className='sr-only peer'
                  />
                  <div className="w-11 h-6 bg-neutral-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after: peer-checked:bg-primary-500"></div>
                </label>
                <span
                  className='font-semibold text-neutral-900'
                  style={{ fontSize: '16px', lineHeight: '24px' }}
                >
                  {hour.day}
                </span>
              </div>
              {hour.isOpen && (
                <Button
                  type='button'
                  variant='secondary'
                  size='md'
                  onClick={() => addTimeSlot(dayIndex)}
                  className='whitespace-nowrap'
                >
                  <svg
                    className='w-5 h-5 mr-2'
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
                </Button>
              )}
            </div>

            {hour.isOpen && (
              <div className='space-y-3 mt-4'>
                {hour.timeSlots.map((slot, slotIndex) => (
                  <div
                    key={slotIndex}
                    className='flex items-end gap-4 p-4 bg-neutral-50 rounded-lg border border-neutral-200'
                  >
                    <div className='flex-1'>
                      <label
                        className='block text-neutral-700 font-semibold mb-2'
                        style={{ fontSize: '14px', lineHeight: '20px' }}
                      >
                        Start Time
                      </label>
                      <Input
                        type='time'
                        value={slot.startTime}
                        onChange={(e) =>
                          updateTimeSlot(dayIndex, slotIndex, 'startTime', e.target.value)
                        }
                        className='w-full'
                      />
                    </div>
                    <div className='flex-1'>
                      <label
                        className='block text-neutral-700 font-semibold mb-2'
                        style={{ fontSize: '14px', lineHeight: '20px' }}
                      >
                        End Time
                      </label>
                      <Input
                        type='time'
                        value={slot.endTime}
                        onChange={(e) =>
                          updateTimeSlot(dayIndex, slotIndex, 'endTime', e.target.value)
                        }
                        className='w-full'
                      />
                    </div>
                    {hour.timeSlots.length > 1 && (
                      <div className='flex items-end pb-2'>
                        <Button
                          type='button'
                          variant='danger'
                          size='md'
                          onClick={() => removeTimeSlot(dayIndex, slotIndex)}
                          className='whitespace-nowrap'
                        >
                          <svg
                            className='w-4 h-4 mr-2'
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
                          Remove
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {!hour.isOpen && (
              <div className='mt-4 ml-14'>
                <span
                  className='inline-flex items-center px-4 py-2 bg-neutral-100 text-neutral-600 rounded-lg font-medium'
                  style={{ fontSize: '14px', lineHeight: '20px' }}
                >
                  Closed
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
