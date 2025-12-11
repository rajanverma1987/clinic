'use client';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
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

  return (
    <>
      {/* Welcome Message */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <p
          className='text-neutral-700'
          style={{
            fontSize: '18px',
            lineHeight: '28px',
            fontWeight: '400',
          }}
        >
          Welcome,{' '}
          <span className='font-semibold text-primary-500'>
            {currentUser?.role === 'doctor'
              ? `Dr. ${currentUser?.firstName} ${currentUser?.lastName}`
              : `${currentUser?.firstName} ${currentUser?.lastName}`}
          </span>
          !
        </p>
      </div>

      {/* Premium Profile Card */}
      <Card
        elevated={true}
        className='overflow-hidden relative'
        style={{ marginBottom: 'var(--space-6)' }}
      >
        {/* Decorative Background Gradient */}
        <div
          className='absolute top-0 right-0 bg-gradient-to-br from-primary-100/30 to-secondary-100/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2'
          style={{ width: 'var(--size-4xl)', height: 'var(--size-4xl)' }}
        ></div>

        <div
          className='relative z-10 flex flex-col sm:flex-row items-start sm:items-center'
          style={{
            gap: 'var(--gap-6)',
            padding: 'var(--space-6)',
          }}
        >
          {/* Avatar */}
          <div className='relative flex-shrink-0'>
            <div
              className='bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-xl group-hover:shadow-2xl'
              style={{ width: '80px', height: '80px' }}
            >
              <svg
                className='w-12 h-12 text-white'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={1.5}
                  d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
                />
              </svg>
            </div>
            {/* Status Indicator */}
            <div
              className={`absolute -bottom-1 -right-1 border-4 border-white rounded-full shadow-lg ${
                currentUser?.isActive ? 'bg-secondary-500' : 'bg-status-error'
              }`}
              style={{ width: '20px', height: '20px' }}
              title={currentUser?.isActive ? 'Active' : 'Inactive'}
            ></div>
          </div>

          {/* User Info */}
          <div className='flex-1 min-w-0'>
            <div
              className='flex items-center'
              style={{
                gap: 'var(--gap-3)',
                marginBottom: 'var(--space-2)',
              }}
            >
              <h3
                className='text-neutral-900'
                style={{
                  fontSize: '24px',
                  lineHeight: '32px',
                  letterSpacing: '-0.01em',
                  fontWeight: '700',
                }}
              >
                {currentUser?.role === 'doctor'
                  ? `Dr. ${currentUser?.firstName} ${currentUser?.lastName}`
                  : `${currentUser?.firstName} ${currentUser?.lastName}`}
              </h3>
              {/* Status Indicator */}
              <div
                className={`${
                  currentUser?.isActive ? 'bg-secondary-500' : 'bg-status-error'
                } border-2 border-white rounded-full shadow-lg`}
                style={{
                  width: 'var(--space-3)',
                  height: 'var(--space-3)',
                }}
                title={currentUser?.isActive ? 'Active' : 'Inactive'}
              ></div>
            </div>
            <div
              className='flex items-center'
              style={{
                gap: 'var(--gap-2)',
                marginBottom: 'var(--space-2)',
              }}
            >
              <span
                className='inline-flex items-center px-3 py-1.5 bg-primary-100 text-primary-700 rounded-lg font-semibold shadow-sm'
                style={{ fontSize: '13px', lineHeight: '18px' }}
              >
                {currentUser?.role === 'super_admin'
                  ? 'Super Admin'
                  : currentUser?.role === 'clinic_admin'
                  ? 'Clinic Admin'
                  : currentUser?.role === 'doctor'
                  ? 'Doctor'
                  : currentUser?.role === 'staff'
                  ? 'Staff'
                  : currentUser?.role || 'User'}
              </span>
              <div className='flex items-center gap-2'>
                <span
                  className={`inline-flex items-center px-3 py-1.5 rounded-lg font-semibold shadow-sm ${
                    currentUser?.isActive
                      ? 'bg-secondary-100 text-secondary-700'
                      : 'bg-status-error/20 text-status-error'
                  }`}
                  style={{ fontSize: '13px', lineHeight: '18px' }}
                >
                  {currentUser?.isActive ? 'Active' : 'Inactive'}
                </span>
                <label className='relative inline-flex items-center cursor-pointer'>
                  <input
                    type='checkbox'
                    checked={currentUser?.isActive || false}
                    onChange={onToggleStatus}
                    disabled={saving}
                    className='sr-only peer'
                  />
                  <div className="w-11 h-6 bg-neutral-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-secondary-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after: peer-checked:bg-secondary-500"></div>
                </label>
              </div>
            </div>
            <div className='flex items-center gap-2 text-neutral-600'>
              <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
                />
              </svg>
              <p className='truncate' style={{ fontSize: '14px', lineHeight: '20px' }}>
                {currentUser?.email}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div
            className='flex flex-row sm:flex-col w-full sm:w-auto'
            style={{ gap: 'var(--gap-3)' }}
          >
            <Button
              variant='secondary'
              size='md'
              className='flex-1 sm:flex-none whitespace-nowrap'
              onClick={() => {
                // Handle edit profile - could scroll to form or open modal
                const formSection = document.getElementById('account-information');
                if (formSection) {
                  formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
            >
              <svg className='w-4 h-4 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
                />
              </svg>
              Edit Profile
            </Button>
            <Button
              variant='danger'
              size='sm'
              className='flex-1 sm:flex-none whitespace-nowrap'
              onClick={() => {
                if (logout) {
                  logout();
                }
              }}
            >
              <svg className='w-4 h-4 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1'
                />
              </svg>
              Logout
            </Button>
          </div>
        </div>
      </Card>

      <Card elevated={true} id='account-information'>
        <div style={{ marginBottom: 'var(--space-8)' }}>
          <h2
            className='text-neutral-900'
            style={{
              fontSize: '28px',
              lineHeight: '36px',
              letterSpacing: '-0.02em',
              fontWeight: '700',
              marginBottom: 'var(--space-2)',
            }}
          >
            Account Information
          </h2>
          <p
            className='text-neutral-600'
            style={{
              fontSize: '16px',
              lineHeight: '24px',
              fontWeight: '400',
            }}
          >
            Manage your personal information and account settings
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-8)' }}>
          <div>
            <h3
              className='text-neutral-900'
              style={{
                fontSize: '18px',
                lineHeight: '24px',
                fontWeight: '600',
                marginBottom: 'var(--space-4)',
              }}
            >
              Personal Information
            </h3>
            <div className='grid grid-cols-1 md:grid-cols-2' style={{ gap: 'var(--gap-6)' }}>
              <div>
                <label
                  className='block text-neutral-700 font-semibold mb-2'
                  style={{ fontSize: '14px', lineHeight: '20px' }}
                >
                  {t('auth.firstName')}
                </label>
                <Input value={currentUser?.firstName || ''} disabled />
              </div>

              <div>
                <label
                  className='block text-neutral-700 font-semibold mb-2'
                  style={{ fontSize: '14px', lineHeight: '20px' }}
                >
                  {t('auth.lastName')}
                </label>
                <Input value={currentUser?.lastName || ''} disabled />
              </div>

              <div>
                <label
                  className='block text-neutral-700 font-semibold mb-2'
                  style={{ fontSize: '14px', lineHeight: '20px' }}
                >
                  {t('auth.email')}
                </label>
                <Input value={currentUser?.email || ''} disabled />
              </div>

              <div>
                <label
                  className='block text-neutral-700 font-semibold mb-2'
                  style={{ fontSize: '14px', lineHeight: '20px' }}
                >
                  Role
                </label>
                <Input value={currentUser?.role || ''} disabled />
              </div>
            </div>
          </div>

          <div
            className='border-t border-neutral-200'
            style={{
              paddingTop: 'var(--space-8)',
            }}
          >
            <h3
              className='text-neutral-900'
              style={{
                fontSize: '18px',
                lineHeight: '24px',
                fontWeight: '600',
                marginBottom: 'var(--space-4)',
              }}
            >
              Change Password
            </h3>
            <div
              className='max-w-md'
              style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-4)' }}
            >
              <Input
                label='Current Password'
                type='password'
                placeholder='Enter current password'
              />
              <Input label='New Password' type='password' placeholder='Enter new password' />
              <Input
                label='Confirm New Password'
                type='password'
                placeholder='Confirm new password'
              />
              <Button size='md' className='whitespace-nowrap'>
                Update Password
              </Button>
            </div>
          </div>

          {/* Doctor Availability Settings - Only for Doctors */}
          {currentUser?.role === 'doctor' && (
            <AvailabilityForm
              availabilityForm={availabilityForm}
              setAvailabilityForm={setAvailabilityForm}
            />
          )}
        </div>
      </Card>
    </>
  );
}
