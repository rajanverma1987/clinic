'use client';

import { FormTransition } from '@/components/layout/FormTransition';
import { ImageTransition } from '@/components/layout/ImageTransition';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Input } from '@/components/ui/Input';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { validateForm } from '@/lib/utils/form-validation';
import { showError } from '@/lib/utils/toast';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const { login, user, loading } = useAuth();
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const formRef = useRef(null);

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

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

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
      showError(t('auth.email') + ' is required');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showError('Please enter a valid email address');
      return;
    }
    if (!password || !password.trim()) {
      showError(t('auth.password') + ' is required');
      return;
    }

    setIsLoading(true);

    const result = await login(email, password);

    if (result.success) {
      // Handle remember me
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }
      router.push('/dashboard');
    } else {
      setError(result.error || t('auth.loginFailed'));
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
            alt='Login Background'
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
          {/* Logo for mobile */}
          <div className='lg:hidden mb-8 text-center'>
            <Link href='/' className='inline-flex items-center justify-center group'>
              <div className='flex items-center justify-center group-hover:opacity-90 transition-opacity'>
                <Image
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

          <FormTransition className='bg-white rounded-2xl border-2 border-neutral-200/80 shadow-2xl p-8 lg:p-10'>
            {/* Logo for desktop - top of form */}
            <div className='hidden lg:flex justify-center mb-8'>
              <Link href='/' className='inline-flex items-center justify-center group'>
                <div className='flex items-center justify-center group-hover:opacity-90 transition-opacity'>
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

            <form ref={formRef} onSubmit={handleSubmit} className='space-y-6' noValidate>
              {error && (
                <div className='bg-status-error/10 border-l-4 border-status-error text-status-error px-4 py-3 rounded-lg flex items-start space-x-2 shadow-sm animate-fade-in slide-in-right'>
                  <svg
                    width='20px'
                    height='20px'
                    className='text-status-error mt-0.5 flex-shrink-0'
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

              <div>
                <label
                  htmlFor='email'
                  className='block text-sm font-semibold text-neutral-800 mb-2'
                >
                  {t('auth.email')}
                </label>
                <div className='relative'>
                  <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                    <svg
                      width='20px'
                      height='20px'
                      className='text-neutral-900'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207'
                      />
                    </svg>
                  </div>
                  <Input
                    id='email'
                    type='email'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder='you@example.com'
                    autoComplete='email'
                    className='pl-10'
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor='password'
                  className='block text-sm font-semibold text-neutral-800 mb-2'
                >
                  {t('auth.password')}
                </label>
                <div className='relative'>
                  <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                    <svg
                      width='20px'
                      height='20px'
                      className='text-neutral-900'
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
                    id='password'
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder='••••••••'
                    autoComplete='current-password'
                    className='pl-10 pr-10'
                  />
                  <button
                    type='button'
                    onClick={() => setShowPassword(!showPassword)}
                    className='absolute inset-y-0 right-0 pr-3 flex items-center text-primary-500 hover:text-primary-600 transition-colors'
                  >
                    {showPassword ? (
                      <svg
                        width='20px'
                        height='20px'
                        className=''
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
                        width='20px'
                        height='20px'
                        className=''
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
                    width='16px'
                    height='16px'
                    className='mr-1 group-hover:translate-x-1 transition-transform'
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
                  width='20px'
                  height='20px'
                  className='mr-2'
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
            </form>

            <div className='mt-8'>
              <div className='relative'>
                <div className='absolute inset-0 flex items-center'>
                  <div className='w-full border-t border-neutral-200'></div>
                </div>
              </div>

              <div className='mt-6 grid grid-cols-2 gap-4'>
                <button
                  type='button'
                  className='w-full inline-flex justify-center items-center px-4 py-2.5 border-2 border-neutral-200 rounded-lg shadow-sm bg-white text-sm font-semibold text-neutral-800 hover:bg-primary-50 hover:border-primary-300 hover:shadow-md hover:text-primary-700 transition-all duration-300 group'
                >
                  <svg width='20px' height='20px' className='group-hover:scale-110' viewBox='0 0 24 24'>
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
                  <span className='ml-2'>Google</span>
                </button>
                <button
                  type='button'
                  className='w-full inline-flex justify-center items-center px-4 py-2.5 border-2 border-neutral-200 rounded-lg shadow-sm bg-white text-sm font-semibold text-neutral-800 hover:bg-secondary-50 hover:border-secondary-300 hover:shadow-md hover:text-secondary-700 group'
                >
                  <svg
                    width='20px'
                    height='20px'
                    className='group-hover:scale-110 transition-transform'
                    fill='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path d='M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z' />
                  </svg>
                  <span className='ml-2'>GitHub</span>
                </button>
              </div>
            </div>

            <div className='mt-8 text-center'>
              <p className='text-sm text-neutral-700'>
                {t('auth.dontHaveAccount')}{' '}
                <Link
                  href='/register'
                  className='text-primary-600 hover:text-primary-700 font-bold transition-colors'
                >
                  {t('auth.createAccount')}
                </Link>
              </p>
              <p className='text-neutral-500 mt-2' style={{ fontSize: '10px', lineHeight: '14px' }}>
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
            <div className='mt-4 flex justify-center'>
              <LanguageSwitcher />
            </div>
          </FormTransition>
        </div>
      </div>
    </div>
  );
}
