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
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

export default function RegisterPage() {
  const router = useRouter();
  const { register, user, loading } = useAuth();
  const { t, locale } = useI18n();
  
  // Personal Information
  const [personalInfo, setPersonalInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  // Clinic Information
  const [clinicInfo, setClinicInfo] = useState({
    clinicName: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US',
    phone: '',
    email: '',
    region: 'US',
    timezone: 'America/New_York',
    currency: 'USD',
    locale: 'en-US',
  });

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // 1: Personal, 2: Clinic, 3: Review
  const formRef = useRef(null);

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  const validatePersonalInfo = () => {
    if (!personalInfo.firstName || !personalInfo.firstName.trim()) {
      showError(t('auth.firstName') + ' ' + t('common.isRequired') || 'First name is required');
      return false;
    }
    if (!personalInfo.lastName || !personalInfo.lastName.trim()) {
      showError(t('auth.lastName') + ' ' + t('common.isRequired') || 'Last name is required');
      return false;
    }
    if (!personalInfo.email || !personalInfo.email.trim()) {
      showError(t('auth.emailRequired') || 'Email is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personalInfo.email)) {
      showError(t('auth.invalidEmail') || 'Please enter a valid email address');
      return false;
    }
    if (!personalInfo.phone || !personalInfo.phone.trim()) {
      showError(t('auth.phoneNumber') + ' ' + t('common.isRequired') || 'Phone number is required');
      return false;
    }
    if (!personalInfo.password || !personalInfo.password.trim()) {
      showError(t('auth.passwordRequired') || 'Password is required');
      return false;
    }
    if (personalInfo.password.length < 8) {
      showError(t('auth.passwordMinLength') || 'Password must be at least 8 characters');
      return false;
    }
    if (personalInfo.password !== personalInfo.confirmPassword) {
      showError(t('auth.passwordMismatch') || 'Passwords do not match');
      return false;
    }
    return true;
  };

  const validateClinicInfo = () => {
    if (!clinicInfo.clinicName || !clinicInfo.clinicName.trim()) {
      showError(t('auth.clinicName') + ' ' + t('common.isRequired') || 'Clinic name is required');
      return false;
    }
    if (!clinicInfo.address || !clinicInfo.address.trim()) {
      showError(t('auth.clinicAddress') + ' ' + t('common.isRequired') || 'Clinic address is required');
      return false;
    }
    if (!clinicInfo.city || !clinicInfo.city.trim()) {
      showError(t('auth.city') + ' ' + t('common.isRequired') || 'City is required');
      return false;
    }
    if (!clinicInfo.state || !clinicInfo.state.trim()) {
      showError(t('auth.stateProvince') + ' ' + t('common.isRequired') || 'State/Province is required');
      return false;
    }
    if (!clinicInfo.zipCode || !clinicInfo.zipCode.trim()) {
      showError(t('auth.zipPostalCode') + ' ' + t('common.isRequired') || 'ZIP/Postal code is required');
      return false;
    }
    if (!clinicInfo.phone || !clinicInfo.phone.trim()) {
      showError(t('auth.clinicPhone') + ' ' + t('common.isRequired') || 'Clinic phone number is required');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (validatePersonalInfo()) {
        setCurrentStep(2);
      }
    } else if (currentStep === 2) {
      if (validateClinicInfo()) {
        setCurrentStep(3);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');


    if (!validatePersonalInfo() || !validateClinicInfo()) {
      return;
    }

    setIsLoading(true);

    // Registration creates clinic admin account with clinic
    // Use current language selection from i18n context
    const result = await register({
      // Personal info
      email: personalInfo.email,
      password: personalInfo.password,
      firstName: personalInfo.firstName,
      lastName: personalInfo.lastName,
      phone: personalInfo.phone,
      role: 'clinic_admin', // Only clinic admins can register (they create the clinic)
      // Clinic info
      clinicName: clinicInfo.clinicName,
      address: clinicInfo.address,
      city: clinicInfo.city,
      state: clinicInfo.state,
      zipCode: clinicInfo.zipCode,
      country: clinicInfo.country,
      clinicPhone: clinicInfo.phone,
      clinicEmail: clinicInfo.email || personalInfo.email,
      region: clinicInfo.region,
      timezone: clinicInfo.timezone,
      currency: clinicInfo.currency,
      locale: locale || 'en', // Use current language selection from i18n
    });

    if (result.success) {
      router.push('/dashboard');
    } else {
      setError(result.error || t('auth.registerFailed'));
    }

    setIsLoading(false);
  };

  // Show nothing while checking auth or redirecting
  if (loading || user) {
    return null;
  }

  const regions = [
    { value: 'US', label: 'United States' },
    { value: 'CA', label: 'Canada' },
    { value: 'EU', label: 'Europe' },
    { value: 'IN', label: 'India' },
    { value: 'APAC', label: 'Asia Pacific' },
    { value: 'ME', label: 'Middle East' },
    { value: 'AU', label: 'Australia' },
  ];

  const timezones = [
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'America/Chicago', label: 'Central Time (CT)' },
    { value: 'America/Denver', label: 'Mountain Time (MT)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
    { value: 'America/Toronto', label: 'Toronto' },
    { value: 'Europe/London', label: 'London' },
    { value: 'Europe/Paris', label: 'Paris' },
    { value: 'Asia/Kolkata', label: 'India (IST)' },
    { value: 'Asia/Dubai', label: 'Dubai' },
    { value: 'Australia/Sydney', label: 'Sydney' },
  ];

  return (
    <div className='h-screen flex bg-neutral-50 overflow-hidden'>
      {/* Left Side - Background Image Only */}
      <div className='hidden lg:flex lg:w-1/2 relative overflow-hidden border-r border-neutral-200 h-full'>
        <div className='absolute inset-0 w-full h-full'>
          <ImageTransition
            src='/images/login.png'
            alt='Register Background'
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

      {/* Right Side - Register Form */}
      <div className='w-full lg:w-1/2 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-neutral-50 via-white to-neutral-50 h-full overflow-y-auto'>
        <div className='w-full max-w-2xl'>
          {/* Logo for mobile */}
          <div className='lg:hidden mb-8 text-center'>
            <Link href='/' className='inline-flex items-center justify-center group'>
              <div className='flex items-center justify-center group-hover:opacity-90 transition-opacity'>
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

          {/* Language Switcher */}
          <div className='absolute top-4 right-4 lg:top-6 lg:right-6 z-50'>
            <LanguageSwitcher />
          </div>

          <FormTransition className='bg-white rounded-2xl border-2 border-neutral-200/80 shadow-2xl p-8 lg:p-10'>
            {/* Logo for desktop */}
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
                {t('auth.registerYourClinic') || 'Register Your Clinic'}
              </h2>
              <p
                className='text-neutral-600'
                style={{
                  fontSize: '16px',
                  lineHeight: '24px',
                  fontWeight: '400',
                }}
              >
                {t('auth.stepOf', { step: currentStep, total: 3 }) || `Step ${currentStep} of 3`}: {currentStep === 1 ? (t('auth.personalInformation') || 'Personal Information') : currentStep === 2 ? (t('auth.clinicDetails') || 'Clinic Details') : (t('auth.reviewSubmit') || 'Review & Submit')}
              </p>
              <div className='mt-4 flex items-center justify-center gap-2 text-sm text-neutral-500'>
                <svg width='20px' height='20px' className='text-neutral-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 5h12M9 3v6m6-3v6m-6 9v-6m6 6v-6M3 12h18M3 18h18' />
                </svg>
                <span>{t('auth.selectLanguage') || 'Select your language'}</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className='mb-8'>
              <div className='flex items-center justify-between mb-2'>
                <div className={`flex-1 h-2 rounded-full ${currentStep >= 1 ? 'bg-primary-500' : 'bg-neutral-200'}`}></div>
                <div className={`flex-1 h-2 rounded-full mx-2 ${currentStep >= 2 ? 'bg-primary-500' : 'bg-neutral-200'}`}></div>
                <div className={`flex-1 h-2 rounded-full ${currentStep >= 3 ? 'bg-primary-500' : 'bg-neutral-200'}`}></div>
              </div>
            </div>

            <form ref={formRef} onSubmit={currentStep === 3 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }} className='space-y-6' noValidate>
              {error && (
                <div className='bg-status-error/10 border-l-4 border-status-error text-status-error px-4 py-3 rounded-lg flex items-start space-x-2 shadow-sm'>
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

              {/* Step 1: Personal Information */}
              {currentStep === 1 && (
                <div className='space-y-6'>
                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <label className='block text-sm font-semibold text-neutral-800 mb-2'>
                        {t('auth.firstName')} *
                      </label>
                      <Input
                        value={personalInfo.firstName}
                        onChange={(e) => setPersonalInfo({ ...personalInfo, firstName: e.target.value })}
                        required
                        placeholder={t('auth.firstName')}
                      />
                    </div>
                    <div>
                      <label className='block text-sm font-semibold text-neutral-800 mb-2'>
                        {t('auth.lastName')} *
                      </label>
                      <Input
                        value={personalInfo.lastName}
                        onChange={(e) => setPersonalInfo({ ...personalInfo, lastName: e.target.value })}
                        required
                        placeholder={t('auth.lastName')}
                      />
                    </div>
                  </div>

                  <div>
                    <label className='block text-sm font-semibold text-neutral-800 mb-2'>
                      {t('auth.emailAddress')} *
                    </label>
                    <Input
                      type='email'
                      value={personalInfo.email}
                      onChange={(e) => setPersonalInfo({ ...personalInfo, email: e.target.value })}
                      required
                      placeholder={t('auth.emailAddress')}
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-semibold text-neutral-800 mb-2'>
                      {t('auth.phoneNumber')} *
                    </label>
                    <Input
                      type='tel'
                      value={personalInfo.phone}
                      onChange={(e) => setPersonalInfo({ ...personalInfo, phone: e.target.value })}
                      required
                      placeholder={t('auth.phoneNumber')}
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-semibold text-neutral-800 mb-2'>
                      {t('auth.password')} *
                    </label>
                    <div className='relative'>
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={personalInfo.password}
                        onChange={(e) => setPersonalInfo({ ...personalInfo, password: e.target.value })}
                        required
                        placeholder='••••••••'
                        className='pr-10'
                      />
                      <button
                        type='button'
                        onClick={() => setShowPassword(!showPassword)}
                        className='absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-500 hover:text-neutral-700'
                      >
                        {showPassword ? (t('common.hide') || 'Hide') : (t('common.show') || 'Show')}
                      </button>
                    </div>
                    <p className='text-xs text-neutral-500 mt-1'>{t('auth.passwordMinLength')}</p>
                  </div>

                  <div>
                    <label className='block text-sm font-semibold text-neutral-800 mb-2'>
                      {t('auth.confirmPassword')} *
                    </label>
                    <div className='relative'>
                      <Input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={personalInfo.confirmPassword}
                        onChange={(e) => setPersonalInfo({ ...personalInfo, confirmPassword: e.target.value })}
                        required
                        placeholder='••••••••'
                        className='pr-10'
                      />
                      <button
                        type='button'
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className='absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-500 hover:text-neutral-700'
                      >
                        {showConfirmPassword ? (t('common.hide') || 'Hide') : (t('common.show') || 'Show')}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Clinic Information */}
              {currentStep === 2 && (
                <div className='space-y-6'>
                  <div>
                    <label className='block text-sm font-semibold text-neutral-800 mb-2'>
                      {t('auth.clinicName')} *
                    </label>
                    <Input
                      value={clinicInfo.clinicName}
                      onChange={(e) => setClinicInfo({ ...clinicInfo, clinicName: e.target.value })}
                      required
                      placeholder={t('auth.clinicName')}
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-semibold text-neutral-800 mb-2'>
                      {t('auth.clinicAddress')} *
                    </label>
                    <Input
                      value={clinicInfo.address}
                      onChange={(e) => setClinicInfo({ ...clinicInfo, address: e.target.value })}
                      required
                      placeholder={t('auth.clinicAddress')}
                    />
                  </div>

                  <div className='grid grid-cols-3 gap-4'>
                    <div>
                      <label className='block text-sm font-semibold text-neutral-800 mb-2'>
                        {t('auth.city')} *
                      </label>
                      <Input
                        value={clinicInfo.city}
                        onChange={(e) => setClinicInfo({ ...clinicInfo, city: e.target.value })}
                        required
                        placeholder={t('auth.city')}
                      />
                    </div>
                    <div>
                      <label className='block text-sm font-semibold text-neutral-800 mb-2'>
                        {t('auth.stateProvince')} *
                      </label>
                      <Input
                        value={clinicInfo.state}
                        onChange={(e) => setClinicInfo({ ...clinicInfo, state: e.target.value })}
                        required
                        placeholder={t('auth.stateProvince')}
                      />
                    </div>
                    <div>
                      <label className='block text-sm font-semibold text-neutral-800 mb-2'>
                        {t('auth.zipPostalCode')} *
                      </label>
                      <Input
                        value={clinicInfo.zipCode}
                        onChange={(e) => setClinicInfo({ ...clinicInfo, zipCode: e.target.value })}
                        required
                        placeholder={t('auth.zipPostalCode')}
                      />
                    </div>
                  </div>

                  <div>
                    <label className='block text-sm font-semibold text-neutral-800 mb-2'>
                      {t('auth.clinicPhone')} *
                    </label>
                    <Input
                      type='tel'
                      value={clinicInfo.phone}
                      onChange={(e) => setClinicInfo({ ...clinicInfo, phone: e.target.value })}
                      required
                      placeholder={t('auth.clinicPhone')}
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-semibold text-neutral-800 mb-2'>
                      {t('auth.clinicEmailOptional') || t('auth.clinicEmail')}
                    </label>
                    <Input
                      type='email'
                      value={clinicInfo.email}
                      onChange={(e) => setClinicInfo({ ...clinicInfo, email: e.target.value })}
                      placeholder={t('auth.clinicEmail')}
                    />
                    <p className='text-xs text-neutral-500 mt-1'>{t('auth.clinicEmailHint')}</p>
                  </div>

                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <label className='block text-sm font-semibold text-neutral-800 mb-2'>
                        {t('auth.region')} *
                      </label>
                      <select
                        className='w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500'
                        value={clinicInfo.region}
                        onChange={(e) => setClinicInfo({ ...clinicInfo, region: e.target.value })}
                        required
                      >
                        {regions.map((region) => (
                          <option key={region.value} value={region.value}>
                            {region.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className='block text-sm font-semibold text-neutral-800 mb-2'>
                        {t('auth.timezone')} *
                      </label>
                      <select
                        className='w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500'
                        value={clinicInfo.timezone}
                        onChange={(e) => setClinicInfo({ ...clinicInfo, timezone: e.target.value })}
                        required
                      >
                        {timezones.map((tz) => (
                          <option key={tz.value} value={tz.value}>
                            {tz.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Review */}
              {currentStep === 3 && (
                <div className='space-y-6'>
                  <div className='bg-neutral-50 p-6 rounded-lg space-y-4'>
                    <h3 className='font-semibold text-neutral-900 mb-4'>{t('auth.reviewYourInformation')}</h3>
                    
                    <div>
                      <h4 className='text-sm font-semibold text-neutral-700 mb-2'>{t('auth.personalInfo')}</h4>
                      <div className='text-sm text-neutral-600 space-y-1'>
                        <p><strong>{t('auth.name')}:</strong> {personalInfo.firstName} {personalInfo.lastName}</p>
                        <p><strong>{t('auth.email')}:</strong> {personalInfo.email}</p>
                        <p><strong>{t('auth.phone')}:</strong> {personalInfo.phone}</p>
                      </div>
                    </div>

                    <div>
                      <h4 className='text-sm font-semibold text-neutral-700 mb-2'>{t('auth.clinicInfo')}</h4>
                      <div className='text-sm text-neutral-600 space-y-1'>
                        <p><strong>{t('auth.clinicName')}:</strong> {clinicInfo.clinicName}</p>
                        <p><strong>{t('auth.address')}:</strong> {clinicInfo.address}, {clinicInfo.city}, {clinicInfo.state} {clinicInfo.zipCode}</p>
                        <p><strong>{t('auth.phone')}:</strong> {clinicInfo.phone}</p>
                        <p><strong>{t('auth.email')}:</strong> {clinicInfo.email || personalInfo.email}</p>
                        <p><strong>{t('auth.region')}:</strong> {regions.find(r => r.value === clinicInfo.region)?.label}</p>
                        <p><strong>{t('auth.timezone')}:</strong> {timezones.find(tz => tz.value === clinicInfo.timezone)?.label}</p>
                      </div>
                    </div>
                  </div>

                   <div className='text-center pt-4'>
                     <p className='text-neutral-600 mb-2' style={{ fontSize: '10px', lineHeight: '14px' }}>
                       By creating an account, you agree to our{' '}
                       <Link
                         href='/legal'
                         className='text-primary-600 hover:text-primary-700 font-semibold underline'
                         style={{ fontSize: '10px' }}
                       >
                         Legal Information & Disclaimers
                       </Link>
                     </p>
                     <p className='text-neutral-500' style={{ fontSize: '10px', lineHeight: '14px' }}>
                       <Link href='/terms' className='text-primary-600 hover:text-primary-700 underline mr-2' style={{ fontSize: '10px' }}>
                         Terms of Service
                       </Link>
                       {' • '}
                       <Link href='/privacy' className='text-primary-600 hover:text-primary-700 underline ml-2' style={{ fontSize: '10px' }}>
                         Privacy Policy
                       </Link>
                     </p>
                   </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className='flex gap-4'>
                {currentStep > 1 && (
                  <Button
                    type='button'
                    variant='secondary'
                    onClick={handleBack}
                    className='flex-1'
                  >
                    {t('common.back')}
                  </Button>
                )}
                <Button
                  type={currentStep === 3 ? 'submit' : 'button'}
                  variant='primary'
                  onClick={currentStep < 3 ? handleNext : undefined}
                  isLoading={isLoading && currentStep === 3}
                  disabled={isLoading}
                  className='flex-1'
                >
                  {currentStep === 3 ? (t('auth.createClinicAccount') || 'Create Clinic Account') : t('common.next')}
                </Button>
              </div>
            </form>

            <div className='mt-8 text-center'>
              <p className='text-sm text-neutral-600'>
                {t('auth.alreadyHaveAccount')}{' '}
                <Link
                  href='/login'
                  className='text-primary-600 hover:text-primary-700 font-semibold'
                >
                  {t('auth.signIn')}
                </Link>
              </p>
            </div>
          </FormTransition>
        </div>
      </div>
    </div>
  );
}
