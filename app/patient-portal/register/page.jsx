'use client';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { apiClient } from '@/lib/api/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { logger } from '@/lib/utils/logger.js';

export default function PatientRegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    dateOfBirth: '',
    gender: '',
    agreeToTerms: false,
  });
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [showPassword, setShowPassword] = useState(false);

  const sendOTP = async () => {
    if (!formData.phone || !formData.email) {
      setError('Phone and email are required to send OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await apiClient.post('/patient-portal/auth/send-otp', {
        phone: formData.phone,
        email: formData.email,
      });

      if (response.success) {
        setOtpSent(true);
        setError('');
      } else {
        setError(response.error?.message || 'Failed to send OTP. Please try again.');
      }
    } catch (err) {
      logger.error('Failed to send OTP', err);
      setError('Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await apiClient.post('/patient-portal/auth/verify-otp', {
        phone: formData.phone,
        email: formData.email,
        otp: otp,
      });

      if (response.success) {
        setOtpVerified(true);
        setError('');
        setStep(2);
      } else {
        setError(response.error?.message || 'Invalid OTP. Please try again.');
      }
    } catch (err) {
      logger.error('Failed to verify OTP', err);
      setError(err.response?.data?.error?.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!otpVerified) {
      setError('Please verify your phone and email with OTP first');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!formData.agreeToTerms) {
      setError('Please agree to the terms and conditions');
      return;
    }

    setLoading(true);

    try {
      const response = await apiClient.post('/patient-portal/auth/register', {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        role: 'patient',
      });

      if (response.success) {
        alert('Registration successful! Please check your email to verify your account.');
        router.push('/patient-portal/login');
      } else {
        setError(response.error?.message || 'Registration failed. Please try again.');
      }
    } catch (err) {
      logger.error('Registration error', err);
      setError(err.response?.data?.error?.message || 'Failed to register. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-primary-50 via-white to-neutral-50 flex items-center justify-center py-12 px-4'>
      <div className='w-full max-w-md'>
        <div className='text-center mb-8'>
          <Link href='/patient-portal' className='inline-flex items-center gap-2 mb-4'>
            <div className='w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center'>
              <span className='text-white font-bold text-2xl'>C</span>
            </div>
            <span className='text-2xl font-bold text-neutral-900'>ClinicTool</span>
          </Link>
          <h1 className='text-3xl font-bold text-neutral-900 mb-2'>Create Account</h1>
          <p className='text-neutral-600'>Sign up to book appointments and manage your health</p>
        </div>

        <Card className='p-8'>
          {step === 1 ? (
            <div className='space-y-4'>
              <h2 className='text-2xl font-bold text-neutral-900 mb-4'>Step 1: Verify Contact</h2>
              <p className='text-sm text-neutral-600 mb-6'>
                We'll send an OTP to verify your phone number and email address.
              </p>

              {error && (
                <div className='p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm'>
                  {error}
                </div>
              )}

              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-2'>Email *</label>
                <Input
                  type='email'
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder='Enter your email'
                  required
                  disabled={otpSent}
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-2'>
                  Phone Number *
                </label>
                <Input
                  type='tel'
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder='Enter your phone number'
                  required
                  disabled={otpSent}
                />
              </div>

              {!otpSent ? (
                <Button
                  type='button'
                  variant='primary'
                  className='w-full'
                  onClick={sendOTP}
                  disabled={!formData.phone || !formData.email || loading}
                >
                  {loading ? 'Sending OTP...' : 'Send OTP'}
                </Button>
              ) : (
                <div className='space-y-4'>
                  <div>
                    <label className='block text-sm font-medium text-neutral-700 mb-2'>
                      Enter OTP *
                    </label>
                    <div className='flex gap-2'>
                      <Input
                        type='text'
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder='Enter 6-digit OTP'
                        maxLength={6}
                        className='flex-1 text-center text-2xl tracking-widest'
                      />
                    </div>
                    <p className='text-xs text-neutral-500 mt-2'>
                      OTP sent to {formData.phone} and {formData.email}
                    </p>
                  </div>

                  <div className='flex gap-2'>
                    <Button
                      type='button'
                      variant='secondary'
                      className='flex-1'
                      onClick={sendOTP}
                      disabled={loading}
                    >
                      Resend OTP
                    </Button>
                    <Button
                      type='button'
                      variant='primary'
                      className='flex-1'
                      onClick={verifyOTP}
                      disabled={otp.length !== 6 || loading}
                    >
                      {loading ? 'Verifying...' : 'Verify OTP'}
                    </Button>
                  </div>

                  {otpVerified && (
                    <div className='p-3 bg-green-50 border border-green-200 rounded-lg'>
                      <p className='text-sm text-green-700 flex items-center gap-2'>
                        <svg className='icon icon-sm' fill='currentColor' viewBox='0 0 20 20'>
                          <path
                            fillRule='evenodd'
                            d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                            clipRule='evenodd'
                          />
                        </svg>
                        Phone & Email verified successfully
                      </p>
                    </div>
                  )}
                </div>
              )}

              {otpVerified && (
                <Button
                  type='button'
                  variant='primary'
                  className='w-full mt-4'
                  onClick={() => setStep(2)}
                >
                  Continue to Registration
                </Button>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className='space-y-4'>
              <h2 className='text-2xl font-bold text-neutral-900 mb-4'>Step 2: Personal Information</h2>

              {error && (
                <div className='p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm'>
                  {error}
                </div>
              )}

              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-neutral-700 mb-2'>
                    First Name *
                  </label>
                  <Input
                    type='text'
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-neutral-700 mb-2'>
                    Last Name *
                  </label>
                  <Input
                    type='text'
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-2'>Email *</label>
                <Input
                  type='email'
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled
                  className='bg-neutral-100'
                />
                <p className='text-xs text-neutral-500 mt-1'>Verified</p>
              </div>

              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-2'>
                  Phone Number *
                </label>
                <Input
                  type='tel'
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  disabled
                  className='bg-neutral-100'
                />
                <p className='text-xs text-neutral-500 mt-1'>Verified</p>
              </div>

            <div>
              <label className='block text-sm font-medium text-neutral-700 mb-2'>
                Date of Birth
              </label>
              <Input
                type='date'
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-neutral-700 mb-2'>Gender</label>
              <select
                className='w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              >
                <option value=''>Select</option>
                <option value='male'>Male</option>
                <option value='female'>Female</option>
                <option value='other'>Other</option>
              </select>
            </div>

            <div>
              <label className='block text-sm font-medium text-neutral-700 mb-2'>Password *</label>
              <div className='relative'>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => {
                    const pwd = e.target.value;
                    setFormData({ ...formData, password: pwd });
                    // Calculate password strength
                    let strength = 0;
                    if (pwd.length >= 8) strength++;
                    if (pwd.match(/[a-z]/) && pwd.match(/[A-Z]/)) strength++;
                    if (pwd.match(/\d/)) strength++;
                    if (pwd.match(/[^a-zA-Z\d]/)) strength++;
                    setPasswordStrength(strength);
                  }}
                  required
                  minLength={8}
                  placeholder='Create a strong password'
                />
                <button
                  type='button'
                  onClick={() => setShowPassword(!showPassword)}
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700'
                >
                  {showPassword ? (
                    <svg className='icon icon-sm' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21'
                      />
                    </svg>
                  ) : (
                    <svg className='icon icon-sm' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
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
              {/* Password Strength Indicator */}
              {formData.password && (
                <div className='mt-2'>
                  <div className='flex gap-1 mb-1'>
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded ${
                          passwordStrength >= level
                            ? passwordStrength <= 2
                              ? 'bg-red-500'
                              : passwordStrength === 3
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                            : 'bg-neutral-200'
                        }`}
                      />
                    ))}
                  </div>
                  <p className='text-xs text-neutral-600'>
                    {passwordStrength === 0 && 'Enter a password'}
                    {passwordStrength === 1 && 'Weak password'}
                    {passwordStrength === 2 && 'Fair password'}
                    {passwordStrength === 3 && 'Good password'}
                    {passwordStrength === 4 && 'Strong password'}
                  </p>
                  <ul className='text-xs text-neutral-500 mt-2 space-y-1'>
                    <li className={formData.password.length >= 8 ? 'text-green-600' : ''}>
                      {formData.password.length >= 8 ? '✓' : '○'} At least 8 characters
                    </li>
                    <li className={formData.password.match(/[a-z]/) && formData.password.match(/[A-Z]/) ? 'text-green-600' : ''}>
                      {formData.password.match(/[a-z]/) && formData.password.match(/[A-Z]/) ? '✓' : '○'} Upper and lowercase letters
                    </li>
                    <li className={formData.password.match(/\d/) ? 'text-green-600' : ''}>
                      {formData.password.match(/\d/) ? '✓' : '○'} At least one number
                    </li>
                    <li className={formData.password.match(/[^a-zA-Z\d]/) ? 'text-green-600' : ''}>
                      {formData.password.match(/[^a-zA-Z\d]/) ? '✓' : '○'} At least one special character
                    </li>
                  </ul>
                </div>
              )}
            </div>

            <div>
              <label className='block text-sm font-medium text-neutral-700 mb-2'>
                Confirm Password *
              </label>
              <Input
                type={showPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
                placeholder='Re-enter your password'
              />
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className='text-xs text-red-600 mt-1'>Passwords do not match</p>
              )}
            </div>

            <div className='flex items-center'>
              <input
                type='checkbox'
                id='terms'
                checked={formData.agreeToTerms}
                onChange={(e) => setFormData({ ...formData, agreeToTerms: e.target.checked })}
                className='mr-2'
                required
              />
              <label htmlFor='terms' className='text-sm text-neutral-600'>
                I agree to the{' '}
                <Link href='/terms' className='text-primary-600 hover:text-primary-700'>
                  Terms and Conditions
                </Link>{' '}
                and{' '}
                <Link href='/privacy' className='text-primary-600 hover:text-primary-700'>
                  Privacy Policy
                </Link>
              </label>
            </div>

              <Button type='submit' variant='primary' className='w-full' disabled={loading || !otpVerified || passwordStrength < 2}>
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>

              <Button
                type='button'
                variant='secondary'
                className='w-full'
                onClick={() => setStep(1)}
              >
                Back
              </Button>
            </form>
          )}

          {/* Social Login */}
          <div className='mt-6'>
            <div className='relative'>
              <div className='absolute inset-0 flex items-center'>
                <div className='w-full border-t border-neutral-300' />
              </div>
              <div className='relative flex justify-center text-sm'>
                <span className='px-2 bg-white text-neutral-500'>Or continue with</span>
              </div>
            </div>
            <div className='mt-4 grid grid-cols-2 gap-3'>
              <Button
                type='button'
                variant='outline'
                className='w-full'
                onClick={() => {
                  // TODO: Implement Google OAuth
                  alert('Google login coming soon');
                }}
              >
                <svg className='icon icon-sm mr-2' viewBox='0 0 24 24'>
                  <path
                    fill='currentColor'
                    d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
                  />
                  <path
                    fill='currentColor'
                    d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
                  />
                  <path
                    fill='currentColor'
                    d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
                  />
                  <path
                    fill='currentColor'
                    d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
                  />
                </svg>
                Google
              </Button>
              <Button
                type='button'
                variant='outline'
                className='w-full'
                onClick={() => {
                  // TODO: Implement Facebook OAuth
                  alert('Facebook login coming soon');
                }}
              >
                <svg className='icon icon-sm mr-2' fill='currentColor' viewBox='0 0 24 24'>
                  <path d='M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z' />
                </svg>
                Facebook
              </Button>
            </div>
          </div>

          <div className='mt-6 text-center'>
            <p className='text-sm text-neutral-600'>
              Already have an account?{' '}
              <Link href='/patient-portal/login' className='text-primary-600 hover:text-primary-700 font-medium'>
                Sign in
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
