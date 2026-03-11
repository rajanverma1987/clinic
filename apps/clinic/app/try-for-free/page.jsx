'use client';

import { FormTransition } from '@/components/layout/FormTransition';
import { ImageTransition } from '@/components/layout/ImageTransition';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useI18n } from '@/contexts/I18nContext';
import { apiClient } from '@/lib/api/client';
import { showError, showSuccess } from '@/lib/utils/toast';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const Image = dynamic(() => import('next/image'), { ssr: false });

const STEPS = [
  { id: 1, key: 'tryForFree.stepClinic' },
  { id: 2, key: 'tryForFree.stepDetails' },
  { id: 3, key: 'tryForFree.stepAccount' },
];

const inputWrapperClass =
  'flex items-stretch border border-neutral-300 dark:border-neutral-600 rounded-[10px] bg-white dark:bg-neutral-700/50 overflow-hidden focus-within:border-primary-500 dark:focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-primary-500/20 dark:focus-within:ring-primary-400/20 form-control-height';
const labelClass = 'block text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-2';
const selectClass =
  'w-full border border-neutral-300 dark:border-neutral-600 rounded-[10px] px-3 py-0 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-primary-500 dark:focus:border-primary-400 form-control-height bg-white dark:bg-neutral-700/50';

export default function TryForFreePage() {
  const router = useRouter();
  const { t } = useI18n();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [duplicateEmail, setDuplicateEmail] = useState(false);

  const [data, setData] = useState({
    clinicName: '',
    clinicType: '',
    country: '',
    staffSize: '',
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    timezone: 'America/New_York',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const update = (key, value) => setData((prev) => ({ ...prev, [key]: value }));

  const canProceedStep1 =
    data.clinicName.trim() && data.clinicType && data.country && data.staffSize;
  const canProceedStep2 =
    data.firstName.trim() &&
    data.lastName.trim() &&
    data.phone.trim() &&
    data.address.trim() &&
    data.city.trim() &&
    data.state.trim() &&
    data.zipCode.trim();
  const canProceedStep3 =
    data.email.trim() &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) &&
    data.password.length >= 8 &&
    data.password === data.confirmPassword;

  const handleNext = () => {
    setError('');
    setDuplicateEmail(false);
    if (step === 1 && canProceedStep1) setStep(2);
    else if (step === 2 && canProceedStep2) setStep(3);
  };

  const handleBack = () => {
    setError('');
    setDuplicateEmail(false);
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!canProceedStep3) return;
    setLoading(true);
    try {
      const res = await apiClient.post('/auth/register', {
        clinicName: data.clinicName.trim(),
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: data.email.trim().toLowerCase(),
        password: data.password,
        phone: data.phone.trim(),
        address: data.address.trim(),
        city: data.city.trim(),
        state: data.state.trim(),
        zipCode: data.zipCode.trim(),
        timezone: data.timezone || 'America/New_York',
        region: data.country === 'US' ? 'US' : data.country === 'IN' ? 'IN' : 'APAC',
        trialDays: 90,
      });
      if (res.success) {
        showSuccess(t('tryForFree.successMessage') || 'Account created. Sign in to get started.');
        router.push('/login');
      } else {
        const errMsg = res.error?.message || t('tryForFree.registerFailed');
        setError(errMsg);
        showError(errMsg);
        if (res.error?.code === 'DUPLICATE_EMAIL') {
          setDuplicateEmail(true);
        } else {
          setDuplicateEmail(false);
        }
      }
    } catch (err) {
      const msg = err?.message || t('tryForFree.registerFailed');
      setError(msg);
      showError(msg);
      setDuplicateEmail(false);
    } finally {
      setLoading(false);
    }
  };

  const stepTitle =
    step === 1
      ? t('tryForFree.tellUsAboutClinic') || 'Tell us about your clinic'
      : step === 2
        ? t('tryForFree.contactAndAddress') || 'Contact & address'
        : t('tryForFree.createAccount') || 'Create your account';
  const stepSubtitle =
    step === 1
      ? t('tryForFree.stepClinicDesc') || 'A few quick questions to get started.'
      : step === 2
        ? t('tryForFree.stepDetailsDesc') || 'Where we can reach you and your clinic location.'
        : t('tryForFree.threeMonthsFree') ||
          '3 months free for Solo & Clinic. Payment applies after. Cancel anytime.';

  return (
    <div className='h-screen flex bg-neutral-50 dark:bg-neutral-900 overflow-hidden'>
      {/* Left - Background (same as login) */}
      <div className='hidden lg:flex lg:w-1/2 relative overflow-hidden border-r border-neutral-200 dark:border-neutral-700 h-full'>
        <div className='absolute inset-0 w-full h-full'>
          <ImageTransition
            src='/images/login.png'
            alt={t('common.altRegister')}
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

      {/* Right - Form (same layout as login) */}
      <div className='w-full lg:w-1/2 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-neutral-50 via-white to-neutral-50 dark:bg-neutral-900 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 h-full overflow-y-auto'>
        <div className='w-full max-w-md'>
          {/* Logo mobile */}
          <div className='lg:hidden mb-8 text-center'>
            <Link href='/' className='inline-flex items-center justify-center group'>
              <div className='flex items-center justify-center group-hover:opacity-90 transition-opacity'>
                <Image
                  src='/images/logoclinic.png'
                  alt={t('common.altClinicLogo')}
                  width={180}
                  height={158}
                  className='object-contain drop-shadow-md w-44 max-w-full dark:brightness-0 dark:invert'
                  priority
                />
              </div>
            </Link>
          </div>

          <FormTransition className='bg-white dark:bg-neutral-800 rounded-2xl border-2 border-neutral-200/80 dark:border-neutral-600/80 shadow-2xl p-8 lg:p-10'>
            {/* Logo desktop */}
            <div className='hidden lg:flex justify-center mb-6'>
              <Link href='/' className='inline-flex items-center justify-center group'>
                <div className='flex items-center justify-center group-hover:opacity-90 transition-opacity'>
                  <ImageTransition
                    src='/images/logoclinic.png'
                    alt={t('common.altClinicLogo')}
                    width={180}
                    height={158}
                    className='object-contain drop-shadow-sm w-44 dark:brightness-0 dark:invert'
                    priority
                  />
                </div>
              </Link>
            </div>

            {/* Progress */}
            <div className='flex gap-2 mb-6' aria-hidden>
              {STEPS.map((s) => (
                <div
                  key={s.id}
                  className={`h-1 flex-1 rounded-full ${step >= s.id ? 'bg-primary-500 dark:bg-primary-400' : 'bg-neutral-200 dark:bg-neutral-600'}`}
                />
              ))}
            </div>

            <div className='text-center mb-6'>
              <h2
                className='text-neutral-900 dark:text-neutral-100 mb-2'
                style={{
                  fontSize: '32px',
                  lineHeight: '40px',
                  letterSpacing: '-0.02em',
                  fontWeight: '700',
                }}
              >
                {t('auth.register') || 'Register'}
              </h2>
              <p
                className='text-neutral-600 dark:text-neutral-400'
                style={{
                  fontSize: '16px',
                  lineHeight: '24px',
                  fontWeight: '400',
                }}
              >
                {stepTitle}
              </p>
              <p className='text-neutral-500 dark:text-neutral-400 text-sm mt-1'>{stepSubtitle}</p>
            </div>

            {error && (
              <div className='mb-6 bg-status-error/10 dark:bg-status-error/20 border-l-4 border-status-error text-status-error px-4 py-3 rounded-lg flex flex-col gap-2 shadow-sm'>
                <span className='text-sm font-medium'>{error}</span>
                {duplicateEmail && (
                  <Link
                    href='/login'
                    className='text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-semibold text-sm'
                  >
                    {t('tryForFree.alreadyHaveAccount') || 'Already have an account? Sign in'}
                  </Link>
                )}
              </div>
            )}

            {step === 1 && (
              <div className='space-y-5'>
                <div>
                  <label className={labelClass}>
                    {t('tryForFree.clinicName') || 'Clinic name'} *
                  </label>
                  <div className={inputWrapperClass}>
                    <div className='flex items-center justify-center shrink-0 w-12 min-w-[3rem] pl-3 pr-2 border-r border-neutral-200 dark:border-neutral-600 bg-neutral-50/50 dark:bg-neutral-700'>
                      <svg
                        className='icon icon-sm text-neutral-600 dark:text-neutral-400'
                        fill='none'
                        stroke='currentColor'
                        strokeWidth={2}
                        viewBox='0 0 24 24'
                        aria-hidden
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h3m-3 4h3m4-4h3m3 4h3'
                        />
                      </svg>
                    </div>
                    <Input
                      value={data.clinicName}
                      onChange={(e) => update('clinicName', e.target.value)}
                      placeholder={
                        t('tryForFree.clinicNamePlaceholder') || 'e.g. City Health Clinic'
                      }
                      required
                      className='w-full border-0 rounded-none focus:ring-0 focus:shadow-none focus:border-0'
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>{t('tryForFree.clinicType') || 'Type'} *</label>
                  <select
                    value={data.clinicType}
                    onChange={(e) => update('clinicType', e.target.value)}
                    className={selectClass}
                    required
                  >
                    <option value=''>{t('tryForFree.selectType') || 'Select type'}</option>
                    <option value='general'>
                      {t('tryForFree.typeGeneral') || 'General practice'}
                    </option>
                    <option value='specialist'>
                      {t('tryForFree.typeSpecialist') || 'Specialist'}
                    </option>
                    <option value='dental'>{t('tryForFree.typeDental') || 'Dental'}</option>
                    <option value='other'>{t('tryForFree.typeOther') || 'Other'}</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>{t('tryForFree.country') || 'Country'} *</label>
                  <select
                    value={data.country}
                    onChange={(e) => update('country', e.target.value)}
                    className={selectClass}
                    required
                  >
                    <option value=''>{t('tryForFree.selectCountry') || 'Select country'}</option>
                    <option value='US'>{t('tryForFree.countryUS')}</option>
                    <option value='IN'>{t('tryForFree.countryIN')}</option>
                    <option value='CA'>{t('tryForFree.countryCA')}</option>
                    <option value='AU'>{t('tryForFree.countryAU')}</option>
                    <option value='UK'>{t('tryForFree.countryUK')}</option>
                    <option value='OTHER'>{t('tryForFree.other') || 'Other'}</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>
                    {t('tryForFree.staffSize') || 'Staff size'} *
                  </label>
                  <select
                    value={data.staffSize}
                    onChange={(e) => update('staffSize', e.target.value)}
                    className={selectClass}
                    required
                  >
                    <option value=''>{t('tryForFree.selectSize') || 'Select size'}</option>
                    <option value='1-5'>1–5</option>
                    <option value='6-20'>6–20</option>
                    <option value='21-50'>21–50</option>
                    <option value='50+'>50+</option>
                  </select>
                </div>
                <div className='flex gap-3 pt-2'>
                  <Link href='/login' className='flex-1'>
                    <Button type='button' variant='secondary' className='w-full' size='lg'>
                      {t('auth.login') || 'Login'}
                    </Button>
                  </Link>
                  <Button
                    type='button'
                    variant='primary'
                    onClick={handleNext}
                    disabled={!canProceedStep1}
                    className='flex-1'
                    size='lg'
                  >
                    {t('tryForFree.next') || 'Next'}
                  </Button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className='space-y-5'>
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <label className={labelClass}>{t('auth.firstName') || 'First name'} *</label>
                    <Input
                      value={data.firstName}
                      onChange={(e) => update('firstName', e.target.value)}
                      required
                      className='border border-neutral-300 dark:border-neutral-600 rounded-[10px] bg-white dark:bg-neutral-700/50 form-control-height'
                    />
                  </div>
                  <div>
                    <label className={labelClass}>{t('auth.lastName') || 'Last name'} *</label>
                    <Input
                      value={data.lastName}
                      onChange={(e) => update('lastName', e.target.value)}
                      required
                      className='border border-neutral-300 dark:border-neutral-600 rounded-[10px] bg-white dark:bg-neutral-700/50 form-control-height'
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>{t('tryForFree.phone') || 'Phone'} *</label>
                  <div className={inputWrapperClass}>
                    <div className='flex items-center justify-center shrink-0 w-12 min-w-[3rem] pl-3 pr-2 border-r border-neutral-200 dark:border-neutral-600 bg-neutral-50/50 dark:bg-neutral-700'>
                      <svg
                        className='icon icon-sm text-neutral-600 dark:text-neutral-400'
                        fill='none'
                        stroke='currentColor'
                        strokeWidth={2}
                        viewBox='0 0 24 24'
                        aria-hidden
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          d='M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z'
                        />
                      </svg>
                    </div>
                    <Input
                      type='tel'
                      value={data.phone}
                      onChange={(e) => update('phone', e.target.value)}
                      placeholder={t('tryForFree.phonePlaceholder')}
                      required
                      className='w-full border-0 rounded-none focus:ring-0 focus:shadow-none focus:border-0'
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>{t('tryForFree.address') || 'Address'} *</label>
                  <Input
                    value={data.address}
                    onChange={(e) => update('address', e.target.value)}
                    placeholder={t('tryForFree.addressPlaceholder') || 'Street address'}
                    required
                    className='border border-neutral-300 dark:border-neutral-600 rounded-[10px] bg-white dark:bg-neutral-700/50 form-control-height'
                  />
                </div>
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <label className={labelClass}>{t('tryForFree.city') || 'City'} *</label>
                    <Input
                      value={data.city}
                      onChange={(e) => update('city', e.target.value)}
                      required
                      className='border border-neutral-300 dark:border-neutral-600 rounded-[10px] bg-white dark:bg-neutral-700/50 form-control-height'
                    />
                  </div>
                  <div>
                    <label className={labelClass}>
                      {t('tryForFree.state') || 'State / Province'} *
                    </label>
                    <Input
                      value={data.state}
                      onChange={(e) => update('state', e.target.value)}
                      required
                      className='border border-neutral-300 dark:border-neutral-600 rounded-[10px] bg-white dark:bg-neutral-700/50 form-control-height'
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>
                    {t('tryForFree.zipCode') || 'ZIP / Postal code'} *
                  </label>
                  <Input
                    value={data.zipCode}
                    onChange={(e) => update('zipCode', e.target.value)}
                    required
                    className='border border-neutral-300 dark:border-neutral-600 rounded-[10px] bg-white dark:bg-neutral-700/50 form-control-height'
                  />
                </div>
                <div className='flex gap-3 pt-2'>
                  <Button
                    type='button'
                    variant='secondary'
                    onClick={handleBack}
                    className='flex-1'
                    size='lg'
                  >
                    {t('common.back') || 'Back'}
                  </Button>
                  <Button
                    type='button'
                    variant='primary'
                    onClick={handleNext}
                    disabled={!canProceedStep2}
                    className='flex-1'
                    size='lg'
                  >
                    {t('tryForFree.next') || 'Next'}
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <form onSubmit={handleSubmit} className='space-y-5' noValidate>
                <div>
                  <label htmlFor='reg-email' className={labelClass}>
                    {t('auth.email') || 'Email'} *
                  </label>
                  <div className={inputWrapperClass}>
                    <div className='flex items-center justify-center shrink-0 w-12 min-w-[3rem] pl-3 pr-2 border-r border-neutral-200 dark:border-neutral-600 bg-neutral-50/50 dark:bg-neutral-700'>
                      <svg
                        className='icon icon-sm text-neutral-600 dark:text-neutral-400'
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
                    <Input
                      id='reg-email'
                      type='email'
                      value={data.email}
                      onChange={(e) => update('email', e.target.value)}
                      required
                      placeholder={t('auth.emailPlaceholder') || 'you@example.com'}
                      autoComplete='email'
                      className='w-full border-0 rounded-none focus:ring-0 focus:shadow-none focus:border-0'
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor='reg-password' className={labelClass}>
                    {t('auth.password') || 'Password'} * (min 8 characters)
                  </label>
                  <div className={inputWrapperClass}>
                    <div className='flex items-center justify-center shrink-0 w-12 min-w-[3rem] pl-3 pr-2 border-r border-neutral-200 dark:border-neutral-600 bg-neutral-50/50 dark:bg-neutral-700'>
                      <svg
                        className='icon icon-sm text-neutral-600 dark:text-neutral-400'
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
                    <Input
                      id='reg-password'
                      type='password'
                      value={data.password}
                      onChange={(e) => update('password', e.target.value)}
                      minLength={8}
                      required
                      placeholder={t('auth.passwordPlaceholder') || '••••••••'}
                      autoComplete='new-password'
                      className='w-full border-0 rounded-none focus:ring-0 focus:shadow-none focus:border-0'
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor='reg-confirm' className={labelClass}>
                    {t('auth.confirmPassword') || 'Confirm password'} *
                  </label>
                  <div className={inputWrapperClass}>
                    <div className='flex items-center justify-center shrink-0 w-12 min-w-[3rem] pl-3 pr-2 border-r border-neutral-200 dark:border-neutral-600 bg-neutral-50/50 dark:bg-neutral-700'>
                      <svg
                        className='icon icon-sm text-neutral-600 dark:text-neutral-400'
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
                    <Input
                      id='reg-confirm'
                      type='password'
                      value={data.confirmPassword}
                      onChange={(e) => update('confirmPassword', e.target.value)}
                      required
                      placeholder={t('auth.confirmPassword') || 'Confirm password'}
                      autoComplete='new-password'
                      className='w-full border-0 rounded-none focus:ring-0 focus:shadow-none focus:border-0'
                    />
                  </div>
                </div>
                <div className='flex gap-3 pt-2'>
                  <Button
                    type='button'
                    variant='secondary'
                    onClick={handleBack}
                    className='flex-1'
                    size='lg'
                  >
                    {t('common.back') || 'Back'}
                  </Button>
                  <Button
                    type='submit'
                    variant='primary'
                    isLoading={loading}
                    disabled={loading || !canProceedStep3}
                    className='flex-1'
                    size='lg'
                  >
                    {loading
                      ? t('common.creating') || 'Creating…'
                      : t('tryForFree.createAccount') || 'Create account'}
                  </Button>
                </div>
              </form>
            )}
          </FormTransition>

          <div className='mt-8 text-center'>
            <p className='text-sm text-neutral-700 dark:text-neutral-300'>
              {t('tryForFree.cancelAnytime') || 'You can cancel your subscription anytime.'}
            </p>
            <p className='text-neutral-500 dark:text-neutral-400 mt-2 text-sm'>
              {t('auth.alreadyHaveAccount') || 'Already have an account? '}
              <Link href='/login' className='text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-semibold'>
                {t('auth.signIn') || 'Sign in'}
              </Link>
            </p>
            <p className='text-neutral-500 dark:text-neutral-400 mt-2' style={{ fontSize: '10px', lineHeight: '14px' }}>
              By signing up, you agree to our{' '}
              <Link
                href='/legal'
                className='text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium underline'
                style={{ fontSize: '10px' }}
              >
                Legal Information & Disclaimers
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
