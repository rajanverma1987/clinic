'use client';

import { FormTransition } from '@/components/layout/FormTransition';
import { ImageTransition } from '@/components/layout/ImageTransition';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { validateForm } from '@/lib/utils/form-validation';
import { showError } from '@/lib/utils/toast';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';

const Image = dynamic(() => import('next/image'), { ssr: false });

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reasonClinicOnly = searchParams.get('reason') === 'clinic_only';
  const { login, verify2FA, completeOAuthLogin, user, loading } = useAuth();
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const formRef = useRef(null);

  const getRoleHomePage = (role) => {
    const roleRoutes = {
      super_admin: '/admin',
      clinic_admin: '/dashboard',
      admin: '/dashboard',
      manager: '/dashboard',
      doctor: '/doctors/profile',
      nurse: '/patients',
      receptionist: '/appointments',
      pharmacist: '/inventory',
      lab_tech: '/inventory',
    };
    if (!roleRoutes[role]) return '/dashboard';
    return roleRoutes[role];
  };

  // Load remembered email on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const rememberedEmail = localStorage.getItem('rememberedEmail');
      if (rememberedEmail) {
        setEmail(rememberedEmail);
        setRememberMe(true);
      }
    }
  }, []);

  // Handle OAuth callback: read token from cookie, complete login, redirect
  useEffect(() => {
    if (loading) return;
    const oauthSuccess = searchParams.get('oauth') === 'success';
    const oauthError = searchParams.get('oauth_error');
    if (oauthError) {
      setError(decodeURIComponent(oauthError));
      window.history.replaceState({}, '', '/login');
      return;
    }
    if (!oauthSuccess || typeof document === 'undefined') return;

    const match = document.cookie.match(/oauth_at=([^;]+)/);
    const token = match ? match[1].trim() : null;
    if (!token) {
      setError(t('auth.oauthTokenMissing') || 'Sign-in link expired. Please try again.');
      window.history.replaceState({}, '', '/login');
      return;
    }
    document.cookie = 'oauth_at=; Path=/; Max-Age=0';
    window.history.replaceState({}, '', '/login');

    let cancelled = false;
    (async () => {
      const result = await completeOAuthLogin(token);
      if (cancelled) return;
      if (result.success && result.user) {
        router.push(getRoleHomePage(result.user.role));
      } else {
        setError(result.error || t('auth.loginFailed'));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [searchParams, loading, completeOAuthLogin, router, t]);

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user && searchParams.get('oauth') !== 'success') {
      router.push(getRoleHomePage(user.role));
    }
  }, [user, loading, router, searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Custom validation
    if (formRef.current) {
      const validation = validateForm(formRef.current, true);
      if (!validation.isValid) {
        return;
      }
    }

    // Manual validation as fallback
    if (!email || !email.trim()) {
      showError(t('auth.emailRequired'));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showError(t('errors.pleaseEnterValidEmail'));
      return;
    }
    if (!password || !password.trim()) {
      showError(t('auth.passwordRequired'));
      return;
    }

    setIsLoading(true);

    const result = await login(email, password, rememberMe);

    if (result.success) {
      // Check if 2FA is required
      if (result.require2FA) {
        setShowOtp(true);
        setPendingEmail(email);
        setPassword(''); // Clear password for security
        setIsLoading(false);
        return;
      }

      // Handle remember me
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      // Ensure tokens are stored before redirect - verify token is actually stored
      let tokenStored = false;
      let attempts = 0;
      while (!tokenStored && attempts < 10) {
        await new Promise((resolve) => setTimeout(resolve, 50));
        const storedToken =
          typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
        if (storedToken) {
          tokenStored = true;
        }
        attempts++;
      }

      if (!tokenStored) {
        // Token not in localStorage; redirect anyway
      }

      // Check if password change is required
      if (result.forcePasswordChange) {
        router.push('/change-password?firstLogin=true');
      } else {
        // Redirect based on role
        const redirectPath = getRoleHomePage(result.user?.role || '');
        router.push(redirectPath);
      }
    } else {
      setError(result.error || t('auth.loginFailed'));
    }

    setIsLoading(false);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await verify2FA(pendingEmail || email, otp, rememberMe);

    if (result.success) {
      // Handle remember me
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', pendingEmail || email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      // Ensure tokens are stored before redirect - verify token is actually stored
      let tokenStored = false;
      let attempts = 0;
      while (!tokenStored && attempts < 10) {
        await new Promise((resolve) => setTimeout(resolve, 50));
        const storedToken =
          typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
        if (storedToken) {
          tokenStored = true;
        }
        attempts++;
      }

      if (!tokenStored) {
        // Token not in localStorage; redirect anyway
      }

      // Check if password change is required
      if (result.forcePasswordChange) {
        router.push('/change-password?firstLogin=true');
      } else {
        router.push(getRoleHomePage(result.user?.role || ''));
      }
    } else {
      setError(result.error || 'Invalid verification code');
    }

    setIsLoading(false);
  };

  // Show nothing while checking auth or redirecting
  if (loading || user) {
    return null;
  }

  return (
    <div className='h-screen flex bg-neutral-50 overflow-hidden'>
      {/* Left Side - Background Image Only */}
      <div className='hidden lg:flex lg:w-1/2 relative overflow-hidden border-r border-neutral-200 h-full'>
        {/* Background Image */}
        <div className='absolute inset-0 w-full h-full'>
          <ImageTransition
            src='/images/login.png'
            alt={t('common.altLoginBackground')}
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

      {/* Right Side - Login Form */}
      <div className='w-full lg:w-1/2 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-neutral-50 via-white to-neutral-50 h-full overflow-y-auto'>
        <div className='w-full max-w-md'>
          {reasonClinicOnly && (
            <div className='mb-4 p-3 rounded-lg bg-primary-50 border border-primary-200 text-primary-800 text-sm'>
              {t('auth.clinicOnlyNotice')}
            </div>
          )}
          {/* Logo for mobile */}
          <div className='lg:hidden mb-8 text-center'>
            <Link href='/' className='inline-flex items-center justify-center group'>
              <div className='flex items-center justify-center group-hover:opacity-90 transition-opacity'>
                <Image
                  src='/images/logoclinic.png'
                  alt={t('common.altClinicLogo')}
                  width={232}
                  height={203}
                  className='object-contain drop-shadow-md w-[14.5rem] max-w-full'
                  priority
                />
              </div>
            </Link>
          </div>

          <FormTransition className='bg-white rounded-2xl border-2 border-neutral-200/80 shadow-2xl p-8 lg:p-10'>
            {/* Logo for desktop - top of form */}
            <div className='hidden lg:flex justify-center mb-8'>
              <Link href='/' className='inline-flex items-center justify-center group'>
                <div className='flex items-center justify-center group-hover:opacity-90 transition-opacity'>
                  <ImageTransition
                    src='/images/logoclinic.png'
                    alt={t('common.altClinicLogo')}
                    width={232}
                    height={203}
                    className='object-contain drop-shadow-sm w-[14.5rem]'
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
                {t('auth.login')}
              </h2>
              <p
                className='text-neutral-600'
                style={{
                  fontSize: '16px',
                  lineHeight: '24px',
                  fontWeight: '400',
                }}
              >
                {t('auth.signInToAccount')}
              </p>
            </div>

            {!showOtp ? (
              <form ref={formRef} onSubmit={handleSubmit} className='space-y-6' noValidate>
                {error && (
                  <div className='bg-status-error/10 border-l-4 border-status-error text-status-error px-4 py-3 rounded-lg flex items-start space-x-2 shadow-sm animate-fade-in slide-in-right'>
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

                <div>
                  <label
                    htmlFor='email'
                    className='block text-sm font-semibold text-neutral-800 mb-2'
                  >
                    {t('auth.email')}
                  </label>
                  <div className='flex items-stretch border border-neutral-300 rounded-[10px] bg-white overflow-hidden focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/20 form-control-height'>
                    <div className='flex items-center justify-center shrink-0 w-12 min-w-[3rem] pl-3 pr-2 border-r border-neutral-200 bg-neutral-50/50'>
                      <svg
                        className='icon icon-sm text-neutral-600'
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
                        placeholder={t('auth.emailPlaceholder')}
                        autoComplete='email'
                        className='w-full border-0 rounded-none focus:ring-0 focus:shadow-none focus:border-0'
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor='password'
                    className='block text-sm font-semibold text-neutral-800 mb-2'
                  >
                    {t('auth.password')}
                  </label>
                  <div className='flex items-stretch border border-neutral-300 rounded-[10px] bg-white overflow-hidden focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/20 form-control-height'>
                    <div className='flex items-center justify-center shrink-0 w-12 min-w-[3rem] pl-3 pr-2 border-r border-neutral-200 bg-neutral-50/50'>
                      <svg
                        className='icon icon-sm text-neutral-600'
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
                        id='password'
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder={t('auth.passwordPlaceholder')}
                        autoComplete='current-password'
                        className='w-full border-0 rounded-none focus:ring-0 focus:shadow-none focus:border-0 pr-2'
                      />
                    </div>
                    <Button
                      type='button'
                      variant='ghost'
                      size='sm'
                      className='w-12 shrink-0 min-w-0 flex items-center justify-center text-neutral-500 hover:text-primary-600'
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                    >
                      {showPassword ? (
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

                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3 group'>
                    <Checkbox
                      id='rememberMe'
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      size='sm'
                    />
                    <label
                      htmlFor='rememberMe'
                      className='text-sm text-neutral-700 group-hover:text-neutral-900 font-medium transition-colors cursor-pointer'
                    >
                      {t('auth.rememberMe')}
                    </label>
                  </div>
                  <Link
                    href='/forgot-password'
                    className='text-sm text-primary-600 hover:text-primary-700 font-semibold flex items-center group transition-colors'
                  >
                    <svg
                      className='icon icon-xs mr-1 group-hover:translate-x-1 transition-transform'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z'
                      />
                    </svg>
                    {t('auth.forgotPassword')}
                  </Link>
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
                      d='M13 7l5 5m0 0l-5 5m5-5H6'
                    />
                  </svg>
                  {t('auth.signIn')}
                </Button>

                <div className='relative my-6'>
                  <div className='absolute inset-0 flex items-center'>
                    <div className='w-full border-t border-neutral-200' />
                  </div>
                  <div className='relative flex justify-center text-sm'>
                    <span className='px-3 bg-white text-neutral-500'>
                      {t('auth.orContinueWith') || 'Or continue with'}
                    </span>
                  </div>
                </div>
                <Button
                  type='button'
                  variant='secondary'
                  className='w-full'
                  size='lg'
                  onClick={() => {
                    window.location.href = '/api/auth/oauth/google';
                  }}
                  disabled={isLoading}
                >
                  <svg className='icon icon-sm mr-2' viewBox='0 0 24 24' aria-hidden>
                    <path
                      fill='#4285F4'
                      d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
                    />
                    <path
                      fill='#34A853'
                      d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
                    />
                    <path
                      fill='#FBBC05'
                      d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
                    />
                    <path
                      fill='#EA4335'
                      d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
                    />
                  </svg>
                  {t('auth.continueWithGoogle') || 'Continue with Google'}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className='space-y-6' noValidate>
                <div className='text-center mb-4'>
                  <div className='inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4'>
                    <svg
                      className='icon icon-lg text-primary-600'
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
                  <h3
                    className='text-neutral-900 mb-2'
                    style={{
                      fontSize: '24px',
                      lineHeight: '32px',
                      fontWeight: '600',
                    }}
                  >
                    {t('auth.twoFactorAuthentication')}
                  </h3>
                  <p
                    className='text-neutral-600'
                    style={{
                      fontSize: '14px',
                      lineHeight: '20px',
                    }}
                  >
                    Enter the 6-digit code from your authenticator app
                  </p>
                </div>

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

                <div>
                  <label
                    htmlFor='otp'
                    className='block text-sm font-semibold text-neutral-800 mb-2'
                  >
                    {t('auth.secretCode')}
                  </label>
                  <Input
                    id='otp'
                    type='text'
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                    placeholder={t('auth.codePlaceholder')}
                    maxLength={6}
                    className='text-center text-2xl tracking-widest font-mono'
                    autoFocus
                  />
                </div>

                <Button
                  type='submit'
                  variant='primary'
                  isLoading={isLoading}
                  disabled={isLoading || otp.length !== 6}
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
                  Verify Code
                </Button>

                <Button
                  type='button'
                  variant='secondary'
                  onClick={() => {
                    setShowOtp(false);
                    setOtp('');
                    setError('');
                    setPendingEmail('');
                  }}
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
                      d='M10 19l-7-7m0 0l7-7m-7 7h18'
                    />
                  </svg>
                  {t('auth.backToLogin')}
                </Button>
              </form>
            )}

            {!showOtp && (
              <>
                <div className='mt-8'>
                  <div className='relative'>
                    <div className='absolute inset-0 flex items-center'>
                      <div className='w-full border-t border-neutral-200'></div>
                    </div>
                  </div>

                  <div className='mt-6 grid grid-cols-2 gap-4'>
                    <Button type='button' variant='secondary' size='sm' className='w-full'>
                      <svg className='icon icon-sm group-hover:scale-110' viewBox='0 0 24 24'>
                        <path
                          fill='#4285F4'
                          d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
                        />
                        <path
                          fill='#34A853'
                          d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
                        />
                        <path
                          fill='#FBBC05'
                          d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
                        />
                        <path
                          fill='#EA4335'
                          d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
                        />
                      </svg>
                      <span className='ml-2'>{t('auth.providerGoogle')}</span>
                    </Button>
                    <Button type='button' variant='secondary' size='sm' className='w-full'>
                      <svg
                        className='icon icon-sm group-hover:scale-110 transition-transform'
                        fill='none'
                        stroke='currentColor'
                        strokeWidth={2}
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          d='M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5'
                        />
                      </svg>
                      <span className='ml-2'>{t('auth.providerGitHub')}</span>
                    </Button>
                  </div>
                </div>

                <div className='mt-8 text-center'>
                  <p className='text-sm text-neutral-700'>
                    {t('auth.noPublicSignup') ||
                      'Clinics are provisioned by admin. Contact your administrator or '}
                    <Link
                      href='/pricing'
                      className='text-primary-600 hover:text-primary-700 font-bold transition-colors'
                    >
                      {t('auth.contactSales')}
                    </Link>
                    .
                  </p>
                  <p
                    className='text-neutral-500 mt-2'
                    style={{ fontSize: '10px', lineHeight: '14px' }}
                  >
                    By signing in, you agree to our{' '}
                    <Link
                      href='/legal'
                      className='text-primary-600 hover:text-primary-700 font-medium underline'
                      style={{ fontSize: '10px' }}
                    >
                      Legal Information & Disclaimers
                    </Link>
                  </p>
                </div>
              </>
            )}
          </FormTransition>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className='min-h-screen flex items-center justify-center bg-neutral-50'>
          <div className='animate-pulse rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent' />
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
