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
      setError(t('auth.currentPasswordRequired'));
      return;
    }

    if (!newPassword) {
      setError(t('auth.newPasswordRequired'));
      return;
    }

    if (newPassword.length < 8) {
      setError(t('auth.passwordMinLength'));
      return;
    }

    // Password strength validation
    if (!/[A-Z]/.test(newPassword)) {
      setError(t('auth.passwordUppercase'));
      return;
    }

    if (!/[a-z]/.test(newPassword)) {
      setError(t('auth.passwordLowercase'));
      return;
    }

    if (!/[0-9]/.test(newPassword)) {
      setError(t('auth.passwordNumber'));
      return;
    }

    if (!/[^A-Za-z0-9]/.test(newPassword)) {
      setError(t('auth.passwordSpecial'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t('auth.passwordMismatch'));
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
        setSuccess(t('auth.passwordChangedSuccess'));
        setTimeout(() => {
          if (isFirstLogin) {
            router.push('/dashboard');
          } else {
            router.push('/settings');
          }
        }, 2000);
      } else {
        setError(response.error?.message || t('auth.changePasswordFailed'));
      }
    } catch (error) {
      setError(error.message || t('auth.changePasswordFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='h-screen flex bg-neutral-50 dark:bg-neutral-900 overflow-hidden'>
      {/* Left Side - Background Image Only */}
      <div className='hidden lg:flex lg:w-1/2 relative overflow-hidden border-r border-neutral-200 dark:border-neutral-700 h-full'>
        <div className='absolute inset-0 w-full h-full'>
          <ImageTransition
            src='/images/login.png'
            alt={t('common.altChangePasswordBackground')}
            fill
            className='object-cover opacity-90 dark:opacity-70'
            quality={75}
            priority
            sizes='50vw'
            style={{ objectFit: 'cover', objectPosition: 'center' }}
          />
        </div>
        <div className='absolute inset-0 bg-gradient-to-br from-neutral-900/10 via-transparent to-neutral-900/20 dark:from-neutral-950/40 dark:to-neutral-950/60' />
      </div>

      {/* Right Side - Change Password Form */}
      <div className='w-full lg:w-1/2 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-neutral-50 via-white to-neutral-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 h-full overflow-y-auto'>
        <div className='w-full max-w-md'>
          {/* Logo for mobile */}
          <div className='lg:hidden mb-8 text-center'>
            <Link href='/' className='inline-flex items-center justify-center group'>
              <div className='flex items-center justify-center group-hover:opacity-90'>
                <ImageTransition
                  src='/images/logoclinic.png'
                  alt={t('common.altClinicLogo')}
                  width={200}
                  height={175}
                  className='object-contain drop-shadow-md w-52 max-w-full dark:brightness-0 dark:invert'
                  priority
                />
              </div>
            </Link>
          </div>

          {/* Language Switcher - Top Right */}
          <div className='absolute top-4 right-4 lg:top-6 lg:right-6 z-50'>
            <LanguageSwitcher />
          </div>

          <FormTransition className='bg-white dark:bg-neutral-800 rounded-2xl border-2 border-neutral-200/80 dark:border-neutral-600/80 shadow-2xl p-8 lg:p-10'>
            {/* Logo for desktop */}
            <div className='hidden lg:flex justify-center mb-8'>
              <Link href='/' className='inline-flex items-center justify-center group'>
                <div className='flex items-center justify-center group-hover:opacity-90'>
                  <ImageTransition
                    src='/images/logoclinic.png'
                    alt={t('common.altClinicLogo')}
                    width={200}
                    height={175}
                    className='object-contain drop-shadow-sm w-52 dark:brightness-0 dark:invert'
                    priority
                  />
                </div>
              </Link>
            </div>

            <div className='text-center mb-8'>
              <h2
                className='text-neutral-900 dark:text-neutral-100 mb-2'
                style={{
                  fontSize: '32px',
                  lineHeight: '40px',
                  letterSpacing: '-0.02em',
                  fontWeight: '700',
                }}
              >
                {isFirstLogin ? t('auth.setYourPassword') : t('auth.changePasswordTitle')}
              </h2>
              <p
                className='text-neutral-600 dark:text-neutral-400'
                style={{
                  fontSize: '16px',
                  lineHeight: '24px',
                  fontWeight: '400',
                }}
              >
                {isFirstLogin
                  ? t('auth.setPasswordSubtitle')
                  : t('auth.enterCurrentAndNew')}
              </p>
            </div>

            <form onSubmit={handleSubmit} className='change-password-form space-y-6' noValidate>
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
                <div className='bg-secondary-100 dark:bg-secondary-900/40 border-l-4 border-secondary-500 dark:border-secondary-400 text-secondary-700 dark:text-secondary-300 px-4 py-3 rounded-lg shadow-sm'>
                  <span className='text-sm font-medium'>{success}</span>
                </div>
              )}

              {!isFirstLogin && (
                <div>
                  <label
                    htmlFor='currentPassword'
                    className='block text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-2'
                  >
                    {t('auth.currentPassword')}
                  </label>
                  <div className='relative min-h-[var(--input-height-md,40px)]'>
                    <div className='absolute inset-y-0 left-0 w-10 flex items-center justify-center pointer-events-none'>
                      <svg
                        className='icon icon-sm text-neutral-600 dark:text-neutral-400'
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
                      className='pl-11 pr-10'
                    />
                    <div className='absolute inset-y-0 right-0 w-10 flex items-center justify-center pointer-events-none [&>*]:pointer-events-auto'>
                      <Button
                        type='button'
                        variant='ghost'
                        size='xs'
                        className='min-w-0 p-0 h-auto aspect-square text-primary-500 hover:text-primary-600'
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
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
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label
                  htmlFor='newPassword'
                  className='block text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-2'
                >
                  {t('auth.newPassword')}
                </label>
                <div className='relative min-h-[var(--input-height-md,40px)]'>
                  <div className='absolute inset-y-0 left-0 w-10 flex items-center justify-center pointer-events-none'>
                    <svg
                      className='icon icon-sm text-neutral-600 dark:text-neutral-400'
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
                    className='pl-11 pr-10'
                  />
                  <div className='absolute inset-y-0 right-0 w-10 flex items-center justify-center pointer-events-none [&>*]:pointer-events-auto'>
                    <Button
                      type='button'
                      variant='ghost'
                      size='xs'
                      className='min-w-0 p-0 h-auto aspect-square text-primary-500 hover:text-primary-600'
                      onClick={() => setShowNewPassword(!showNewPassword)}
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
                    </Button>
                  </div>
                </div>
                <p className='text-xs text-neutral-500 dark:text-neutral-400 mt-1'>
                  {t('auth.passwordRequirementHint')}
                </p>
              </div>

              <div>
                <label
                  htmlFor='confirmPassword'
                  className='block text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-2'
                >
                  {t('auth.confirmNewPassword')}
                </label>
                <div className='relative min-h-[var(--input-height-md,40px)]'>
                  <div className='absolute inset-y-0 left-0 w-10 flex items-center justify-center pointer-events-none'>
                    <svg
                      className='icon icon-sm text-neutral-600 dark:text-neutral-400'
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
                    className='pl-11 pr-10'
                  />
                  <div className='absolute inset-y-0 right-0 w-10 flex items-center justify-center pointer-events-none [&>*]:pointer-events-auto'>
                    <Button
                      type='button'
                      variant='ghost'
                      size='xs'
                      className='min-w-0 p-0 h-auto aspect-square text-primary-500 hover:text-primary-600'
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                    </Button>
                  </div>
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
                {isFirstLogin ? t('auth.setPassword') : t('auth.changePasswordTitle')}
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
