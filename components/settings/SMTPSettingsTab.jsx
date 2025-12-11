'use client';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Toggle } from '@/components/ui/Toggle';

export function SMTPSettingsTab({ smtpForm, setSmtpForm, saving, onSave }) {
  return (
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
                  className='w-4 h-4 text-primary-600'
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
                  Enable Clinic-Specific SMTP Settings
                </h2>
                <p className='text-xs text-neutral-600'>
                  Use custom SMTP configuration for this clinic instead of platform defaults
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
                    className='w-4 h-4 text-primary-600'
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
                <h2 className='text-lg font-bold text-neutral-900'>Server Configuration</h2>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-neutral-700 mb-1.5'>
                    SMTP Host <span className='text-red-500'>*</span>
                  </label>
                  <Input
                    value={smtpForm.host}
                    onChange={(e) => setSmtpForm({ ...smtpForm, host: e.target.value })}
                    placeholder='e.g., smtp.gmail.com'
                    required
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-neutral-700 mb-1.5'>
                    SMTP Port <span className='text-red-500'>*</span>
                  </label>
                  <Input
                    type='number'
                    value={smtpForm.port}
                    onChange={(e) =>
                      setSmtpForm({ ...smtpForm, port: parseInt(e.target.value) || 587 })
                    }
                    placeholder='587'
                    required
                  />
                </div>
              </div>

              <div className='mt-4 flex items-center justify-between p-3 border border-neutral-200 rounded-lg'>
                <div className='flex-1'>
                  <h3 className='font-semibold text-neutral-900 text-sm mb-0.5'>Use SSL/TLS</h3>
                  <p className='text-xs text-neutral-600'>
                    Enable SSL/TLS encryption (usually required for port 465)
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
                    className='w-4 h-4 text-primary-600'
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
                <h2 className='text-lg font-bold text-neutral-900'>Authentication</h2>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-neutral-700 mb-1.5'>
                    SMTP Username <span className='text-red-500'>*</span>
                  </label>
                  <Input
                    value={smtpForm.user}
                    onChange={(e) => setSmtpForm({ ...smtpForm, user: e.target.value })}
                    placeholder='your-email@gmail.com'
                    required
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-neutral-700 mb-1.5'>
                    SMTP Password{' '}
                    {smtpForm.password ? '(change)' : '(leave blank to keep existing)'}
                  </label>
                  <Input
                    type='password'
                    value={smtpForm.password}
                    onChange={(e) => setSmtpForm({ ...smtpForm, password: e.target.value })}
                    placeholder='Enter new password or leave blank'
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
                    className='w-4 h-4 text-primary-600'
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
                <h2 className='text-lg font-bold text-neutral-900'>Email Settings</h2>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-neutral-700 mb-1.5'>
                    From Email Address <span className='text-red-500'>*</span>
                  </label>
                  <Input
                    type='email'
                    value={smtpForm.fromEmail}
                    onChange={(e) => setSmtpForm({ ...smtpForm, fromEmail: e.target.value })}
                    placeholder='noreply@yourclinic.com'
                    required
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-neutral-700 mb-1.5'>
                    From Name
                  </label>
                  <Input
                    value={smtpForm.fromName}
                    onChange={(e) => setSmtpForm({ ...smtpForm, fromName: e.target.value })}
                    placeholder='Your Clinic Name'
                  />
                </div>
              </div>

              <div className='mt-4 flex items-center justify-between p-3 border border-neutral-200 rounded-lg'>
                <div className='flex-1'>
                  <h3 className='font-semibold text-neutral-900 text-sm mb-0.5'>
                    Reject Unauthorized SSL Certificates
                  </h3>
                  <p className='text-xs text-neutral-600'>
                    Reject SSL certificates that cannot be verified (recommended: enabled)
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
                    className='w-4 h-4 text-amber-600'
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
                <h2 className='text-lg font-bold text-neutral-900'>Common SMTP Providers</h2>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                {[
                  { name: 'Gmail', config: 'smtp.gmail.com, Port 587, Use App Password' },
                  { name: 'Outlook', config: 'smtp.office365.com, Port 587' },
                  { name: 'SendGrid', config: 'smtp.sendgrid.net, Port 587, Username: apikey' },
                  { name: 'AWS SES', config: 'email-smtp.region.amazonaws.com, Port 587' },
                ].map((provider) => (
                  <div
                    key={provider.name}
                    className='p-2.5 bg-amber-50 border border-amber-200 rounded-lg'
                  >
                    <h4 className='font-semibold text-amber-900 mb-0.5 text-xs'>{provider.name}</h4>
                    <p className='text-xs text-amber-700'>{provider.config}</p>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </>
      )}

      {/* Action Buttons */}
      <div className='flex justify-end gap-3 pt-2'>
        <Button
          type='submit'
          isLoading={saving}
          disabled={smtpForm.enabled && (!smtpForm.host || !smtpForm.user || !smtpForm.fromEmail)}
        >
          Save Changes
        </Button>
      </div>
    </form>
  );
}
