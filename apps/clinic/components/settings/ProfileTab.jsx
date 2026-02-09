'use client';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Toggle } from '@/components/ui/Toggle';
import { useI18n } from '@/contexts/I18nContext';
import Link from 'next/link';
import { AvailabilityForm } from './AvailabilityForm';
import { SettingsTabHeader } from './SettingsTabHeader';

export function ProfileTab({
  currentUser,
  logout,
  saving,
  onToggleStatus,
  availabilityForm,
  setAvailabilityForm,
  onEditProfileClick,
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
    <div className='w-full max-w-4xl space-y-4 text-left'>
      <SettingsTabHeader title={t('settings.profile')} />
      {/* Profile Header Card – large profile picture + user info */}
      <Card elevated={true}>
        <div className='p-6 sm:p-8'>
          <div className='flex flex-col lg:flex-row items-center lg:items-start gap-8'>
            {/* Large profile picture – 160px / 192px, user avatar or gradient fallback */}
            <div className='flex-shrink-0'>
              <div className='relative' style={{ width: 192, height: 192 }}>
                <div
                  className='relative w-full h-full rounded-2xl overflow-hidden bg-gradient-to-br from-primary-500 to-primary-700 shadow-xl ring-4 ring-primary-100 flex items-center justify-center'
                  style={{ minWidth: 160, minHeight: 160 }}
                >
                  {currentUser?.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={currentUser.avatar}
                      alt={
                        `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() ||
                        'Profile'
                      }
                      className='absolute inset-0 w-full h-full object-cover'
                    />
                  ) : (
                    <svg
                      className='w-24 h-24 text-white'
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
                  )}
                </div>
                <div
                  className={`absolute -bottom-1 -right-1 w-9 h-9 rounded-full border-4 border-white shadow-md flex items-center justify-center ${
                    currentUser?.isActive ? 'bg-status-success' : 'bg-status-error'
                  }`}
                  title={currentUser?.isActive ? 'Active' : 'Inactive'}
                >
                  <div className='w-2.5 h-2.5 bg-white rounded-full' />
                </div>
              </div>
            </div>

            {/* User Info Section */}
            <div className='flex-1 min-w-0 w-full lg:w-auto text-center lg:text-left'>
              <div className='space-y-3'>
                <div>
                  <h2 className='text-2xl sm:text-3xl font-bold text-neutral-900 mb-2'>
                    {currentUser?.role === 'doctor'
                      ? `Dr. ${currentUser?.firstName} ${currentUser?.lastName}`
                      : `${currentUser?.firstName} ${currentUser?.lastName}`}
                  </h2>
                  <div className='flex flex-wrap items-center gap-3'>
                    <span className='inline-flex items-center px-3 py-1.5 bg-primary-100 text-primary-700 rounded-lg text-sm font-semibold border border-primary-200'>
                      {getRoleLabel(currentUser?.role)}
                    </span>
                    <span className='text-sm text-neutral-600 flex items-center gap-2'>
                      <svg
                        className='icon icon-xs'
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
                      {currentUser?.email}
                    </span>
                  </div>
                </div>

                {/* Status Toggle */}
                <div className='flex items-center gap-4 pt-2 border-t border-neutral-200'>
                  <div>
                    <p className='text-xs font-medium text-neutral-500 mb-1.5'>
                      {t('settings.accountStatus')}
                    </p>
                    <span
                      className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-semibold ${
                        currentUser?.isActive
                          ? 'bg-status-success/10 text-status-success border border-status-success/20'
                          : 'bg-status-error/10 text-status-error border border-status-error/20'
                      }`}
                    >
                      {currentUser?.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <span className='text-sm text-neutral-600'>{t('settings.toggleStatus')}</span>
                    <Toggle
                      checked={currentUser?.isActive || false}
                      onChange={onToggleStatus}
                      disabled={saving}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className='flex flex-col sm:flex-row gap-3 w-full lg:w-auto'>
              {currentUser?.role === 'doctor' ? (
                <Link href='/doctors/profile'>
                  <Button variant='secondary' size='md' className='flex-1 lg:flex-none'>
                    {t('settings.editProfile')}
                  </Button>
                </Link>
              ) : onEditProfileClick ? (
                <Button
                  variant='secondary'
                  size='md'
                  className='flex-1 lg:flex-none'
                  onClick={onEditProfileClick}
                >
                  {t('settings.editProfile')}
                </Button>
              ) : (
                <Link href='/settings?tab=profile'>
                  <Button variant='secondary' size='md' className='flex-1 lg:flex-none'>
                    {t('settings.editProfile')}
                  </Button>
                </Link>
              )}
              <Button variant='danger' size='md' className='flex-1 lg:flex-none' onClick={logout}>
                {t('auth.logout')}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Two Column Layout for Information Cards */}
      <div className='content-grid-2'>
        {/* Account Information */}
        <Card>
          <div className='p-4'>
            <div className='flex items-center gap-3 mb-4'>
              <div className='w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center border border-primary-200'>
                <svg
                  className='icon icon-sm text-primary-600'
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
              <h2 className='text-lg font-bold text-neutral-900'>
                {t('auth.personalInformation')}
              </h2>
            </div>
            <div className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-2'>
                  {t('auth.firstName')}
                </label>
                <Input value={currentUser?.firstName || ''} disabled />
              </div>
              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-2'>
                  {t('auth.lastName')}
                </label>
                <Input value={currentUser?.lastName || ''} disabled />
              </div>
              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-2'>
                  {t('auth.email')}
                </label>
                <Input value={currentUser?.email || ''} disabled />
              </div>
              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-2'>Role</label>
                <Input value={getRoleLabel(currentUser?.role) || ''} disabled />
              </div>
            </div>
          </div>
        </Card>

        {/* Security Card */}
        <Card>
          <div className='p-4'>
            <div className='flex items-center gap-3 mb-4'>
              <div className='w-10 h-10 bg-status-warning/10 rounded-xl flex items-center justify-center border border-status-warning/20'>
                <svg
                  className='icon icon-sm text-status-warning'
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
              <h2 className='text-lg font-bold text-neutral-900'>{t('settings.security')}</h2>
            </div>
            <div className='space-y-4'>
              <div>
                <p className='text-sm font-medium text-neutral-700 mb-1'>{t('auth.password')}</p>
                <p className='text-xs text-neutral-500 mb-4'>{t('settings.changePasswordHint')}</p>
                <Link href='/change-password'>
                  <Button variant='secondary' size='md' className='w-full'>
                    {t('settings.changePasswordLabel')}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Doctor Availability Settings - Full Width */}
      {currentUser?.role === 'doctor' && (
        <Card>
          <div className='p-4'>
            <div className='flex items-center gap-3 mb-4'>
              <div className='w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center border border-primary-200'>
                <svg
                  className='icon icon-sm text-primary-600'
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
              <h2 className='text-lg font-bold text-neutral-900'>
                {t('settings.availabilitySettings')}
              </h2>
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
