'use client';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { transliterateToArabic } from '@/lib/utils/transliterate-name';
import { translateToSpanish } from '@/lib/utils/translate-name-spanish';
import { useCallback } from 'react';
import { SettingsTabHeader } from './SettingsTabHeader';

/** Maps DB region/country codes to i18n keys so displayed value is always translated */
const REGION_KEYS = {
  US: 'settings.regionUS',
  EU: 'settings.regionEU',
  CA: 'settings.regionCA',
  AU: 'settings.regionAU',
  IN: 'settings.regionIN',
  APAC: 'settings.regionAPAC',
  ME: 'settings.regionME',
};
const CURRENCY_KEYS = {
  USD: 'settings.currencyUSD',
  EUR: 'settings.currencyEUR',
  GBP: 'settings.currencyGBP',
  INR: 'settings.currencyINR',
  CAD: 'settings.currencyCAD',
  AUD: 'settings.currencyAUD',
};
const LOCALE_KEYS = {
  'en-US': 'settings.localeEnUS',
  'es-ES': 'settings.localeEsES',
  'ar-SA': 'settings.localeArSA',
};
const TIMEZONE_KEYS = {
  'America/New_York': 'settings.timezoneAmericaNewYork',
  'America/Chicago': 'settings.timezoneAmericaChicago',
  'America/Denver': 'settings.timezoneAmericaDenver',
  'America/Los_Angeles': 'settings.timezoneAmericaLosAngeles',
  'America/Toronto': 'settings.timezoneAmericaToronto',
  'Europe/London': 'settings.timezoneEuropeLondon',
  'Europe/Paris': 'settings.timezoneEuropeParis',
  'Asia/Kolkata': 'settings.timezoneAsiaKolkata',
  'Australia/Sydney': 'settings.timezoneAustraliaSydney',
};

/** Same as item name: transliterate to Arabic, translate to Spanish (word-by-word) for display */
function getDisplayValue(str, localeCode) {
  if (str == null || String(str).trim() === '') return '';
  const s = String(str).trim();
  if (localeCode === 'ar') return transliterateToArabic(s) || s;
  if (localeCode === 'es') return s.split(/\s+/).map((w) => translateToSpanish(w) || w).join(' ').trim() || s;
  return s;
}

