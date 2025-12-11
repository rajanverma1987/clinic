'use client';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

export function SMTPSettingsTab({ smtpForm, setSmtpForm, saving, onSave }) {
  return (
    <Card elevated={true}>
      <div className='mb-8'>
        <h2
          className='text-neutral-900 mb-2'
          style={{
            fontSize: '28px',
            lineHeight: '36px',
            letterSpacing: '-0.02em',
            fontWeight: '700',
          }}
        >
          Email (SMTP) Configuration
        </h2>
        <p
          className='text-neutral-600'
          style={{
            fontSize: '16px',
            lineHeight: '24px',
            fontWeight: '400',
          }}
        >
          Configure SMTP settings for sending emails
        </p>
      </div>
      <div className='space-y-8'>
        <div className='bg-primary-50 border border-primary-200 rounded-xl p-5'>
          <div className='flex items-start gap-3'>
            <svg
              className='w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0'
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
            <p className='text-primary-700' style={{ fontSize: '14px', lineHeight: '20px' }}>
              <strong>Note:</strong> Configure clinic-specific SMTP settings here. If not
              configured, the system will use Platform email settings.
            </p>
          </div>
        </div>

        <div className='flex items-center p-4 bg-neutral-50 rounded-lg border border-neutral-200 hover:border-primary-300 hover:bg-primary-50/30 cursor-pointer'>
          <input
            type='checkbox'
            checked={smtpForm.enabled}
            onChange={(e) => setSmtpForm({ ...smtpForm, enabled: e.target.checked })}
            className='w-5 h-5 rounded border-neutral-300 text-primary-500 focus:ring-primary-500 focus:ring-2'
          />
          <label
            className='ml-3 text-neutral-700 font-medium'
            style={{ fontSize: '14px', lineHeight: '20px' }}
          >
            Enable Clinic-Specific SMTP Settings
          </label>
        </div>

        {smtpForm.enabled && (
          <>
            <div className='pt-6 border-t border-neutral-200'>
              <h3
                className='text-neutral-900 mb-4'
                style={{
                  fontSize: '18px',
                  lineHeight: '24px',
                  fontWeight: '600',
                }}
              >
                Server Configuration
              </h3>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div>
                  <label
                    className='block text-neutral-700 font-semibold mb-2'
                    style={{ fontSize: '14px', lineHeight: '20px' }}
                  >
                    SMTP Host *
                  </label>
                  <Input
                    value={smtpForm.host}
                    onChange={(e) => setSmtpForm({ ...smtpForm, host: e.target.value })}
                    placeholder='e.g., smtp.gmail.com'
                    required
                  />
                  <p
                    className='text-neutral-600 mt-2'
                    style={{ fontSize: '13px', lineHeight: '18px' }}
                  >
                    SMTP server hostname
                  </p>
                </div>

                <div>
                  <label
                    className='block text-neutral-700 font-semibold mb-2'
                    style={{ fontSize: '14px', lineHeight: '20px' }}
                  >
                    SMTP Port *
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
                  <p
                    className='text-neutral-600 mt-2'
                    style={{ fontSize: '13px', lineHeight: '18px' }}
                  >
                    Usually 587 (TLS) or 465 (SSL)
                  </p>
                </div>
              </div>

              <div className='mt-4 flex items-center p-4 bg-neutral-50 rounded-lg border border-neutral-200 hover:border-primary-300 hover:bg-primary-50/30 cursor-pointer'>
                <input
                  type='checkbox'
                  checked={smtpForm.secure}
                  onChange={(e) => setSmtpForm({ ...smtpForm, secure: e.target.checked })}
                  className='w-5 h-5 rounded border-neutral-300 text-primary-500 focus:ring-primary-500 focus:ring-2'
                />
                <label
                  className='ml-3 text-neutral-700 font-medium'
                  style={{ fontSize: '14px', lineHeight: '20px' }}
                >
                  Use SSL/TLS (usually for port 465)
                </label>
              </div>
            </div>

            <div className='pt-6 border-t border-neutral-200'>
              <h3
                className='text-neutral-900 mb-4'
                style={{
                  fontSize: '18px',
                  lineHeight: '24px',
                  fontWeight: '600',
                }}
              >
                Authentication
              </h3>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div>
                  <label
                    className='block text-neutral-700 font-semibold mb-2'
                    style={{ fontSize: '14px', lineHeight: '20px' }}
                  >
                    SMTP Username *
                  </label>
                  <Input
                    value={smtpForm.user}
                    onChange={(e) => setSmtpForm({ ...smtpForm, user: e.target.value })}
                    placeholder='your-email@gmail.com'
                    required
                  />
                </div>

                <div>
                  <label
                    className='block text-neutral-700 font-semibold mb-2'
                    style={{ fontSize: '14px', lineHeight: '20px' }}
                  >
                    SMTP Password{' '}
                    {smtpForm.password ? '(change)' : '(leave blank to keep existing)'}
                  </label>
                  <Input
                    type='password'
                    value={smtpForm.password}
                    onChange={(e) => setSmtpForm({ ...smtpForm, password: e.target.value })}
                    placeholder='Enter new password or leave blank'
                  />
                  <p
                    className='text-neutral-600 mt-2'
                    style={{ fontSize: '13px', lineHeight: '18px' }}
                  >
                    For Gmail, use App Password
                  </p>
                </div>
              </div>
            </div>

            <div className='pt-6 border-t border-neutral-200'>
              <h3
                className='text-neutral-900 mb-4'
                style={{
                  fontSize: '18px',
                  lineHeight: '24px',
                  fontWeight: '600',
                }}
              >
                Email Settings
              </h3>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div>
                  <label
                    className='block text-neutral-700 font-semibold mb-2'
                    style={{ fontSize: '14px', lineHeight: '20px' }}
                  >
                    From Email Address *
                  </label>
                  <Input
                    type='email'
                    value={smtpForm.fromEmail}
                    onChange={(e) => setSmtpForm({ ...smtpForm, fromEmail: e.target.value })}
                    placeholder='noreply@yourclinic.com'
                    required
                  />
                  <p
                    className='text-neutral-600 mt-2'
                    style={{ fontSize: '13px', lineHeight: '18px' }}
                  >
                    Sender email address
                  </p>
                </div>

                <div>
                  <label
                    className='block text-neutral-700 font-semibold mb-2'
                    style={{ fontSize: '14px', lineHeight: '20px' }}
                  >
                    From Name
                  </label>
                  <Input
                    value={smtpForm.fromName}
                    onChange={(e) => setSmtpForm({ ...smtpForm, fromName: e.target.value })}
                    placeholder='Your Clinic Name'
                  />
                  <p
                    className='text-neutral-600 mt-2'
                    style={{ fontSize: '13px', lineHeight: '18px' }}
                  >
                    Display name for sender
                  </p>
                </div>
              </div>

              <div className='mt-4 flex items-center p-4 bg-neutral-50 rounded-lg border border-neutral-200 hover:border-primary-300 hover:bg-primary-50/30 cursor-pointer'>
                <input
                  type='checkbox'
                  checked={smtpForm.rejectUnauthorized}
                  onChange={(e) =>
                    setSmtpForm({ ...smtpForm, rejectUnauthorized: e.target.checked })
                  }
                  className='w-5 h-5 rounded border-neutral-300 text-primary-500 focus:ring-primary-500 focus:ring-2'
                />
                <label
                  className='ml-3 text-neutral-700 font-medium'
                  style={{ fontSize: '14px', lineHeight: '20px' }}
                >
                  Reject Unauthorized SSL Certificates (recommended: enabled)
                </label>
              </div>
            </div>

            <div className='pt-6 border-t border-neutral-200'>
              <h3
                className='text-neutral-900 mb-4'
                style={{
                  fontSize: '18px',
                  lineHeight: '24px',
                  fontWeight: '600',
                }}
              >
                Common SMTP Providers
              </h3>
              <div className='bg-warning-50 border border-warning-200 rounded-xl p-5'>
                <ul
                  className='space-y-2 text-neutral-700'
                  style={{ fontSize: '14px', lineHeight: '20px' }}
                >
                  <li>
                    <strong>Gmail:</strong> smtp.gmail.com, Port 587, Use App Password
                  </li>
                  <li>
                    <strong>Outlook:</strong> smtp.office365.com, Port 587
                  </li>
                  <li>
                    <strong>SendGrid:</strong> smtp.sendgrid.net, Port 587, Username: apikey
                  </li>
                  <li>
                    <strong>AWS SES:</strong> email-smtp.region.amazonaws.com, Port 587
                  </li>
                </ul>
              </div>
            </div>
          </>
        )}

        <div className='flex justify-end pt-6 border-t border-neutral-200'>
          <Button
            onClick={onSave}
            isLoading={saving}
            disabled={smtpForm.enabled && (!smtpForm.host || !smtpForm.user || !smtpForm.fromEmail)}
            size='md'
            className='whitespace-nowrap'
          >
            Save Changes
          </Button>
        </div>
      </div>
    </Card>
  );
}
