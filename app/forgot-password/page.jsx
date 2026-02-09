'use client';

import { FormTransition } from '@/components/layout/FormTransition';
import { ImageTransition } from '@/components/layout/ImageTransition';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { useI18n } from '@/contexts/I18nContext';
import { apiClient } from '@/lib/api/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [step, setStep] = useState('request');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [resetMethod, setResetMethod] = useState('email'); // 'email' or 'phone'
  const [secretCode, setSecretCode] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleRequestCode = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const payload = { email }; // Clinic/staff/doctor only – email reset
      const endpoint = '/auth/forgot-password';

      const response = await apiClient.post(endpoint, payload);
      if (response.success) {
        setSuccess(
          response.data?.message ||
            t('auth.passwordResetCodeSent') ||
            'Reset code sent successfully',
        );
        // In development, show the code if returned
        if (response.data?.secretCode) {
          setSuccess(
            `Code sent! Your secret code is: ${response.data.secretCode} (development only)`,
          );
        }
        if (response.data?.otp) {
          setOtp(response.data.otp);
        }
        setStep('verify');
      } else {
        setError(response.error?.message || 'Failed to send reset code');
      }
    } catch (error) {
      setError(error.message || 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError(t('auth.passwordMismatch'));
      return;
    }

    if (newPassword.length < 8) {
      setError(t('auth.passwordMinLength'));
      return;
    }

    setLoading(true);

    try {
      const payload = { email, secretCode, newPassword }; // Clinic/staff/doctor only – email reset
      const endpoint = '/auth/reset-password';

      const response = await apiClient.post(endpoint, payload);

      if (response.success) {
        setSuccess(t('auth.passwordResetSuccess'));
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        setError(response.error?.message || 'Failed to reset password');
      }
    } catch (error) {
      setError(error.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='h-screen flex bg-neutral-50 overflow-hidden'>
      {/* Left Side - Background Image Only */}
      <div className='hidden lg:flex lg:w-1/2 relative overflow-hidden border-r border-neutral-200 h-full'>
        {/* Background Image - Optimized with transition */}
        <div className='absolute inset-0 w-full h-full'>
          <ImageTransition
            src='/images/login.png'
            alt='Forgot Password Background'
            fill
            className='object-cover opacity-90'
            quality={75}
            priority
            sizes='50vw'
            style={{ objectFit: 'cover', objectPosition: 'center' }}
          />
        </div>
        {/* Subtle fade overlay */}
        <div className='absolute inset-0 bg-gradient-to-br from-neutral-900/10 via-transparent to-neutral-900/20'></div>
      </div>

      {/* Right Side - Forgot Password Form */}
      <div className='w-full lg:w-1/2 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-neutral-50 via-white to-neutral-50 h-full overflow-y-auto'>
        <div className='w-full max-w-md'>
          {/* Logo for mobile */}
          <div className='lg:hidden mb-8 text-center'>
            <Link href='/' className='inline-flex items-center justify-center group'>
              <div className='flex items-center justify-center group-hover:opacity-90'>
                <ImageTransition
                  src='/images/logoclinic.png'
                  alt='Clinic Logo'
                  width={128}
                  height={112}
                  className='object-contain drop-shadow-md'
                  priority
                  style={{ width: '128px', height: 'auto' }}
                />
              </div>
            </Link>
          </div>

          {/* Language Switcher - Top Right */}
          <div className='absolute top-4 right-4 lg:top-6 lg:right-6 z-50'>
            <LanguageSwitcher />
          </div>

          <FormTransition className='bg-white rounded-2xl border-2 border-neutral-200/80 shadow-2xl p-8 lg:p-10'>
            {/* Logo for desktop - top of form */}
            <div className='hidden lg:flex justify-center mb-8'>
              <Link href='/' className='inline-flex items-center justify-center group'>
                <div className='flex items-center justify-center group-hover:opacity-90'>
                  <ImageTransition
                    src='/images/logoclinic.png'
                    alt='Clinic Logo'
                    width={128}
                    height={112}
                    className='object-contain drop-shadow-sm'
                    priority
                    style={{ width: '128px', height: 'auto' }}
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
                {step === 'request' ? t('auth.forgotPassword') : t('auth.resetPassword')}
              </h2>
              <p
                className='text-neutral-600'
                style={{
                  fontSize: '16px',
                  lineHeight: '24px',
                  fontWeight: '400',
                }}
              >
                {step === 'request'
                  ? t('auth.passwordResetInstructions')
                  : t('auth.enterSecretCode')}
              </p>
            </div>

            {step === 'request' ? (
              <form onSubmit={handleRequestCode} className='space-y-6' noValidate>
                {error && (
                  <div className='bg-status-error/10 border-l-4 border-status-error text-status-error px-4 py-3 rounded-lg flex items-start space-x-2 shadow-sm'>
                    <svg
                      className='icon icon-sm text-status-error mt-0.5 flex-shrink-0'
                      fill='currentColor'
                      viewBox='0 0 20 20'
                    >
                      <path
                        fillRule='evenodd'
                        d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
                        clipRule='evenodd'
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

                {/* Clinic/staff/doctor only – email reset (no patient portal) */}
                <div>
                  <label
                    htmlFor='email'
                    className='block text-sm font-semibold text-neutral-800 mb-2'
                  >
                    {t('auth.emailAddress')}
                  </label>
                  <div className='flex items-stretch border border-neutral-300 rounded-[10px] bg-white overflow-hidden focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/20 form-control-height'>
                    <div className='flex items-center justify-center shrink-0 w-12 min-w-[3rem] pl-3 pr-2 border-r border-neutral-200 bg-neutral-50/50'>
                      <svg
                        className='w-5 h-5 text-neutral-600'
                        fill='none'
                        stroke='currentColor'
                        strokeWidth={2}
                        viewBox='0 0 24 24'
                        aria-hidden
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          d='M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207'
                        />
                      </svg>
                    </div>
                    <div className='flex-1 min-w-0'>
                      <Input
                        id='email'
                        type='email'
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder={t('auth.emailPlaceholder') || 'Enter your email'}
                        autoComplete='email'
                        className='w-full border-0 rounded-none focus:ring-0 focus:shadow-none focus:border-0'
                      />
                    </div>
                  </div>
                </div>

                <Button
                  type='submit'
                  variant='primary'
                  isLoading={loading}
                  disabled={loading}
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
                      d='M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
                    />
                  </svg>
                  {t('auth.sendResetCode')}
                </Button>

                <div className='text-center'>
                  <Link
                    href='/login'
                    className='text-sm text-primary-600 hover:text-primary-700 font-semibold inline-flex items-center gap-1'
                  >
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
                        d='M10 19l-7-7m0 0l7-7m-7 7h18'
                      />
                    </svg>
                    {t('auth.backToLogin')}
                  </Link>
                </div>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className='space-y-6' noValidate>
                {error && (
                  <div className='bg-status-error/10 border-l-4 border-status-error text-status-error px-4 py-3 rounded-lg flex items-start space-x-2 shadow-sm'>
                    <svg
                      className='icon icon-sm text-status-error mt-0.5 flex-shrink-0'
                      fill='currentColor'
                      viewBox='0 0 20 20'
                    >
                      <path
                        fillRule='evenodd'
                        d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
                        clipRule='evenodd'
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

                <div>
                  <label
                    htmlFor='secretCode'
                    className='block text-sm font-semibold text-neutral-800 mb-2'
                  >
                    {t('auth.secretCode')} (6 digits)
                  </label>
                  <Input
                    id='secretCode'
                    type='text'
                    value={secretCode}
                    onChange={(e) => setSecretCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                    placeholder={t('auth.codePlaceholder')}
                    maxLength={6}
                    className='text-center text-2xl tracking-widest font-mono'
                  />
                  <p className='text-sm text-neutral-500 mt-1'>
                    {t('auth.secretCodePlaceholder')} {email}
                  </p>
                </div>

                <div>
                  <label
                    htmlFor='newPassword'
                    className='block text-sm font-semibold text-neutral-800 mb-2'
                  >
                    {t('auth.newPassword')}
                  </label>
                  <div className='flex items-stretch border border-neutral-300 rounded-[10px] bg-white overflow-hidden focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/20 form-control-height'>
                    <div className='flex items-center justify-center shrink-0 w-12 min-w-[3rem] pl-3 pr-2 border-r border-neutral-200 bg-neutral-50/50'>
                      <svg
                        className='w-5 h-5 text-neutral-600'
                        fill='none'
                        stroke='currentColor'
                        strokeWidth={2}
                        viewBox='0 0 24 24'
                        aria-hidden
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
                        />
                      </svg>
                    </div>
                    <div className='flex-1 min-w-0'>
                      <Input
                        id='newPassword'
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        placeholder={t('auth.passwordPlaceholder')}
                        className='w-full border-0 rounded-none focus:ring-0 focus:shadow-none focus:border-0 pr-2'
                      />
                    </div>
                    <button
                      type='button'
                      onClick={() => setShowPassword(!showPassword)}
                      className='w-12 shrink-0 flex items-center justify-center text-neutral-500 hover:text-primary-600 transition-colors'
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <svg
                          className='w-5 h-5'
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
                          className='w-5 h-5'
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

                <div>
                  <label
                    htmlFor='confirmPassword'
                    className='block text-sm font-semibold text-neutral-800 mb-2'
                  >
                    {t('auth.confirmNewPassword')}
                  </label>
                  <div className='flex items-stretch border border-neutral-300 rounded-[10px] bg-white overflow-hidden focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/20 form-control-height'>
                    <div className='flex items-center justify-center shrink-0 w-12 min-w-[3rem] pl-3 pr-2 border-r border-neutral-200 bg-neutral-50/50'>
                      <svg
                        className='w-5 h-5 text-neutral-600'
                        fill='none'
                        stroke='currentColor'
                        strokeWidth={2}
                        viewBox='0 0 24 24'
                        aria-hidden
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                        />
                      </svg>
                    </div>
                    <div className='flex-1 min-w-0'>
                      <Input
                        id='confirmPassword'
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        placeholder={t('auth.passwordPlaceholder')}
                        className='w-full border-0 rounded-none focus:ring-0 focus:shadow-none focus:border-0 pr-2'
                      />
                    </div>
                    <button
                      type='button'
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className='w-12 shrink-0 flex items-center justify-center text-neutral-500 hover:text-primary-600 transition-colors'
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? (
                        <svg
                          className='w-5 h-5'
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
                          className='w-5 h-5'
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
                  isLoading={loading}
                  disabled={loading}
                  className='w-full'
                  size='lg'
                >
                  <span className='flex items-center justify-center'>
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
                    {t('auth.resetPassword')}
                  </span>
                </Button>

                <div className='text-center space-y-2'>
                  <button
                    type='button'
                    onClick={() => {
                      setStep('request');
                      setSecretCode('');
                      setNewPassword('');
                      setConfirmPassword('');
                      setError('');
                      setSuccess('');
                    }}
                    className='text-sm text-primary-600 hover:text-primary-700 font-semibold inline-flex items-center gap-1'
                  >
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
                        d='M10 19l-7-7m0 0l7-7m-7 7h18'
                      />
                    </svg>
                    Back
                  </button>
                  <div>
                    <Link
                      href='/login'
                      className='text-sm text-primary-600 hover:text-primary-700 font-semibold'
                    >
                      {t('auth.backToLogin')}
                    </Link>
                  </div>
                </div>
              </form>
            )}
          </FormTransition>
        </div>
      </div>
    </div>
  );
}
