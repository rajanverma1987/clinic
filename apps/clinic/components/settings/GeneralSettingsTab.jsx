'use client';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { SettingsTabHeader } from './SettingsTabHeader';

export function GeneralSettingsTab({
  isClinicAdmin,
  clinicForm,
  setClinicForm,
  saving,
  onSave,
  onCancel,
}) {
  const { user } = useAuth();
  const { t } = useI18n();
  const isSuperAdmin = user?.role === 'super_admin';

  if (!isClinicAdmin) {
    return (
      <div className='w-full max-w-4xl space-y-6 text-left'>
        <SettingsTabHeader title={t('settings.clinicInfo')} />
        <Card>
          <div className='p-6 text-center'>
            <h3 className='text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-1'>
              {t('settings.accessRestricted')}
            </h3>
            <p className='text-sm text-neutral-600 dark:text-neutral-400'>
              {t('settings.onlyClinicAdminManage')}
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className='w-full max-w-4xl space-y-6 text-left'>
      <SettingsTabHeader title={t('settings.clinicInfo')} />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave();
        }}
        className='space-y-6'
      >
        <Card>
          <div className='p-5'>
            <h3 className='text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4'>
              {t('settings.basicInformation')}
            </h3>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5'>
                  {t('settings.clinicName')} <span className='text-red-500'>*</span>
                </label>
                <Input
                  value={clinicForm.name}
                  onChange={(e) => setClinicForm({ ...clinicForm, name: e.target.value })}
                  placeholder={t('settings.clinicNamePlaceholder')}
                  required
                />
                <p className='text-xs text-neutral-500 dark:text-neutral-400 mt-1'>
                  {t('settings.appearsOnInvoices')}
                </p>
              </div>

              <div>
                <label className='block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5'>
                  {t('settings.region')} <span className='text-red-500'>*</span>
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
                <p className='text-xs text-neutral-500 dark:text-neutral-400 mt-1'>
                  {t('settings.primaryOperatingRegion')}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className='p-5'>
            <h3 className='text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4'>
              {t('settings.regionalSettings')}
            </h3>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-1.5'>
                  {t('settings.currency')} <span className='text-red-500'>*</span>
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
                <p className='text-xs text-neutral-500 mt-1'>{t('settings.forBillingInvoices')}</p>
              </div>

              {!isSuperAdmin && (
                <div>
                  <label className='block text-sm font-medium text-neutral-700 mb-1.5'>
                    {t('settings.locale')} <span className='text-red-500'>*</span>
                  </label>
                  <select
                    value={clinicForm.locale}
                    onChange={(e) => setClinicForm({ ...clinicForm, locale: e.target.value })}
                    className='w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-neutral-900 text-sm'
                    required
                  >
                    <option value='en-US'>English (US)</option>
                    <option value='es-ES'>Español</option>
                    <option value='ar-SA'>العربية</option>
                  </select>
                  <p className='text-xs text-neutral-500 mt-1'>
                    {t('settings.languageAndDateFormat')}
                  </p>
                </div>
              )}

              <div className='md:col-span-2'>
                <label className='block text-sm font-medium text-neutral-700 mb-1.5'>
                  {t('settings.timezone')} <span className='text-red-500'>*</span>
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
                  <option value='America/Los_Angeles'>
                    Pacific Time (PT) - America/Los_Angeles
                  </option>
                  <option value='America/Toronto'>Toronto - America/Toronto</option>
                  <option value='Europe/London'>London - Europe/London</option>
                  <option value='Europe/Paris'>Paris - Europe/Paris</option>
                  <option value='Asia/Kolkata'>India - Asia/Kolkata</option>
                  <option value='Australia/Sydney'>Sydney - Australia/Sydney</option>
                </select>
                <p className='text-xs text-neutral-500 mt-1'>
                  {t('settings.forAppointmentsScheduling')}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className='p-5'>
            <h3 className='text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-1'>
              {t('settings.letterheadSection')}
            </h3>
            <p className='text-sm text-neutral-600 dark:text-neutral-400 mb-4'>
              {t('settings.appearsOnPrescriptionAndReceipt')}
            </p>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='md:col-span-2'>
                <label className='block text-sm font-medium text-neutral-700 mb-1.5'>
                  {t('settings.logoUrl')}
                </label>
                <Input
                  value={clinicForm.logo || ''}
                  onChange={(e) => setClinicForm({ ...clinicForm, logo: e.target.value })}
                  placeholder={t('settings.urlPlaceholder')}
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-1.5'>
                  {t('settings.clinicPhone')}
                </label>
                <Input
                  value={clinicForm.phone || ''}
                  onChange={(e) => setClinicForm({ ...clinicForm, phone: e.target.value })}
                  placeholder={t('settings.clinicPhonePlaceholder')}
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-1.5'>
                  {t('settings.addressStreet')}
                </label>
                <Input
                  value={clinicForm.address?.street || ''}
                  onChange={(e) =>
                    setClinicForm({
                      ...clinicForm,
                      address: { ...(clinicForm.address || {}), street: e.target.value },
                    })
                  }
                  placeholder={t('settings.addressStreetPlaceholder')}
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-1.5'>
                  {t('settings.addressCity')}
                </label>
                <Input
                  value={clinicForm.address?.city || ''}
                  onChange={(e) =>
                    setClinicForm({
                      ...clinicForm,
                      address: { ...(clinicForm.address || {}), city: e.target.value },
                    })
                  }
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-1.5'>
                  {t('settings.addressState')}
                </label>
                <Input
                  value={clinicForm.address?.state || ''}
                  onChange={(e) =>
                    setClinicForm({
                      ...clinicForm,
                      address: { ...(clinicForm.address || {}), state: e.target.value },
                    })
                  }
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-1.5'>
                  {t('settings.addressZipCode')}
                </label>
                <Input
                  value={clinicForm.address?.zipCode || ''}
                  onChange={(e) =>
                    setClinicForm({
                      ...clinicForm,
                      address: { ...(clinicForm.address || {}), zipCode: e.target.value },
                    })
                  }
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-1.5'>
                  {t('settings.addressCountry')}
                </label>
                <Input
                  value={clinicForm.address?.country || ''}
                  onChange={(e) =>
                    setClinicForm({
                      ...clinicForm,
                      address: { ...(clinicForm.address || {}), country: e.target.value },
                    })
                  }
                />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className='p-5'>
            <h3 className='text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-1'>
              {t('settings.paymentReceiptSection')}
            </h3>
            <p className='text-sm text-neutral-600 dark:text-neutral-400 mb-4'>
              {t('settings.paymentRecordsNote')}
            </p>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-1.5'>
                  {t('settings.receiptTaxId')}
                </label>
                <Input
                  value={clinicForm.taxId || ''}
                  onChange={(e) => setClinicForm({ ...clinicForm, taxId: e.target.value })}
                  placeholder={t('settings.receiptTaxIdPlaceholder')}
                />
              </div>
              <div className='md:col-span-2'>
                <label className='block text-sm font-medium text-neutral-700 mb-1.5'>
                  {t('settings.receiptFooter')}
                </label>
                <Input
                  value={clinicForm.receiptFooter || ''}
                  onChange={(e) => setClinicForm({ ...clinicForm, receiptFooter: e.target.value })}
                  placeholder={t('settings.receiptFooterPlaceholder')}
                />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className='p-5'>
            <h3 className='text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4'>
              {t('settings.prescriptionSettings')}
            </h3>
            <div>
              <label className='block text-sm font-medium text-neutral-700 mb-1.5'>
                {t('settings.prescriptionValidityDays')} <span className='text-red-500'>*</span>
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
                placeholder={t('settings.prescriptionValidityPlaceholder')}
                required
                className='max-w-xs'
              />
              <p className='text-xs text-neutral-500 mt-1'>
                {t('settings.prescriptionValidityHelp')}
              </p>
            </div>
          </div>
        </Card>

        <Card className='border-primary-200 bg-primary-50/50 dark:bg-primary-900/10 dark:border-primary-800'>
          <div className='p-4'>
            <h3 className='text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-1'>
              {t('nav.apiDocs')}
            </h3>
            <p className='text-sm text-neutral-600 dark:text-neutral-400'>
              {t('apiDocs.superAdminOnly')}
            </p>
          </div>
        </Card>

        <div className='flex justify-end gap-2'>
          {onCancel && (
            <Button
              type='button'
              variant='secondary'
              size='sm'
              onClick={onCancel}
              disabled={saving}
            >
              {t('common.cancel')}
            </Button>
          )}
          <Button type='submit' variant='primary' size='sm' isLoading={saving} disabled={saving}>
            {t('common.save')}
          </Button>
        </div>
      </form>
    </div>
  );
}
