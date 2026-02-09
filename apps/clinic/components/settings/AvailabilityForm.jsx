'use client';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export function AvailabilityForm({ availabilityForm, setAvailabilityForm }) {
  return (
    <div className='border-t border-neutral-200' style={{ paddingTop: 'var(--space-8)' }}>
      <h3
        className='text-neutral-900'
        style={{
          fontSize: '18px',
          lineHeight: '24px',
          fontWeight: '600',
          marginBottom: 'var(--space-4)',
        }}
      >
        Availability Settings
      </h3>
      <p
        className='text-neutral-600'
        style={{
          fontSize: '14px',
          lineHeight: '20px',
          marginBottom: 'var(--space-6)',
        }}
      >
        Manage your availability status for appointments and queue management
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-6)' }}>
        {/* Day Off Settings */}
        <div
          className='bg-neutral-50 rounded-xl border border-neutral-200'
          style={{ padding: 'var(--space-6)' }}
        >
          <div
            className='flex items-start justify-between'
            style={{ marginBottom: 'var(--space-4)' }}
          >
            <div>
              <h4
                className='text-neutral-900'
                style={{
                  fontSize: '16px',
                  lineHeight: '24px',
                  fontWeight: '600',
                  marginBottom: 'var(--space-1)',
                }}
              >
                Scheduled Day Off
              </h4>
              <p
                className='text-neutral-600'
                style={{
                  fontSize: '13px',
                  lineHeight: '18px',
                }}
              >
                Mark a specific day as unavailable for appointments
              </p>
            </div>
            <label className='relative inline-flex items-center cursor-pointer'>
              <input
                type='checkbox'
                checked={availabilityForm.isDayOff}
                onChange={(e) =>
                  setAvailabilityForm({
                    ...availabilityForm,
                    isDayOff: e.target.checked,
                  })
                }
                className='sr-only peer'
              />
              <div className="w-11 h-6 bg-neutral-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after: peer-checked:bg-primary-500"></div>
            </label>
          </div>

          {availabilityForm.isDayOff && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--gap-4)',
                marginTop: 'var(--space-4)',
              }}
            >
              <div>
                <label
                  className='block text-neutral-700 font-semibold'
                  style={{
                    fontSize: '14px',
                    lineHeight: '20px',
                    marginBottom: 'var(--space-2)',
                  }}
                >
                  Date
                </label>
                <Input
                  type='date'
                  value={availabilityForm.dayOffDate}
                  onChange={(e) =>
                    setAvailabilityForm({
                      ...availabilityForm,
                      dayOffDate: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label
                  className='block text-neutral-700 font-semibold'
                  style={{
                    fontSize: '14px',
                    lineHeight: '20px',
                    marginBottom: 'var(--space-2)',
                  }}
                >
                  Reason (Optional)
                </label>
                <Input
                  type='text'
                  placeholder='e.g., Personal leave, Conference, etc.'
                  value={availabilityForm.dayOffReason}
                  onChange={(e) =>
                    setAvailabilityForm({
                      ...availabilityForm,
                      dayOffReason: e.target.value,
                    })
                  }
                />
              </div>
              <Button size='sm' variant='primary' className='whitespace-nowrap'>
                Save Day Off
              </Button>
            </div>
          )}
        </div>

        {/* Emergency Off Settings */}
        <div
          className='bg-status-error/5 rounded-xl border border-status-error/20'
          style={{ padding: 'var(--space-6)' }}
        >
          <div
            className='flex items-start justify-between'
            style={{ marginBottom: 'var(--space-4)' }}
          >
            <div>
              <h4
                className='text-neutral-900'
                style={{
                  fontSize: '16px',
                  lineHeight: '24px',
                  fontWeight: '600',
                  marginBottom: 'var(--space-1)',
                }}
              >
                Emergency Unavailable
              </h4>
              <p
                className='text-neutral-600'
                style={{
                  fontSize: '13px',
                  lineHeight: '18px',
                }}
              >
                Temporarily mark yourself as unavailable for emergencies
              </p>
            </div>
            <label className='relative inline-flex items-center cursor-pointer'>
              <input
                type='checkbox'
                checked={availabilityForm.isEmergencyOff}
                onChange={(e) =>
                  setAvailabilityForm({
                    ...availabilityForm,
                    isEmergencyOff: e.target.checked,
                  })
                }
                className='sr-only peer'
              />
              <div
                className="bg-neutral-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-status-error/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after: peer-checked:bg-status-error"
                style={{
                  width: 'var(--size-lg)',
                  height: 'var(--size-sm)',
                }}
              >
                <div
                  className='after:h-5 after:w-5'
                  style={{
                    '--after-height': 'var(--space-5)',
                    '--after-width': 'var(--space-5)',
                  }}
                ></div>
              </div>
            </label>
          </div>

          {availabilityForm.isEmergencyOff && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--gap-4)',
                marginTop: 'var(--space-4)',
              }}
            >
              <div>
                <label
                  className='block text-neutral-700 font-semibold'
                  style={{
                    fontSize: '14px',
                    lineHeight: '20px',
                    marginBottom: 'var(--space-2)',
                  }}
                >
                  Reason
                </label>
                <Input
                  type='text'
                  placeholder='e.g., Medical emergency, Family emergency, etc.'
                  value={availabilityForm.emergencyOffReason}
                  onChange={(e) =>
                    setAvailabilityForm({
                      ...availabilityForm,
                      emergencyOffReason: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label
                  className='block text-neutral-700 font-semibold'
                  style={{
                    fontSize: '14px',
                    lineHeight: '20px',
                    marginBottom: 'var(--space-2)',
                  }}
                >
                  Available Until (Date & Time)
                </label>
                <Input
                  type='datetime-local'
                  value={availabilityForm.emergencyOffUntil}
                  onChange={(e) =>
                    setAvailabilityForm({
                      ...availabilityForm,
                      emergencyOffUntil: e.target.value,
                    })
                  }
                />
              </div>
              <Button size='sm' variant='danger' className='whitespace-nowrap'>
                Set Emergency Off
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
