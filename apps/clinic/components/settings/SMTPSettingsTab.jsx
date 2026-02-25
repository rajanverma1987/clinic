'use client';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Toggle } from '@/components/ui/Toggle';
import { useI18n } from '@/contexts/I18nContext';
import { SettingsTabHeader } from './SettingsTabHeader';

export function SMTPSettingsTab({ smtpForm, setSmtpForm, saving, onSave, onCancel }) {
  const { t } = useI18n();
  return (
    <div className='w-full max-w-4xl space-y-6 text-left'>
      <SettingsTabHeader title={t('settings.emailSettings')} />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave();
        }}
        className='space-y-6'
      >
        <Card>
          <div className='p-5'>
            <div className='flex items-center justify-between'>
              <div className='flex-1'>
                <h3 className='text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-0.5'>
                  {t('settings.enableClinicSmpt')}
                </h3>
                <p className='text-xs text-neutral-600 dark:text-neutral-400'>
                  {t('settings.enableClinicSmptDesc')}
                </p>
              </div>
              <Toggle
                checked={smtpForm.enabled}
                onChange={(e) => setSmtpForm({ ...smtpForm, enabled: e.target.checked })}
              />
            </div>
          </div>
        </Card>

        {smtpForm.enabled && (
          <>
            <Card>
              <div className='p-5'>
                <h3 className='text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4'>
                  {t('settings.serverConfiguration')}
                </h3>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5'>
                      {t('settings.smtpHostLabel')} <span className='text-red-500'>*</span>
                    </label>
                    <Input
                      value={smtpForm.host}
                      onChange={(e) => setSmtpForm({ ...smtpForm, host: e.target.value })}
                      placeholder={t('settings.smtpHostPlaceholder')}
                      required
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5'>
                      {t('settings.smtpPortLabel')} <span className='text-red-500'>*</span>
                    </label>
                    <Input
                      type='number'
                      value={smtpForm.port}
                      onChange={(e) =>
                        setSmtpForm({ ...smtpForm, port: parseInt(e.target.value) || 587 })
                      }
                      placeholder={t('settings.smtpPortPlaceholder')}
                      required
                    />
                  </div>
                </div>

                <div className='mt-4 flex items-center justify-between p-3 border border-neutral-200 dark:border-neutral-600 rounded-lg'>
                  <div className='flex-1'>
                    <h3 className='font-semibold text-neutral-900 dark:text-neutral-100 text-sm mb-0.5'>
                      {t('settings.useSslTls')}
                    </h3>
                    <p className='text-xs text-neutral-600 dark:text-neutral-400'>
                      {t('settings.useSslTlsDesc')}
                    </p>
                  </div>
                  <Toggle
                    checked={smtpForm.secure}
                    onChange={(e) => setSmtpForm({ ...smtpForm, secure: e.target.checked })}
                  />
                </div>
              </div>
            </Card>

            <Card>
              <div className='p-5'>
                <h3 className='text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4'>
                  {t('settings.authentication')}
                </h3>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5'>
                      {t('settings.smtpUsername')} <span className='text-red-500'>*</span>
                    </label>
                    <Input
                      value={smtpForm.user}
                      onChange={(e) => setSmtpForm({ ...smtpForm, user: e.target.value })}
                      placeholder={t('settings.smtpUserPlaceholder')}
                      required
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5'>
                      {t('settings.smtpPasswordLabel')}{' '}
                      {smtpForm.password
                        ? t('settings.smtpPasswordChange')
                        : t('settings.smtpPasswordLeaveBlank')}
                    </label>
                    <Input
                      type='password'
                      value={smtpForm.password}
                      onChange={(e) => setSmtpForm({ ...smtpForm, password: e.target.value })}
                      placeholder={t('settings.smtpPasswordPlaceholder')}
                    />
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div className='p-5'>
                <h3 className='text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4'>
                  {t('settings.emailSettings')}
                </h3>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5'>
                      {t('settings.fromEmailAddress')} <span className='text-red-500'>*</span>
                    </label>
                    <Input
                      type='email'
                      value={smtpForm.fromEmail}
                      onChange={(e) => setSmtpForm({ ...smtpForm, fromEmail: e.target.value })}
                      placeholder={t('settings.smtpFromPlaceholder')}
                      required
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5'>
                      {t('settings.fromName')}
                    </label>
                    <Input
                      value={smtpForm.fromName}
                      onChange={(e) => setSmtpForm({ ...smtpForm, fromName: e.target.value })}
                      placeholder={t('settings.smtpFromNamePlaceholder')}
                    />
                  </div>
                </div>

                <div className='mt-4 flex items-center justify-between p-3 border border-neutral-200 dark:border-neutral-600 rounded-lg'>
                  <div className='flex-1'>
                    <h3 className='font-semibold text-neutral-900 dark:text-neutral-100 text-sm mb-0.5'>
                      {t('settings.rejectUnauthorizedSsl')}
                    </h3>
                    <p className='text-xs text-neutral-600 dark:text-neutral-400'>
                      {t('settings.rejectUnauthorizedSslDesc')}
                    </p>
                  </div>
                  <Toggle
                    checked={smtpForm.rejectUnauthorized}
                    onChange={(e) =>
                      setSmtpForm({ ...smtpForm, rejectUnauthorized: e.target.checked })
                    }
                  />
                </div>
              </div>
            </Card>

            <Card>
              <div className='p-5'>
                <h3 className='text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4'>
                  {t('settings.commonSmtpProviders')}
                </h3>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                  {[
                    {
                      nameKey: 'settings.smtpProviderGmail',
                      configKey: 'settings.smtpProviderGmailConfig',
                    },
                    {
                      nameKey: 'settings.smtpProviderOutlook',
                      configKey: 'settings.smtpProviderOutlookConfig',
                    },
                    {
                      nameKey: 'settings.smtpProviderSendGrid',
                      configKey: 'settings.smtpProviderSendGridConfig',
                    },
                    {
                      nameKey: 'settings.smtpProviderAws',
                      configKey: 'settings.smtpProviderAwsConfig',
                    },
                  ].map((provider) => (
                    <div
                      key={provider.nameKey}
                      className='p-2.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg'
                    >
                      <h4 className='font-semibold text-amber-900 dark:text-amber-200 mb-0.5 text-xs'>
                        {t(provider.nameKey)}
                      </h4>
                      <p className='text-xs text-amber-700 dark:text-amber-300'>
                        {t(provider.configKey)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </>
        )}

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
