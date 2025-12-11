'use client';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

export function ComplianceTab({
  isClinicAdmin,
  complianceForm,
  setComplianceForm,
  saving,
  onSave,
}) {
  if (!isClinicAdmin) {
    return (
      <Card elevated={true}>
        <div className='text-center py-8'>
          <p className='text-neutral-600'>You don&apos;t have permission to access this section.</p>
          <p className='text-sm text-neutral-500 mt-2'>
            Only clinic administrators can manage compliance settings.
          </p>
        </div>
      </Card>
    );
  }

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
          Compliance & Data Protection
        </h2>
        <p
          className='text-neutral-600'
          style={{
            fontSize: '16px',
            lineHeight: '24px',
            fontWeight: '400',
          }}
        >
          Configure compliance standards and data retention policies
        </p>
      </div>
      <div className='space-y-8'>
        <div>
          <h3
            className='text-neutral-900 mb-4'
            style={{
              fontSize: '18px',
              lineHeight: '24px',
              fontWeight: '600',
            }}
          >
            Compliance Standards
          </h3>
          <div className='space-y-4'>
            <label className='flex items-center p-4 bg-neutral-50 rounded-lg border border-neutral-200 hover:border-primary-300 hover:bg-primary-50/30 cursor-pointer'>
              <input
                type='checkbox'
                checked={complianceForm.hipaa}
                onChange={(e) => setComplianceForm({ ...complianceForm, hipaa: e.target.checked })}
                className='w-5 h-5 rounded border-neutral-300 text-primary-500 focus:ring-primary-500 focus:ring-2'
              />
              <span className='ml-3 text-neutral-700 font-medium'>HIPAA Compliance (US)</span>
            </label>
            <label className='flex items-center p-4 bg-neutral-50 rounded-lg border border-neutral-200 hover:border-primary-300 hover:bg-primary-50/30 cursor-pointer'>
              <input
                type='checkbox'
                checked={complianceForm.gdpr}
                onChange={(e) => setComplianceForm({ ...complianceForm, gdpr: e.target.checked })}
                className='w-5 h-5 rounded border-neutral-300 text-primary-500 focus:ring-primary-500 focus:ring-2'
              />
              <span className='ml-3 text-neutral-700 font-medium'>GDPR Compliance (EU)</span>
            </label>
            <label className='flex items-center p-4 bg-neutral-50 rounded-lg border border-neutral-200 hover:border-primary-300 hover:bg-primary-50/30 cursor-pointer'>
              <input
                type='checkbox'
                checked={complianceForm.pipeda}
                onChange={(e) => setComplianceForm({ ...complianceForm, pipeda: e.target.checked })}
                className='w-5 h-5 rounded border-neutral-300 text-primary-500 focus:ring-primary-500 focus:ring-2'
              />
              <span className='ml-3 text-neutral-700 font-medium'>PIPEDA Compliance (Canada)</span>
            </label>
            <label className='flex items-center p-4 bg-neutral-50 rounded-lg border border-neutral-200 hover:border-primary-300 hover:bg-primary-50/30 cursor-pointer'>
              <input
                type='checkbox'
                checked={complianceForm.privacyAct}
                onChange={(e) =>
                  setComplianceForm({ ...complianceForm, privacyAct: e.target.checked })
                }
                className='w-5 h-5 rounded border-neutral-300 text-primary-500 focus:ring-primary-500 focus:ring-2'
              />
              <span className='ml-3 text-neutral-700 font-medium'>
                Privacy Act Compliance (Australia)
              </span>
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
            Data Retention
          </h3>
          <div>
            <label
              className='block text-neutral-700 font-semibold mb-2'
              style={{ fontSize: '14px', lineHeight: '20px' }}
            >
              Data Retention Period (Years)
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
            />
            <p className='text-neutral-600 mt-2' style={{ fontSize: '13px', lineHeight: '18px' }}>
              How long to retain patient data (varies by region)
            </p>
          </div>
        </div>

        <div className='flex justify-end pt-6 border-t border-neutral-200'>
          <Button onClick={onSave} isLoading={saving} size='md' className='whitespace-nowrap'>
            Save Changes
          </Button>
        </div>
      </div>
    </Card>
  );
}
