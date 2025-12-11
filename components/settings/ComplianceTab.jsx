'use client';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Toggle } from '@/components/ui/Toggle';

export function ComplianceTab({
  isClinicAdmin,
  complianceForm,
  setComplianceForm,
  saving,
  onSave,
}) {
  if (!isClinicAdmin) {
    return (
      <Card className='text-center py-12'>
        <div className='flex flex-col items-center'>
          <div className='w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mb-3'>
            <svg
              className='w-8 h-8 text-neutral-400'
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
          <h3 className='text-lg font-semibold text-neutral-900 mb-1'>Access Restricted</h3>
          <p className='text-sm text-neutral-600'>
            Only clinic administrators can manage compliance settings.
          </p>
        </div>
      </Card>
    );
  }

  const complianceOptions = [
    {
      key: 'hipaa',
      title: 'HIPAA Compliance',
      region: 'United States',
      description:
        'Health Insurance Portability and Accountability Act compliance for US healthcare data protection',
    },
    {
      key: 'gdpr',
      title: 'GDPR Compliance',
      region: 'European Union',
      description:
        'General Data Protection Regulation compliance for EU data protection and privacy',
    },
    {
      key: 'pipeda',
      title: 'PIPEDA Compliance',
      region: 'Canada',
      description:
        'Personal Information Protection and Electronic Documents Act compliance for Canadian data protection',
    },
    {
      key: 'privacyAct',
      title: 'Privacy Act Compliance',
      region: 'Australia',
      description: 'Privacy Act compliance for Australian data protection and privacy regulations',
    },
  ];

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave();
      }}
      className='space-y-4'
    >
      {/* Compliance Standards */}
      <Card>
        <div className='p-5'>
          <div className='flex items-center gap-2 mb-5'>
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
            <h2 className='text-lg font-bold text-neutral-900'>Compliance Standards</h2>
          </div>

          <div className='space-y-2'>
            {complianceOptions.map((option) => (
              <div
                key={option.key}
                className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                  complianceForm[option.key]
                    ? 'border-primary-300 bg-primary-50/50'
                    : 'border-neutral-200 bg-white hover:border-neutral-300'
                }`}
              >
                <div className='flex items-start gap-3 flex-1'>
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      complianceForm[option.key] ? 'bg-primary-100' : 'bg-neutral-100'
                    }`}
                  >
                    <svg
                      className={`w-4 h-4 ${
                        complianceForm[option.key] ? 'text-primary-600' : 'text-neutral-400'
                      }`}
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
                    <div className='flex items-center gap-2 mb-0.5'>
                      <h3 className='font-semibold text-neutral-900 text-sm'>{option.title}</h3>
                      <span className='px-1.5 py-0.5 bg-neutral-100 text-neutral-600 text-xs rounded'>
                        {option.region}
                      </span>
                    </div>
                    <p className='text-xs text-neutral-600'>{option.description}</p>
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

      {/* Data Retention */}
      <Card>
        <div className='p-5'>
          <div className='flex items-center gap-2 mb-5'>
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
                  d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
                />
              </svg>
            </div>
            <h2 className='text-lg font-bold text-neutral-900'>Data Retention</h2>
          </div>

          <div>
            <label className='block text-sm font-medium text-neutral-700 mb-1.5'>
              Data Retention Period (Years) <span className='text-red-500'>*</span>
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
              placeholder='7'
              required
              className='max-w-xs'
            />
            <div className='mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg'>
              <p className='text-xs text-amber-800'>
                <strong>Note:</strong> Data retention periods vary by region and compliance
                requirements. Consult legal counsel for specific requirements.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className='flex justify-end gap-3 pt-2'>
        <Button type='submit' isLoading={saving} disabled={saving}>
          Save Changes
        </Button>
      </div>
    </form>
  );
}