export function GeneralSettingsTab({
  isClinicAdmin,
  clinicForm,
  setClinicForm,
  saving,
  onSave,
  onCancel,
}) {
  const { user } = useAuth();
  const { t, locale } = useI18n();
  const localeCode = (locale || 'en').toString().slice(0, 2);
  const isSuperAdmin = user?.role === 'super_admin';

  const getRegionLabel = useCallback(
    (code) => ((code && REGION_KEYS[code]) ? t(REGION_KEYS[code]) : (code || '—')),
    [t],
  );
  const getCurrencyLabel = useCallback(
    (code) => ((code && CURRENCY_KEYS[code]) ? t(CURRENCY_KEYS[code]) : (code || '—')),
    [t],
  );
  const getLocaleLabel = useCallback(
    (code) => ((code && LOCALE_KEYS[code]) ? t(LOCALE_KEYS[code]) : (code || '—')),
    [t],
  );
  const getTimezoneLabel = useCallback(
    (code) => ((code && TIMEZONE_KEYS[code]) ? t(TIMEZONE_KEYS[code]) : (code || '—')),
    [t],
  );

  const normalizedRegion = REGION_KEYS[(clinicForm.region || '').toUpperCase()]
    ? (clinicForm.region || '').toUpperCase()
    : 'US';
  const normalizedCurrency = CURRENCY_KEYS[(clinicForm.currency || '').toUpperCase()]
    ? (clinicForm.currency || '').toUpperCase()
    : 'USD';
  const normalizedLocale = LOCALE_KEYS[clinicForm.locale] ? clinicForm.locale : 'en-US';
  const normalizedTimezone = TIMEZONE_KEYS[clinicForm.timezone]
    ? clinicForm.timezone
    : 'America/New_York';

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
    <div className='w-full max-w-4xl space-y-6 text-left' key={locale}>
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
                  value={getDisplayValue(clinicForm.name, localeCode)}
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
                  value={normalizedRegion}
                  onChange={(e) => setClinicForm({ ...clinicForm, region: e.target.value })}
                  className='w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-neutral-900 text-sm'
                  required
                >
                  <option value='US'>{getRegionLabel('US')}</option>
                  <option value='EU'>{getRegionLabel('EU')}</option>
                  <option value='CA'>{getRegionLabel('CA')}</option>
                  <option value='AU'>{getRegionLabel('AU')}</option>
                  <option value='IN'>{getRegionLabel('IN')}</option>
                  <option value='APAC'>{getRegionLabel('APAC')}</option>
                  <option value='ME'>{getRegionLabel('ME')}</option>
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
                <label className='block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5'>
                  {t('settings.currency')} <span className='text-red-500'>*</span>
                </label>
                <select
                  value={normalizedCurrency}
                  onChange={(e) => setClinicForm({ ...clinicForm, currency: e.target.value })}
                  className='w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-neutral-900 text-sm'
                  required
                >
                  <option value='USD'>
                    {getDisplayValue(getCurrencyLabel('USD'), localeCode)}
                  </option>
                  <option value='EUR'>
                    {getDisplayValue(getCurrencyLabel('EUR'), localeCode)}
                  </option>
                  <option value='GBP'>
                    {getDisplayValue(getCurrencyLabel('GBP'), localeCode)}
                  </option>
                  <option value='INR'>
                    {getDisplayValue(getCurrencyLabel('INR'), localeCode)}
                  </option>
                  <option value='CAD'>
                    {getDisplayValue(getCurrencyLabel('CAD'), localeCode)}
                  </option>
                  <option value='AUD'>
                    {getDisplayValue(getCurrencyLabel('AUD'), localeCode)}
                  </option>
                </select>
                <p className='text-xs text-neutral-500 dark:text-neutral-400 mt-1'>{t('settings.forBillingInvoices')}</p>
              </div>

              {!isSuperAdmin && (
                <div>
                  <label className='block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5'>
                    {t('settings.locale')} <span className='text-red-500'>*</span>
                  </label>
                  <select
                    value={normalizedLocale}
                    onChange={(e) => setClinicForm({ ...clinicForm, locale: e.target.value })}
                    className='w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-neutral-900 text-sm'
                    required
                  >
                    <option value='en-US'>
                      {getDisplayValue(getLocaleLabel('en-US'), localeCode)}
                    </option>
                    <option value='es-ES'>
                      {getDisplayValue(getLocaleLabel('es-ES'), localeCode)}
                    </option>
                    <option value='ar-SA'>
                      {getDisplayValue(getLocaleLabel('ar-SA'), localeCode)}
                    </option>
                  </select>
                  <p className='text-xs text-neutral-500 dark:text-neutral-400 mt-1'>
                    {t('settings.languageAndDateFormat')}
                  </p>
                </div>
              )}

              <div className='md:col-span-2'>
                <label className='block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5'>
                  {t('settings.timezone')} <span className='text-red-500'>*</span>
                </label>
                <select
                  value={normalizedTimezone}
                  onChange={(e) => setClinicForm({ ...clinicForm, timezone: e.target.value })}
                  className='w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-neutral-900 text-sm'
                  required
                >
                  <option value='America/New_York'>
                    {getDisplayValue(getTimezoneLabel('America/New_York'), localeCode)}
                  </option>
                  <option value='America/Chicago'>
                    {getDisplayValue(getTimezoneLabel('America/Chicago'), localeCode)}
                  </option>
                  <option value='America/Denver'>
                    {getDisplayValue(getTimezoneLabel('America/Denver'), localeCode)}
                  </option>
                  <option value='America/Los_Angeles'>
                    {getDisplayValue(getTimezoneLabel('America/Los_Angeles'), localeCode)}
                  </option>
                  <option value='America/Toronto'>
                    {getDisplayValue(getTimezoneLabel('America/Toronto'), localeCode)}
                  </option>
                  <option value='Europe/London'>
                    {getDisplayValue(getTimezoneLabel('Europe/London'), localeCode)}
                  </option>
                  <option value='Europe/Paris'>
                    {getDisplayValue(getTimezoneLabel('Europe/Paris'), localeCode)}
                  </option>
                  <option value='Asia/Kolkata'>
                    {getDisplayValue(getTimezoneLabel('Asia/Kolkata'), localeCode)}
                  </option>
                  <option value='Australia/Sydney'>
                    {getDisplayValue(getTimezoneLabel('Australia/Sydney'), localeCode)}
                  </option>
                </select>
                <p className='text-xs text-neutral-500 dark:text-neutral-400 mt-1'>
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
                  value={getDisplayValue(clinicForm.logo || '', localeCode)}
                  onChange={(e) => setClinicForm({ ...clinicForm, logo: e.target.value })}
                  placeholder={t('settings.urlPlaceholder')}
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-1.5'>
                  {t('settings.clinicPhone')}
                </label>
                <Input
                  value={getDisplayValue(clinicForm.phone || '', localeCode)}
                  onChange={(e) => setClinicForm({ ...clinicForm, phone: e.target.value })}
                  placeholder={t('settings.clinicPhonePlaceholder')}
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-1.5'>
                  {t('settings.addressStreet')}
                </label>
                <Input
                  value={getDisplayValue(clinicForm.address?.street || '', localeCode)}
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
                  value={getDisplayValue(clinicForm.address?.city || '', localeCode)}
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
                  value={getDisplayValue(clinicForm.address?.state || '', localeCode)}
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
                  value={getDisplayValue(clinicForm.address?.zipCode || '', localeCode)}
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
                  value={getDisplayValue(clinicForm.address?.country || '', localeCode)}
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
                  value={getDisplayValue(clinicForm.taxId || '', localeCode)}
                  onChange={(e) => setClinicForm({ ...clinicForm, taxId: e.target.value })}
                  placeholder={t('settings.receiptTaxIdPlaceholder')}
                />
              </div>
              <div className='md:col-span-2'>
                <label className='block text-sm font-medium text-neutral-700 mb-1.5'>
                  {t('settings.receiptFooter')}
                </label>
                <Input
                  value={getDisplayValue(clinicForm.receiptFooter || '', localeCode)}
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
