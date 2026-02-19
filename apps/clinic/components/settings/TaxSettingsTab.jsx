'use client';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useI18n } from '@/contexts/I18nContext';
import { SettingsTabHeader } from './SettingsTabHeader';

export function TaxSettingsTab({ taxForm, setTaxForm, saving, onSave, onCancel }) {
  const { t } = useI18n();
  return (
    <div className='w-full max-w-4xl space-y-6 text-left'>
      <SettingsTabHeader title={t('settings.taxSettings')} />
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
              {t('settings.taxInformation')}
            </h3>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <div>
                <label className='block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5'>
                  {t('settings.country')}
                </label>
                <Input
                  value={taxForm.country}
                  onChange={(e) => setTaxForm({ ...taxForm, country: e.target.value })}
                  placeholder={t('settings.countryPlaceholder')}
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5'>
                  {t('settings.taxType')} <span className='text-red-500'>*</span>
                </label>
                <select
                  value={taxForm.taxType}
                  onChange={(e) => setTaxForm({ ...taxForm, taxType: e.target.value })}
                  className='w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm'
                  required
                >
                  <option value='SALES_TAX'>{t('admin.taxTypeSalesTax')}</option>
                  <option value='GST'>{t('admin.taxTypeGst')}</option>
                  <option value='VAT'>{t('admin.taxTypeVat')}</option>
                </select>
              </div>

              <div>
                <label className='block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5'>
                  {t('settings.taxRate')} <span className='text-red-500'>*</span>
                </label>
                <Input
                  type='number'
                  min='0'
                  max='100'
                  step='0.01'
                  value={taxForm.rate}
                  onChange={(e) =>
                    setTaxForm({ ...taxForm, rate: parseFloat(e.target.value) || 0 })
                  }
                  placeholder={t('settings.taxRatePlaceholder')}
                  required
                />
              </div>
            </div>

            <div className='mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg'>
              <p className='text-xs text-blue-800 dark:text-blue-200'>
                <strong>{t('common.note')}:</strong> {t('settings.taxNote')}
              </p>
            </div>
          </div>
        </Card>

        <div className='flex justify-end gap-2 pt-4'>
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
