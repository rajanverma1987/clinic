'use client';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Toggle } from '@/components/ui/Toggle';
import { useI18n } from '@/contexts/I18nContext';
import { AvailabilityForm } from './AvailabilityForm';

export function ProfileTab({
  currentUser,
  logout,
  saving,
  onToggleStatus,
  availabilityForm,
  setAvailabilityForm,
}) {
  const { t } = useI18n();

  const getRoleLabel = (role) => {
    const roles = {
      super_admin: 'Super Admin',
      clinic_admin: 'Clinic Admin',
      doctor: 'Doctor',
      nurse: 'Nurse',
      receptionist: 'Receptionist',
      accountant: 'Accountant',
      pharmacist: 'Pharmacist',
      staff: 'Staff',
    };
    return roles[role] || role;
  };

  return (
    <div className='space-y-4'>
      {/* Profile Header Card */}
      <Card>
        <div className='p-6'>
          <div className='flex flex-col md:flex-row items-start md:items-center gap-6'>
            {/* Avatar Section */}
            <div className='flex-shrink-0'>
              <div className='relative'>
                <div className='w-20 h-20 bg-primary-500 rounded-full flex items-center justify-center shadow-md'>
                  <svg
                    className='w-10 h-10 text-white'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
                    />
                  </svg>
                </div>
                <div
                  className={`absolute bottom-0 right-0 w-5 h-5 rounded-full border-2 border-white ${
                    currentUser?.isActive ? 'bg-green-500' : 'bg-red-500'
                  }`}
                />
              </div>
            </div>

            {/* User Info Section */}
            <div className='flex-1 min-w-0'>
              <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
                <div>
                  <h2 className='text-2xl font-bold text-neutral-900 mb-2'>
                    {currentUser?.role === 'doctor'
                      ? `Dr. ${currentUser?.firstName} ${currentUser?.lastName}`
                      : `${currentUser?.firstName} ${currentUser?.lastName}`}
                  </h2>
                  <div className='flex flex-wrap items-center gap-3 mb-2'>
                    <span className='inline-flex items-center px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-semibold'>
                      {getRoleLabel(currentUser?.role)}
                    </span>
                    <span className='text-sm text-neutral-600'>{currentUser?.email}</span>
                  </div>
                </div>

                {/* Status Toggle */}
                <div className='flex items-center gap-3'>
                  <div className='text-right'>
                    <p className='text-xs text-neutral-500 mb-1'>Account Status</p>
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${
                        currentUser?.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {currentUser?.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <Toggle
                    checked={currentUser?.isActive || false}
                    onChange={onToggleStatus}
                    disabled={saving}
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className='flex gap-2 w-full md:w-auto'>
              <Button variant='secondary' size='sm' className='flex-1 md:flex-none'>
                Edit Profile
              </Button>
              <Button variant='danger' size='sm' className='flex-1 md:flex-none' onClick={logout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Account Information */}
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
                  d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
                />
              </svg>
            </div>
            <h2 className='text-lg font-bold text-neutral-900'>Personal Information</h2>
          </div>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm font-medium text-neutral-700 mb-1.5'>
                {t('auth.firstName')}
              </label>
              <Input value={currentUser?.firstName || ''} disabled />
            </div>
            <div>
              <label className='block text-sm font-medium text-neutral-700 mb-1.5'>
                {t('auth.lastName')}
              </label>
              <Input value={currentUser?.lastName || ''} disabled />
            </div>
            <div>
              <label className='block text-sm font-medium text-neutral-700 mb-1.5'>
                {t('auth.email')}
              </label>
              <Input value={currentUser?.email || ''} disabled />
            </div>
            <div>
              <label className='block text-sm font-medium text-neutral-700 mb-1.5'>Role</label>
              <Input value={getRoleLabel(currentUser?.role) || ''} disabled />
            </div>
          </div>
        </div>
      </Card>

      {/* Change Password */}
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
                  d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
                />
              </svg>
            </div>
            <h2 className='text-lg font-bold text-neutral-900'>Security</h2>
          </div>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div>
              <label className='block text-sm font-medium text-neutral-700 mb-1.5'>
                Current Password
              </label>
              <Input type='password' placeholder='Enter current password' />
            </div>
            <div>
              <label className='block text-sm font-medium text-neutral-700 mb-1.5'>
                New Password
              </label>
              <Input type='password' placeholder='Enter new password' />
            </div>
            <div className='flex items-end'>
              <Button size='sm' className='w-full'>
                Update Password
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Doctor Availability Settings */}
      {currentUser?.role === 'doctor' && (
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
              <h2 className='text-lg font-bold text-neutral-900'>Availability Settings</h2>
            </div>
            <AvailabilityForm
              availabilityForm={availabilityForm}
              setAvailabilityForm={setAvailabilityForm}
            />
          </div>
        </Card>
      )}
    </div>
  );
}
