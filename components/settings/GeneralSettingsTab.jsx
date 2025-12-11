'use client';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useI18n } from '@/contexts/I18nContext';

export function GeneralSettingsTab({ isClinicAdmin, clinicForm, setClinicForm, saving, onSave }) {
  const { t } = useI18n();

  if (!isClinicAdmin) {
    return (
      <Card className='text-center py-12'>
        <div className='flex flex-col items-center'>
          <div className='w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mb-3'>
            <svg
              className='w-8 h-8 text-neutral-400'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
              />
            </svg>
          </div>
          <h3 className='text-lg font-semibold text-neutral-900 mb-1'>Access Restricted</h3>
          <p className='text-sm text-neutral-600'>
            Only clinic administrators can manage clinic information.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave();
      }}
      className='space-y-4'
    >
      {/* Basic Information Section */}
      <Card>
        <div className='p-5'>
          <div className='flex items-center gap-2 mb-5'>
            <div className='w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center'>
              <svg
                className='w-4 h-4 text-primary-600'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
                />
              </svg>
            </div>
            <h2 className='text-lg font-bold text-neutral-900'>Basic Information</h2>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm font-medium text-neutral-700 mb-1.5'>
                Clinic Name <span className='text-red-500'>*</span>
              </label>
              <Input
                value={clinicForm.name}
                onChange={(e) => setClinicForm({ ...clinicForm, name: e.target.value })}
                placeholder='Enter clinic name'
                required
              />
              <p className='text-xs text-neutral-500 mt-1'>Appears on invoices and prescriptions</p>
            </div>

            <div>
              <label className='block text-sm font-medium text-neutral-700 mb-1.5'>
                Region <span className='text-red-500'>*</span>
              </label>
              <select
                value={clinicForm.region}
                onChange={(e) => setClinicForm({ ...clinicForm, region: e.target.value })}
                className='w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-neutral-900 text-sm'
                required
              >
                <option value='US'>United States</option>
                <option value='EU'>European Union</option>
                <option value='CA'>Canada</option>
                <option value='AU'>Australia</option>
                <option value='IN'>India</option>
                <option value='APAC'>Asia Pacific</option>
                <option value='ME'>Middle East</option>
              </select>
              <p className='text-xs text-neutral-500 mt-1'>Primary operating region</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Regional Settings Section */}
      <Card>
        <div className='p-5'>
          <div className='flex items-center gap-2 mb-5'>
            <div className='w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center'>
              <svg
                className='w-4 h-4 text-primary-600'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                />
              </svg>
            </div>
            <h2 className='text-lg font-bold text-neutral-900'>Regional Settings</h2>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm font-medium text-neutral-700 mb-1.5'>
                Currency <span className='text-red-500'>*</span>
              </label>
              <select
                value={clinicForm.currency}
                onChange={(e) => setClinicForm({ ...clinicForm, currency: e.target.value })}
                className='w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-neutral-900 text-sm'
                required
              >
                <option value='USD'>USD - US Dollar</option>
                <option value='EUR'>EUR - Euro</option>
                <option value='GBP'>GBP - British Pound</option>
                <option value='INR'>INR - Indian Rupee</option>
                <option value='CAD'>CAD - Canadian Dollar</option>
                <option value='AUD'>AUD - Australian Dollar</option>
              </select>
              <p className='text-xs text-neutral-500 mt-1'>For billing and invoices</p>
            </div>

            <div>
              <label className='block text-sm font-medium text-neutral-700 mb-1.5'>
                Locale <span className='text-red-500'>*</span>
              </label>
              <select
                value={clinicForm.locale}
                onChange={(e) => setClinicForm({ ...clinicForm, locale: e.target.value })}
                className='w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-neutral-900 text-sm'
                required
              >
                <option value='en-US'>English (US)</option>
                <option value='en-GB'>English (UK)</option>
                <option value='en-CA'>English (Canada)</option>
                <option value='en-AU'>English (Australia)</option>
                <option value='fr-CA'>French (Canada)</option>
                <option value='es-ES'>Spanish (Spain)</option>
              </select>
              <p className='text-xs text-neutral-500 mt-1'>Language and date format</p>
            </div>

            <div className='md:col-span-2'>
              <label className='block text-sm font-medium text-neutral-700 mb-1.5'>
                Timezone <span className='text-red-500'>*</span>
              </label>
              <select
                value={clinicForm.timezone}
                onChange={(e) => setClinicForm({ ...clinicForm, timezone: e.target.value })}
                className='w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-neutral-900 text-sm'
                required
              >
                <option value='America/New_York'>Eastern Time (ET) - America/New_York</option>
                <option value='America/Chicago'>Central Time (CT) - America/Chicago</option>
                <option value='America/Denver'>Mountain Time (MT) - America/Denver</option>
                <option value='America/Los_Angeles'>Pacific Time (PT) - America/Los_Angeles</option>
                <option value='America/Toronto'>Toronto - America/Toronto</option>
                <option value='Europe/London'>London - Europe/London</option>
                <option value='Europe/Paris'>Paris - Europe/Paris</option>
                <option value='Asia/Kolkata'>India - Asia/Kolkata</option>
                <option value='Australia/Sydney'>Sydney - Australia/Sydney</option>
              </select>
              <p className='text-xs text-neutral-500 mt-1'>For appointments and scheduling</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Prescription Settings Section */}
      <Card>
        <div className='p-5'>
          <div className='flex items-center gap-2 mb-5'>
            <div className='w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center'>
              <svg
                className='w-4 h-4 text-primary-600'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                />
              </svg>
            </div>
            <h2 className='text-lg font-bold text-neutral-900'>Prescription Settings</h2>
          </div>

          <div>
            <label className='block text-sm font-medium text-neutral-700 mb-1.5'>
              Prescription Validity Days <span className='text-red-500'>*</span>
            </label>
            <Input
              type='number'
              min='1'
              max='365'
              value={clinicForm.prescriptionValidityDays}
              onChange={(e) =>
                setClinicForm({
                  ...clinicForm,
                  prescriptionValidityDays: parseInt(e.target.value) || 30,
                })
              }
              placeholder='30'
              required
              className='max-w-xs'
            />
            <p className='text-xs text-neutral-500 mt-1'>
              Number of days a prescription remains valid from issue date
            </p>
          </div>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className='flex justify-end gap-3 pt-2'>
        <Button type='submit' isLoading={saving} disabled={saving}>
          Save Changes
        </Button>
      </div>
    </form>
  );
}
