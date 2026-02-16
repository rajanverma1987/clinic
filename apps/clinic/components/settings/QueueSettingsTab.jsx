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
    <div className='space-y-4 text-left'>
      <SettingsTabHeader title={t('settings.queueSettings')} />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave();
        }}
        className='space-y-4'
      >
        {/* Queue Configuration */}
        <Card>
          <div className='p-5'>
            <div className='flex items-center gap-2 mb-5'>
              <div className='w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center'>
                <svg
                  className='icon icon-xs text-primary-600'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4'
                  />
                </svg>
              </div>
              <h2 className='text-lg font-bold text-neutral-900'>{t('settings.queueConfiguration')}</h2>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-1.5'>
                  {t('settings.displayOrder')} <span className='text-red-500'>*</span>
                </label>
                <select
                  value={queueForm.displayOrder}
                  onChange={(e) => setQueueForm({ ...queueForm, displayOrder: e.target.value })}
                  className='w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-neutral-900 text-sm'
                  required
                >
                  <option value='priority'>{t('settings.displayOrderPriority')}</option>
                  <option value='fifo'>{t('settings.displayOrderFifo')}</option>
                  <option value='appointment_time'>{t('settings.displayOrderAppointmentTime')}</option>
                </select>
              </div>

              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-1.5'>
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
                <label className='block text-sm font-medium text-neutral-700 mb-1.5'>
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

        {/* Display Options */}
        <Card>
          <div className='p-5'>
            <div className='flex items-center gap-2 mb-5'>
              <div className='w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center'>
                <svg
                  className='icon icon-xs text-primary-600'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
                  />
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'
                  />
                </svg>
              </div>
              <h2 className='text-lg font-bold text-neutral-900'>{t('settings.displayOptions')}</h2>
            </div>

            <div className='space-y-2'>
              {[
                { key: 'enablePublicDisplay', titleKey: 'settings.enablePublicQueueDisplay', descKey: 'settings.enablePublicQueueDisplayDesc' },
                { key: 'showEstimatedWaitTime', titleKey: 'settings.showEstimatedWaitTime', descKey: 'settings.showEstimatedWaitTimeDesc' },
                { key: 'autoCallNext', titleKey: 'settings.autoCallNext', descKey: 'settings.autoCallNextDesc' },
              ].map((item) => (
                <div
                  key={item.key}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                    queueForm[item.key]
                      ? 'border-primary-300 bg-primary-50/50'
                      : 'border-neutral-200 bg-white hover:border-neutral-300'
                  }`}
                >
                  <div className='flex-1'>
                    <h3 className='font-semibold text-neutral-900 text-sm mb-0.5'>{t(item.titleKey)}</h3>
                    <p className='text-xs text-neutral-600'>{t(item.descKey)}</p>
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

        <div className='flex justify-end gap-3 pt-4'>
          {onCancel && (
            <Button type='button' variant='secondary' onClick={onCancel} disabled={saving}>
              {t('common.cancel')}
            </Button>
          )}
          <Button type='submit' variant='primary' isLoading={saving} disabled={saving}>
            {t('common.save')}
          </Button>
        </div>
      </form>
    </div>
  );
}
