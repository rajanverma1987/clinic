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
    <div className='space-y-4 text-left'>
      <SettingsTabHeader title={t('settings.emailSettings') || 'Email Settings'} />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave();
        }}
        className='space-y-4'
      >
        {/* Enable Toggle */}
        <Card>
          <div className='p-5'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-3 flex-1'>
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
                      d='M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'
                    />
                  </svg>
                </div>
                <div className='flex-1'>
                  <h2 className='text-lg font-bold text-neutral-900 mb-0.5'>
                    {t('settings.enableClinicSmpt')}
                  </h2>
                  <p className='text-xs text-neutral-600'>
                    {t('settings.enableClinicSmptDesc')}
                  </p>
                </div>
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
            {/* Server Configuration */}
            <Card>
              <div className='p-5'>
                <div className='flex items-center gap-2 mb-4'>
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
                        d='M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01'
                      />
                    </svg>
                  </div>
                  <h2 className='text-lg font-bold text-neutral-900'>{t('settings.serverConfiguration')}</h2>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-neutral-700 mb-1.5'>
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
                    <label className='block text-sm font-medium text-neutral-700 mb-1.5'>
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

                <div className='mt-4 flex items-center justify-between p-3 border border-neutral-200 rounded-lg'>
                  <div className='flex-1'>
                    <h3 className='font-semibold text-neutral-900 text-sm mb-0.5'>{t('settings.useSslTls')}</h3>
                    <p className='text-xs text-neutral-600'>
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

            {/* Authentication */}
            <Card>
              <div className='p-5'>
                <div className='flex items-center gap-2 mb-4'>
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
                        d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
                      />
                    </svg>
                  </div>
                  <h2 className='text-lg font-bold text-neutral-900'>{t('settings.authentication')}</h2>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-neutral-700 mb-1.5'>
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
                    <label className='block text-sm font-medium text-neutral-700 mb-1.5'>
                      {t('settings.smtpPasswordLabel')}{' '}
                      {smtpForm.password ? t('settings.smtpPasswordChange') : t('settings.smtpPasswordLeaveBlank')}
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

            {/* Email Settings */}
            <Card>
              <div className='p-5'>
                <div className='flex items-center gap-2 mb-4'>
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
                        d='M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
                      />
                    </svg>
                  </div>
                  <h2 className='text-lg font-bold text-neutral-900'>{t('settings.emailSettings')}</h2>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-neutral-700 mb-1.5'>
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
                    <label className='block text-sm font-medium text-neutral-700 mb-1.5'>
                      {t('settings.fromName')}
                    </label>
                    <Input
                      value={smtpForm.fromName}
                      onChange={(e) => setSmtpForm({ ...smtpForm, fromName: e.target.value })}
                      placeholder={t('settings.smtpFromNamePlaceholder')}
                    />
                  </div>
                </div>

                <div className='mt-4 flex items-center justify-between p-3 border border-neutral-200 rounded-lg'>
                  <div className='flex-1'>
                    <h3 className='font-semibold text-neutral-900 text-sm mb-0.5'>
                      {t('settings.rejectUnauthorizedSsl')}
                    </h3>
                    <p className='text-xs text-neutral-600'>
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

            {/* Common Providers */}
            <Card>
              <div className='p-5'>
                <div className='flex items-center gap-2 mb-4'>
                  <div className='w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center'>
                    <svg
                      className='icon icon-xs text-amber-600'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                      />
                    </svg>
                  </div>
                  <h2 className='text-lg font-bold text-neutral-900'>{t('settings.commonSmtpProviders')}</h2>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                  {[
                    { nameKey: 'settings.smtpProviderGmail', configKey: 'settings.smtpProviderGmailConfig' },
                    { nameKey: 'settings.smtpProviderOutlook', configKey: 'settings.smtpProviderOutlookConfig' },
                    { nameKey: 'settings.smtpProviderSendGrid', configKey: 'settings.smtpProviderSendGridConfig' },
                    { nameKey: 'settings.smtpProviderAws', configKey: 'settings.smtpProviderAwsConfig' },
                  ].map((provider) => (
                    <div
                      key={provider.nameKey}
                      className='p-2.5 bg-amber-50 border border-amber-200 rounded-lg'
                    >
                      <h4 className='font-semibold text-amber-900 mb-0.5 text-xs'>
                        {t(provider.nameKey)}
                      </h4>
                      <p className='text-xs text-amber-700'>{t(provider.configKey)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </>
        )}

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
