'use client';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useI18n } from '@/contexts/I18nContext';
import { apiClient } from '@/lib/api/client';
import { showError, showSuccess } from '@/lib/utils/toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const STEPS = [
  { id: 1, key: 'tryForFree.stepClinic' },
  { id: 2, key: 'tryForFree.stepDetails' },
  { id: 3, key: 'tryForFree.stepAccount' },
];

export default function TryForFreePage() {
  const router = useRouter();
  const { t } = useI18n();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
    if (step === 1 && canProceedStep1) setStep(2);
    else if (step === 2 && canProceedStep2) setStep(3);
  };

  const handleBack = () => {
    setError('');
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
        setError(res.error?.message || t('tryForFree.registerFailed'));
        showError(res.error?.message || t('tryForFree.registerFailed'));
      }
    } catch (err) {
      const msg = err?.message || t('tryForFree.registerFailed');
      setError(msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen flex flex-col bg-neutral-50'>
      <header className='border-b border-neutral-200 bg-white py-4'>
        <div className='max-w-2xl mx-auto px-4 flex items-center justify-between'>
          <Link href='/login' className='text-primary-600 hover:underline text-sm font-medium'>
            {t('common.back') || 'Back'}
          </Link>
          <span className='text-neutral-600 text-sm'>
            {t('tryForFree.title') || 'Try for free'} — {t(STEPS[step - 1].key) || `Step ${step}`}
          </span>
        </div>
      </header>

      <main className='flex-1 flex items-start justify-center px-4 py-8'>
        <div className='w-full max-w-lg'>
          {/* Progress */}
          <div className='flex gap-2 mb-8'>
            {STEPS.map((s) => (
              <div
                key={s.id}
                className={`h-1 flex-1 rounded-full ${step >= s.id ? 'bg-primary-500' : 'bg-neutral-200'}`}
                aria-hidden
              />
            ))}
          </div>

          <div className='bg-white rounded-2xl border border-neutral-200 shadow-lg p-6 sm:p-8'>
            {error && (
              <div className='mb-4 p-3 rounded-lg bg-status-error/10 border border-status-error/30 text-status-error text-sm'>
                {error}
              </div>
            )}

            {step === 1 && (
              <>
                <h2 className='text-xl font-bold text-neutral-900 mb-1'>
                  {t('tryForFree.tellUsAboutClinic') || 'Tell us about your clinic'}
                </h2>
                <p className='text-neutral-600 text-sm mb-6'>
                  {t('tryForFree.stepClinicDesc') || 'A few quick questions to get started.'}
                </p>
                <div className='space-y-4'>
                  <div>
                    <label className='block text-sm font-medium text-neutral-700 mb-1'>
                      {t('tryForFree.clinicName') || 'Clinic name'} *
                    </label>
                    <Input
                      value={data.clinicName}
                      onChange={(e) => update('clinicName', e.target.value)}
                      placeholder={
                        t('tryForFree.clinicNamePlaceholder') || 'e.g. City Health Clinic'
                      }
                      required
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-neutral-700 mb-1'>
                      {t('tryForFree.clinicType') || 'Type'} *
                    </label>
                    <select
                      value={data.clinicType}
                      onChange={(e) => update('clinicType', e.target.value)}
                      className='w-full border border-neutral-300 rounded-lg px-3 py-2.5 text-neutral-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
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
                    <label className='block text-sm font-medium text-neutral-700 mb-1'>
                      {t('tryForFree.country') || 'Country'} *
                    </label>
                    <select
                      value={data.country}
                      onChange={(e) => update('country', e.target.value)}
                      className='w-full border border-neutral-300 rounded-lg px-3 py-2.5 text-neutral-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
                      required
                    >
                      <option value=''>{t('tryForFree.selectCountry') || 'Select country'}</option>
                      <option value='US'>United States</option>
                      <option value='IN'>India</option>
                      <option value='CA'>Canada</option>
                      <option value='AU'>Australia</option>
                      <option value='UK'>United Kingdom</option>
                      <option value='OTHER'>{t('tryForFree.other') || 'Other'}</option>
                    </select>
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-neutral-700 mb-1'>
                      {t('tryForFree.staffSize') || 'Staff size'} *
                    </label>
                    <select
                      value={data.staffSize}
                      onChange={(e) => update('staffSize', e.target.value)}
                      className='w-full border border-neutral-300 rounded-lg px-3 py-2.5 text-neutral-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
                      required
                    >
                      <option value=''>{t('tryForFree.selectSize') || 'Select size'}</option>
                      <option value='1-5'>1–5</option>
                      <option value='6-20'>6–20</option>
                      <option value='21-50'>21–50</option>
                      <option value='50+'>50+</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <h2 className='text-xl font-bold text-neutral-900 mb-1'>
                  {t('tryForFree.contactAndAddress') || 'Contact & address'}
                </h2>
                <p className='text-neutral-600 text-sm mb-6'>
                  {t('tryForFree.stepDetailsDesc') ||
                    'Where we can reach you and your clinic location.'}
                </p>
                <div className='space-y-4'>
                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <label className='block text-sm font-medium text-neutral-700 mb-1'>
                        {t('auth.firstName') || 'First name'} *
                      </label>
                      <Input
                        value={data.firstName}
                        onChange={(e) => update('firstName', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-neutral-700 mb-1'>
                        {t('auth.lastName') || 'Last name'} *
                      </label>
                      <Input
                        value={data.lastName}
                        onChange={(e) => update('lastName', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-neutral-700 mb-1'>
                      {t('tryForFree.phone') || 'Phone'} *
                    </label>
                    <Input
                      type='tel'
                      value={data.phone}
                      onChange={(e) => update('phone', e.target.value)}
                      placeholder='+1 234 567 8900'
                      required
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-neutral-700 mb-1'>
                      {t('tryForFree.address') || 'Address'} *
                    </label>
                    <Input
                      value={data.address}
                      onChange={(e) => update('address', e.target.value)}
                      placeholder={t('tryForFree.addressPlaceholder') || 'Street address'}
                      required
                    />
                  </div>
                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <label className='block text-sm font-medium text-neutral-700 mb-1'>
                        {t('tryForFree.city') || 'City'} *
                      </label>
                      <Input
                        value={data.city}
                        onChange={(e) => update('city', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-neutral-700 mb-1'>
                        {t('tryForFree.state') || 'State / Province'} *
                      </label>
                      <Input
                        value={data.state}
                        onChange={(e) => update('state', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-neutral-700 mb-1'>
                      {t('tryForFree.zipCode') || 'ZIP / Postal code'} *
                    </label>
                    <Input
                      value={data.zipCode}
                      onChange={(e) => update('zipCode', e.target.value)}
                      required
                    />
                  </div>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <h2 className='text-xl font-bold text-neutral-900 mb-1'>
                  {t('tryForFree.createAccount') || 'Create your account'}
                </h2>
                <div className='p-4 rounded-lg bg-primary-50 border border-primary-200 mb-6'>
                  <p className='text-sm text-primary-900 font-medium'>
                    {t('tryForFree.threeMonthsFree') ||
                      '3 months free for Solo & Clinic. Payment applies after. Cancel anytime.'}
                  </p>
                </div>
                <form onSubmit={handleSubmit} className='space-y-4'>
                  <div>
                    <label className='block text-sm font-medium text-neutral-700 mb-1'>
                      {t('auth.email') || 'Email'} *
                    </label>
                    <Input
                      type='email'
                      value={data.email}
                      onChange={(e) => update('email', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-neutral-700 mb-1'>
                      {t('auth.password') || 'Password'} * (min 8 characters)
                    </label>
                    <Input
                      type='password'
                      value={data.password}
                      onChange={(e) => update('password', e.target.value)}
                      minLength={8}
                      required
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-neutral-700 mb-1'>
                      {t('auth.confirmPassword') || 'Confirm password'} *
                    </label>
                    <Input
                      type='password'
                      value={data.confirmPassword}
                      onChange={(e) => update('confirmPassword', e.target.value)}
                      required
                    />
                  </div>
                  <div className='flex gap-3 pt-2'>
                    <Button
                      type='button'
                      variant='secondary'
                      onClick={handleBack}
                      className='flex-1'
                    >
                      {t('common.back') || 'Back'}
                    </Button>
                    <Button
                      type='submit'
                      variant='primary'
                      disabled={loading || !canProceedStep3}
                      className='flex-1'
                    >
                      {loading
                        ? t('common.creating') || 'Creating…'
                        : t('tryForFree.createAccount') || 'Create account'}
                    </Button>
                  </div>
                </form>
              </>
            )}

            {step !== 3 && (
              <div className='flex gap-3 mt-6 pt-6 border-t border-neutral-200'>
                <Button
                  type='button'
                  variant='secondary'
                  onClick={handleBack}
                  disabled={step === 1}
                  className='flex-1'
                >
                  {t('common.back') || 'Back'}
                </Button>
                <Button
                  type='button'
                  variant='primary'
                  onClick={handleNext}
                  disabled={(step === 1 && !canProceedStep1) || (step === 2 && !canProceedStep2)}
                  className='flex-1'
                >
                  {t('tryForFree.next') || 'Next'}
                </Button>
              </div>
            )}
          </div>

          <p className='text-center text-neutral-500 text-sm mt-6'>
            {t('tryForFree.cancelAnytime') || 'You can cancel your subscription anytime.'}
          </p>
        </div>
      </main>
    </div>
  );
}
