'use client';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useI18n } from '@/contexts/I18nContext';

export function GeneralSettingsTab({ isClinicAdmin, clinicForm, setClinicForm, saving, onSave }) {
  const { t } = useI18n();

  if (!isClinicAdmin) {
    return (
      <Card elevated={true}>
        <div className='text-center py-8'>
          <p className='text-neutral-600'>You don&apos;t have permission to access this section.</p>
          <p className='text-sm text-neutral-500 mt-2'>
            Only clinic administrators can manage clinic information.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card elevated={true}>
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <h2
          className='text-neutral-900'
          style={{
            fontSize: '28px',
            lineHeight: '36px',
            letterSpacing: '-0.02em',
            fontWeight: '700',
            marginBottom: 'var(--space-2)',
          }}
        >
          {t('settings.clinicSettings')}
        </h2>
        <p
          className='text-neutral-600'
          style={{
            fontSize: '16px',
            lineHeight: '24px',
            fontWeight: '400',
          }}
        >
          Manage your clinic information and regional settings
        </p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-6)' }}>
        <div className='grid grid-cols-1 md:grid-cols-2' style={{ gap: 'var(--gap-6)' }}>
          <div>
            <label
              className='block text-neutral-700 font-semibold mb-2'
              style={{ fontSize: '14px', lineHeight: '20px' }}
            >
              {t('settings.clinicName')} *
            </label>
            <Input
              value={clinicForm.name}
              onChange={(e) => setClinicForm({ ...clinicForm, name: e.target.value })}
              required
            />
          </div>

          <div>
            <label
              className='block text-neutral-700 font-semibold mb-2'
              style={{ fontSize: '14px', lineHeight: '20px' }}
            >
              {t('settings.region')} *
            </label>
            <select
              value={clinicForm.region}
              onChange={(e) => setClinicForm({ ...clinicForm, region: e.target.value })}
              className='w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-neutral-900'
              style={{ fontSize: '14px', lineHeight: '20px' }}
            >
              <option value='US'>United States</option>
              <option value='EU'>European Union</option>
              <option value='CA'>Canada</option>
              <option value='AU'>Australia</option>
              <option value='IN'>India</option>
              <option value='APAC'>Asia Pacific</option>
              <option value='ME'>Middle East</option>
            </select>
          </div>

          <div>
            <label
              className='block text-neutral-700 font-semibold mb-2'
              style={{ fontSize: '14px', lineHeight: '20px' }}
            >
              {t('settings.currency')} *
            </label>
            <select
              value={clinicForm.currency}
              onChange={(e) => setClinicForm({ ...clinicForm, currency: e.target.value })}
              className='w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-neutral-900'
              style={{ fontSize: '14px', lineHeight: '20px' }}
            >
              <option value='USD'>USD - US Dollar</option>
              <option value='EUR'>EUR - Euro</option>
              <option value='GBP'>GBP - British Pound</option>
              <option value='INR'>INR - Indian Rupee</option>
              <option value='CAD'>CAD - Canadian Dollar</option>
              <option value='AUD'>AUD - Australian Dollar</option>
            </select>
          </div>

          <div>
            <label
              className='block text-neutral-700 font-semibold mb-2'
              style={{ fontSize: '14px', lineHeight: '20px' }}
            >
              {t('settings.locale')} *
            </label>
            <select
              value={clinicForm.locale}
              onChange={(e) => setClinicForm({ ...clinicForm, locale: e.target.value })}
              className='w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-neutral-900'
              style={{ fontSize: '14px', lineHeight: '20px' }}
            >
              <option value='en-US'>English (US)</option>
              <option value='en-GB'>English (UK)</option>
              <option value='en-CA'>English (Canada)</option>
              <option value='en-AU'>English (Australia)</option>
              <option value='fr-CA'>French (Canada)</option>
              <option value='es-ES'>Spanish (Spain)</option>
            </select>
          </div>

          <div className='md:col-span-2'>
            <label
              className='block text-neutral-700 font-semibold mb-2'
              style={{ fontSize: '14px', lineHeight: '20px' }}
            >
              {t('settings.timezone')} *
            </label>
            <select
              value={clinicForm.timezone}
              onChange={(e) => setClinicForm({ ...clinicForm, timezone: e.target.value })}
              className='w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-neutral-900'
              style={{ fontSize: '14px', lineHeight: '20px' }}
            >
              <option value='America/New_York'>Eastern Time (ET)</option>
              <option value='America/Chicago'>Central Time (CT)</option>
              <option value='America/Denver'>Mountain Time (MT)</option>
              <option value='America/Los_Angeles'>Pacific Time (PT)</option>
              <option value='America/Toronto'>Toronto</option>
              <option value='Europe/London'>London</option>
              <option value='Europe/Paris'>Paris</option>
              <option value='Asia/Kolkata'>India</option>
              <option value='Australia/Sydney'>Sydney</option>
            </select>
          </div>

          <div>
            <label
              className='block text-neutral-700 font-semibold mb-2'
              style={{ fontSize: '14px', lineHeight: '20px' }}
            >
              {t('settings.prescriptionValidityDays') || 'Prescription Validity Days'} *
            </label>
            <Input
              type='number'
              min='1'
              value={clinicForm.prescriptionValidityDays}
              onChange={(e) =>
                setClinicForm({
                  ...clinicForm,
                  prescriptionValidityDays: parseInt(e.target.value) || 30,
                })
              }
              required
            />
            <p className='text-neutral-600 mt-2' style={{ fontSize: '13px', lineHeight: '18px' }}>
              Number of days a prescription remains valid from the date it&apos;s issued
            </p>
          </div>
        </div>

        <div
          className='flex justify-end border-t border-neutral-200'
          style={{ paddingTop: 'var(--space-6)' }}
        >
          <Button onClick={onSave} isLoading={saving} size='md' className='whitespace-nowrap'>
            {t('common.save')}
          </Button>
        </div>
      </div>
    </Card>
  );
}
