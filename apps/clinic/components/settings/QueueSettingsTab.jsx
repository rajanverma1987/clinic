'use client';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Toggle } from '@/components/ui/Toggle';
import { useI18n } from '@/contexts/I18nContext';
import { SettingsTabHeader } from './SettingsTabHeader';

export function QueueSettingsTab({ queueForm, setQueueForm, saving, onSave, onCancel }) {
  const { t } = useI18n();
  return (
    <div className='w-full max-w-4xl space-y-6 text-left'>
      <SettingsTabHeader title={t('settings.queueSettings')} />
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
              {t('settings.queueConfiguration')}
            </h3>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <div>
                <label className='block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5'>
                  {t('settings.displayOrder')} <span className='text-red-500'>*</span>
                </label>
                <select
                  value={queueForm.displayOrder}
                  onChange={(e) => setQueueForm({ ...queueForm, displayOrder: e.target.value })}
                  className='w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm'
                  required
                >
                  <option value='priority'>{t('settings.displayOrderPriority')}</option>
                  <option value='fifo'>{t('settings.displayOrderFifo')}</option>
                  <option value='appointment_time'>
                    {t('settings.displayOrderAppointmentTime')}
                  </option>
                </select>
              </div>

              <div>
                <label className='block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5'>
                  {t('settings.avgConsultationTime')} <span className='text-red-500'>*</span>
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
                  placeholder={t('settings.queueEstWaitPlaceholder')}
                  required
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5'>
                  {t('settings.maxQueueLength')}
                </label>
                <Input
                  type='number'
                  min='1'
                  value={queueForm.maxQueueLength}
                  onChange={(e) =>
                    setQueueForm({ ...queueForm, maxQueueLength: parseInt(e.target.value) || 50 })
                  }
                  placeholder={t('settings.queueMaxPatientsPlaceholder')}
                />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className='p-5'>
            <h3 className='text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4'>
              {t('settings.displayOptions')}
            </h3>
            <div className='space-y-2'>
              {[
                {
                  key: 'enablePublicDisplay',
                  titleKey: 'settings.enablePublicQueueDisplay',
                  descKey: 'settings.enablePublicQueueDisplayDesc',
                },
                {
                  key: 'showEstimatedWaitTime',
                  titleKey: 'settings.showEstimatedWaitTime',
                  descKey: 'settings.showEstimatedWaitTimeDesc',
                },
                {
                  key: 'autoCallNext',
                  titleKey: 'settings.autoCallNext',
                  descKey: 'settings.autoCallNextDesc',
                },
              ].map((item) => (
                <div
                  key={item.key}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                    queueForm[item.key]
                      ? 'border-primary-300 bg-primary-50/50 dark:bg-primary-900/20 dark:border-primary-700'
                      : 'border-neutral-200 bg-white hover:border-neutral-300 dark:bg-neutral-800/50 dark:border-neutral-600 dark:hover:border-neutral-500'
                  }`}
                >
                  <div className='flex-1'>
                    <h3 className='font-semibold text-neutral-900 dark:text-neutral-100 text-sm mb-0.5'>
                      {t(item.titleKey)}
                    </h3>
                    <p className='text-xs text-neutral-600 dark:text-neutral-400'>
                      {t(item.descKey)}
                    </p>
                  </div>
                  <Toggle
                    checked={queueForm[item.key]}
                    onChange={(e) => setQueueForm({ ...queueForm, [item.key]: e.target.checked })}
                  />
                </div>
              ))}
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
