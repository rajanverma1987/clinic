'use client';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Toggle } from '@/components/ui/Toggle';
import { useI18n } from '@/contexts/I18nContext';
import { SettingsTabHeader } from './SettingsTabHeader';

export function ComplianceTab({
  isClinicAdmin,
  complianceForm,
  setComplianceForm,
  saving,
  onSave,
  onCancel,
}) {
  const { t } = useI18n();

  if (!isClinicAdmin) {
    return (
      <div className='w-full max-w-4xl space-y-6 text-left'>
        <SettingsTabHeader title={t('settings.compliance')} />
        <Card>
          <div className='p-6 text-center'>
            <h3 className='text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-1'>
              {t('settings.accessRestricted')}
            </h3>
            <p className='text-sm text-neutral-600 dark:text-neutral-400'>
              {t('settings.onlyClinicAdminCompliance')}
            </p>
          </div>
        </Card>
      </div>
    );
  }

  const complianceOptions = [
    {
      key: 'hipaa',
      titleKey: 'settings.hipaaTitle',
      regionKey: 'settings.hipaaRegion',
      descKey: 'settings.hipaaDesc',
    },
    {
      key: 'gdpr',
      titleKey: 'settings.gdprTitle',
      regionKey: 'settings.gdprRegion',
      descKey: 'settings.gdprDesc',
    },
    {
      key: 'pipeda',
      titleKey: 'settings.pipedaTitle',
      regionKey: 'settings.pipedaRegion',
      descKey: 'settings.pipedaDesc',
    },
    {
      key: 'privacyAct',
      titleKey: 'settings.privacyActTitle',
      regionKey: 'settings.privacyActRegion',
      descKey: 'settings.privacyActDesc',
    },
  ];

  return (
    <div className='w-full max-w-4xl space-y-6 text-left'>
      <SettingsTabHeader title={t('settings.compliance')} />
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
              {t('settings.complianceStandards')}
            </h3>
            <div className='space-y-2'>
              {complianceOptions.map((option) => (
                <div
                  key={option.key}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                    complianceForm[option.key]
                      ? 'border-primary-300 bg-primary-50/50 dark:bg-primary-900/20 dark:border-primary-700'
                      : 'border-neutral-200 bg-white hover:border-neutral-300 dark:bg-neutral-800/50 dark:border-neutral-600 dark:hover:border-neutral-500'
                  }`}
                >
                  <div className='flex items-start gap-3 flex-1'>
                    <div className='flex-1'>
                      <div className='flex items-center gap-2 mb-0.5'>
                        <h3 className='font-semibold text-neutral-900 dark:text-neutral-100 text-sm'>
                          {t(option.titleKey)}
                        </h3>
                        <span className='px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400 text-xs rounded'>
                          {t(option.regionKey)}
                        </span>
                      </div>
                      <p className='text-xs text-neutral-600 dark:text-neutral-400'>
                        {t(option.descKey)}
                      </p>
                    </div>
                  </div>
                  <Toggle
                    checked={complianceForm[option.key]}
                    onChange={(e) =>
                      setComplianceForm({ ...complianceForm, [option.key]: e.target.checked })
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <div className='p-5'>
            <h3 className='text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4'>
              {t('settings.dataRetention')}
            </h3>
            <div>
              <label className='block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5'>
                {t('settings.dataRetentionYears')} <span className='text-red-500'>*</span>
              </label>
              <Input
                type='number'
                min='1'
                max='30'
                value={complianceForm.dataRetentionYears}
                onChange={(e) =>
                  setComplianceForm({
                    ...complianceForm,
                    dataRetentionYears: parseInt(e.target.value) || 7,
                  })
                }
                placeholder={t('settings.complianceValidityPlaceholder')}
                required
                className='max-w-xs'
              />
              <div className='mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg'>
                <p className='text-xs text-amber-800 dark:text-amber-200'>
                  <strong>{t('common.note')}:</strong> {t('settings.dataRetentionNote')}
                </p>
              </div>
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
