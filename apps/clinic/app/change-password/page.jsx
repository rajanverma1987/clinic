'use client';

import { FormTransition } from '@/components/layout/FormTransition';
import { ImageTransition } from '@/components/layout/ImageTransition';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { Loader } from '@/components/ui/Loader';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { apiClient } from '@/lib/api/client';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

function PageLoaderFallback() {
  const { t } = useI18n();
  return <Loader type='page' text={t('common.loading')} />;
}

function ChangePasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const { t } = useI18n();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const isFirstLogin = searchParams.get('firstLogin') === 'true';

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Show nothing while checking auth
  if (loading || !user) {
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation - only require current password if not first login
    if (!isFirstLogin && !currentPassword) {
      setError('Current password is required');
      return;
    }

    if (!newPassword) {
      setError('New password is required');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    // Password strength validation
    if (!/[A-Z]/.test(newPassword)) {
      setError('Password must contain at least one uppercase letter');
      return;
    }

    if (!/[a-z]/.test(newPassword)) {
      setError('Password must contain at least one lowercase letter');
      return;
    }

    if (!/[0-9]/.test(newPassword)) {
      setError('Password must contain at least one number');
      return;
    }

    if (!/[^A-Za-z0-9]/.test(newPassword)) {
      setError('Password must contain at least one special character');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const requestData = {
        newPassword,
        confirmPassword,
      };

      // Only include currentPassword if not first login
      if (!isFirstLogin) {
        requestData.currentPassword = currentPassword;
      }

      const response = await apiClient.post('/auth/change-password', requestData);

      if (response.success) {
        setSuccess('Password changed successfully!');
        setTimeout(() => {
          if (isFirstLogin) {
            router.push('/dashboard');
          } else {
            router.push('/settings');
          }
        }, 2000);
      } else {
        setError(response.error?.message || 'Failed to change password');
      }
    } catch (error) {
      setError(error.message || 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='h-screen flex bg-neutral-50 overflow-hidden'>
      {/* Left Side - Background Image Only */}
      <div className='hidden lg:flex lg:w-1/2 relative overflow-hidden border-r border-neutral-200 h-full'>
        <div className='absolute inset-0 w-full h-full'>
          <ImageTransition
            src='/images/login.png'
            alt={t('common.altChangePasswordBackground')}
            fill
            className='object-cover opacity-90'
            quality={75}
            priority
            sizes='50vw'
            style={{ objectFit: 'cover', objectPosition: 'center' }}
          />
        </div>
        <div className='absolute inset-0 bg-gradient-to-br from-neutral-900/10 via-transparent to-neutral-900/20'></div>
      </div>

      {/* Right Side - Change Password Form */}
      <div className='w-full lg:w-1/2 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-neutral-50 via-white to-neutral-50 h-full overflow-y-auto'>
        <div className='w-full max-w-md'>
          {/* Logo for mobile */}
          <div className='lg:hidden mb-8 text-center'>
            <Link href='/' className='inline-flex items-center justify-center group'>
              <div className='flex items-center justify-center group-hover:opacity-90'>
                <ImageTransition
                  src='/images/logoclinic.png'
                  alt={t('common.altClinicLogo')}
                  width={128}
                  height={112}
                  className='object-contain drop-shadow-md w-32 max-w-full'
                  priority
                />
              </div>
            </Link>
          </div>

          {/* Language Switcher - Top Right */}
          <div className='absolute top-4 right-4 lg:top-6 lg:right-6 z-50'>
            <LanguageSwitcher />
          </div>

          <FormTransition className='bg-white rounded-2xl border-2 border-neutral-200/80 shadow-2xl p-8 lg:p-10'>
            {/* Logo for desktop */}
            <div className='hidden lg:flex justify-center mb-8'>
              <Link href='/' className='inline-flex items-center justify-center group'>
                <div className='flex items-center justify-center group-hover:opacity-90'>
                  <ImageTransition
                    src='/images/logoclinic.png'
                    alt={t('common.altClinicLogo')}
                    width={128}
                    height={112}
                    className='object-contain drop-shadow-sm w-32 max-w-full'
                    priority
                  />
                </div>
              </Link>
            </div>

            <div className='text-center mb-8'>
              <h2
                className='text-neutral-900 mb-2'
                style={{
                  fontSize: '32px',
                  lineHeight: '40px',
                  letterSpacing: '-0.02em',
                  fontWeight: '700',
                }}
              >
                {isFirstLogin ? 'Set Your Password' : 'Change Password'}
              </h2>
              <p
                className='text-neutral-600'
                style={{
                  fontSize: '16px',
                  lineHeight: '24px',
                  fontWeight: '400',
                }}
              >
                {isFirstLogin
                  ? 'Please set a new password for your account'
                  : 'Enter your current password and choose a new one'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className='space-y-6' noValidate>
              {error && (
                <div className='bg-status-error/10 border-l-4 border-status-error text-status-error px-4 py-3 rounded-lg flex items-start space-x-2 shadow-sm'>
                  <svg
                    className='icon icon-sm text-status-error mt-0.5 flex-shrink-0'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth={2}
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                    />
                  </svg>
                  <span className='text-sm font-medium'>{error}</span>
                </div>
              )}

              {success && (
                <div className='bg-secondary-100 border-l-4 border-secondary-500 text-secondary-700 px-4 py-3 rounded-lg shadow-sm'>
                  <span className='text-sm font-medium'>{success}</span>
                </div>
              )}

              {!isFirstLogin && (
                <div>
                  <label
                    htmlFor='currentPassword'
                    className='block text-sm font-semibold text-neutral-800 mb-2'
                  >
                    Current Password
                  </label>
                  <div className='relative'>
                    <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                      <svg
                        className='icon icon-sm text-neutral-900'
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
                    <Input
                      id='currentPassword'
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required={!isFirstLogin}
                      placeholder={t('auth.passwordPlaceholder')}
                      autoComplete='current-password'
                      className='pl-10 pr-10'
                    />
                    <button
                      type='button'
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className='absolute inset-y-0 right-0 pr-3 flex items-center text-primary-500 hover:text-primary-600 transition-colors'
                    >
                      {showCurrentPassword ? (
                        <svg
                          className='icon icon-sm'
                          fill='none'
                          stroke='currentColor'
                          viewBox='0 0 24 24'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21'
                          />
                        </svg>
                      ) : (
                        <svg
                          className='icon icon-sm'
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
                      )}
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label
                  htmlFor='newPassword'
                  className='block text-sm font-semibold text-neutral-800 mb-2'
                >
                  New Password
                </label>
                <div className='relative'>
                  <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                    <svg
                      className='icon icon-sm text-neutral-900'
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
                  <Input
                    id='newPassword'
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder={t('auth.passwordPlaceholder')}
                    autoComplete='new-password'
                    className='pl-10 pr-10'
                  />
                  <button
                    type='button'
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className='absolute inset-y-0 right-0 pr-3 flex items-center text-primary-500 hover:text-primary-600 transition-colors'
                  >
                    {showNewPassword ? (
                      <svg
                        className='icon icon-sm'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21'
                        />
                      </svg>
                    ) : (
                      <svg
                        className='icon icon-sm'
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
                    )}
                  </button>
                </div>
                <p className='text-xs text-neutral-500 mt-1'>
                  Must be at least 8 characters with uppercase, lowercase, number, and special
                  character
                </p>
              </div>

              <div>
                <label
                  htmlFor='confirmPassword'
                  className='block text-sm font-semibold text-neutral-800 mb-2'
                >
                  Confirm New Password
                </label>
                <div className='relative'>
                  <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                    <svg
                      className='icon icon-sm text-neutral-900'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                      />
                    </svg>
                  </div>
                  <Input
                    id='confirmPassword'
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder={t('auth.passwordPlaceholder')}
                    autoComplete='new-password'
                    className='pl-10 pr-10'
                  />
                  <button
                    type='button'
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className='absolute inset-y-0 right-0 pr-3 flex items-center text-primary-500 hover:text-primary-600 transition-colors'
                  >
                    {showConfirmPassword ? (
                      <svg
                        className='icon icon-sm'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21'
                        />
                      </svg>
                    ) : (
                      <svg
                        className='icon icon-sm'
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
                    )}
                  </button>
                </div>
              </div>

              <Button
                type='submit'
                variant='primary'
                isLoading={isLoading}
                disabled={isLoading}
                className='w-full'
                size='lg'
              >
                <svg
                  className='icon icon-sm mr-2'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                  />
                </svg>
                {isFirstLogin ? 'Set Password' : 'Change Password'}
              </Button>
            </form>
          </FormTransition>
        </div>
      </div>
    </div>
  );
}

export default function ChangePasswordPage() {
  return (
    <Suspense fallback={<PageLoaderFallback />}>
      <ChangePasswordContent />
    </Suspense>
  );
}
