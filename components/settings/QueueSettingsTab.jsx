'use client';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

export function QueueSettingsTab({ queueForm, setQueueForm, saving, onSave }) {
  return (
    <Card elevated={true}>
      <div className='mb-8'>
        <h2
          className='text-neutral-900 mb-2'
          style={{
            fontSize: '28px',
            lineHeight: '36px',
            letterSpacing: '-0.02em',
            fontWeight: '700',
          }}
        >
          Queue Management Settings
        </h2>
        <p
          className='text-neutral-600'
          style={{
            fontSize: '16px',
            lineHeight: '24px',
            fontWeight: '400',
          }}
        >
          Configure how patients are queued and displayed
        </p>
      </div>
      <div className='space-y-8'>
        <div>
          <h3
            className='text-neutral-900 mb-4'
            style={{
              fontSize: '18px',
              lineHeight: '24px',
              fontWeight: '600',
            }}
          >
            Queue Configuration
          </h3>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div>
              <label
                className='block text-neutral-700 font-semibold mb-2'
                style={{ fontSize: '14px', lineHeight: '20px' }}
              >
                Display Order
              </label>
              <select
                value={queueForm.displayOrder}
                onChange={(e) => setQueueForm({ ...queueForm, displayOrder: e.target.value })}
                className='w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-neutral-900'
                style={{ fontSize: '14px', lineHeight: '20px' }}
              >
                <option value='priority'>By Priority</option>
                <option value='fifo'>First In First Out</option>
                <option value='appointment_time'>By Appointment Time</option>
              </select>
            </div>

            <div>
              <label
                className='block text-neutral-700 font-semibold mb-2'
                style={{ fontSize: '14px', lineHeight: '20px' }}
              >
                Average Consultation Time (minutes)
              </label>
              <Input
                type='number'
                min='5'
                max='120'
                value={queueForm.averageConsultationTime}
                onChange={(e) =>
                  setQueueForm({
                    ...queueForm,
                    averageConsultationTime: parseInt(e.target.value) || 30,
                  })
                }
              />
            </div>

            <div>
              <label
                className='block text-neutral-700 font-semibold mb-2'
                style={{ fontSize: '14px', lineHeight: '20px' }}
              >
                Maximum Queue Length per Doctor
              </label>
              <Input
                type='number'
                min='1'
                value={queueForm.maxQueueLength}
                onChange={(e) =>
                  setQueueForm({ ...queueForm, maxQueueLength: parseInt(e.target.value) || 50 })
                }
              />
            </div>
          </div>
        </div>

        <div className='pt-6 border-t border-neutral-200'>
          <h3
            className='text-neutral-900 mb-4'
            style={{
              fontSize: '18px',
              lineHeight: '24px',
              fontWeight: '600',
            }}
          >
            Display Options
          </h3>
          <div className='space-y-4'>
            <label className='flex items-center p-4 bg-neutral-50 rounded-lg border border-neutral-200 hover:border-primary-300 hover:bg-primary-50/30 cursor-pointer'>
              <input
                type='checkbox'
                checked={queueForm.enablePublicDisplay}
                onChange={(e) =>
                  setQueueForm({ ...queueForm, enablePublicDisplay: e.target.checked })
                }
                className='w-5 h-5 rounded border-neutral-300 text-primary-500 focus:ring-primary-500 focus:ring-2'
              />
              <span className='ml-3 text-neutral-700 font-medium'>
                Enable Public Queue Display (No PHI)
              </span>
            </label>
            <label className='flex items-center p-4 bg-neutral-50 rounded-lg border border-neutral-200 hover:border-primary-300 hover:bg-primary-50/30 cursor-pointer'>
              <input
                type='checkbox'
                checked={queueForm.showEstimatedWaitTime}
                onChange={(e) =>
                  setQueueForm({ ...queueForm, showEstimatedWaitTime: e.target.checked })
                }
                className='w-5 h-5 rounded border-neutral-300 text-primary-500 focus:ring-primary-500 focus:ring-2'
              />
              <span className='ml-3 text-neutral-700 font-medium'>Show Estimated Wait Time</span>
            </label>
            <label className='flex items-center p-4 bg-neutral-50 rounded-lg border border-neutral-200 hover:border-primary-300 hover:bg-primary-50/30 cursor-pointer'>
              <input
                type='checkbox'
                checked={queueForm.autoCallNext}
                onChange={(e) => setQueueForm({ ...queueForm, autoCallNext: e.target.checked })}
                className='w-5 h-5 rounded border-neutral-300 text-primary-500 focus:ring-primary-500 focus:ring-2'
              />
              <span className='ml-3 text-neutral-700 font-medium'>
                Automatically Call Next Patient
              </span>
            </label>
          </div>
        </div>

        <div className='flex justify-end pt-6 border-t border-neutral-200'>
          <Button onClick={onSave} isLoading={saving} size='md' className='whitespace-nowrap'>
            Save Changes
          </Button>
        </div>
      </div>
    </Card>
  );
}
