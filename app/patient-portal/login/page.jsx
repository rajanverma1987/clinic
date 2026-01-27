'use client';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { apiClient } from '@/lib/api/client';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function PatientLoginPage() {
  const router = useRouter();
  const { login, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loginMethod, setLoginMethod] = useState('email'); // 'email' or 'phone' or 'otp'
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    if (user) {
      router.push('/patient-portal/dashboard');
    }
  }, [user, router]);

  const sendOTP = async () => {
    if (!formData.phone && !formData.email) {
      setError('Please enter your phone number or email');
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
      } else {
        setError(response.error?.message || 'Failed to send OTP');
      }
    } catch (err) {
      setError('Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const verifyOTPAndLogin = async () => {
    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await apiClient.post('/patient-portal/auth/verify-otp-login', {
        phone: formData.phone,
        email: formData.email,
        otp: otp,
      });
      if (response.success && response.data) {
        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
        }
        await login(response.data.user);
        router.push('/patient-portal/dashboard');
      } else {
        setError(response.error?.message || 'Invalid OTP');
      }
    } catch (err) {
      setError('OTP verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await apiClient.post('/patient-portal/auth/login', {
        [loginMethod === 'email' ? 'email' : 'phone']: loginMethod === 'email' ? formData.email : formData.phone,
        password: formData.password,
        rememberMe: rememberMe,
      });

      if (response.success && response.data) {
        // Store token
        if (response.data.token) {
          if (rememberMe) {
            localStorage.setItem('token', response.data.token);
          } else {
            sessionStorage.setItem('token', response.data.token);
          }
        }
        await login(response.data.user);
        router.push('/patient-portal/dashboard');
      } else {
        setError(response.error || 'Invalid credentials');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Failed to login. Please try again.');
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
          <h1 className='text-3xl font-bold text-neutral-900 mb-2'>Welcome Back</h1>
          <p className='text-neutral-600'>Sign in to access your health records</p>
        </div>

        <Card className='p-8'>
          {/* Login Method Tabs */}
          <div className='flex gap-2 mb-6 border-b border-neutral-200'>
            <button
              type='button'
              onClick={() => {
                setLoginMethod('email');
                setOtpSent(false);
              }}
              className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
                loginMethod === 'email'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Email
            </button>
            <button
              type='button'
              onClick={() => {
                setLoginMethod('phone');
                setOtpSent(false);
              }}
              className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
                loginMethod === 'phone'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Phone
            </button>
            <button
              type='button'
              onClick={() => {
                setLoginMethod('otp');
                setOtpSent(false);
              }}
              className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
                loginMethod === 'otp'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-neutral-600 hover:text-neutral-900'
              }`}
            >
              OTP Login
            </button>
          </div>

          {loginMethod === 'otp' ? (
            <div className='space-y-6'>
              {error && (
                <div className='p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm'>
                  {error}
                </div>
              )}

              {!otpSent ? (
                <>
                  <div>
                    <label className='block text-sm font-medium text-neutral-700 mb-2'>
                      Phone Number or Email *
                    </label>
                    <Input
                      type='text'
                      value={formData.phone || formData.email}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value.includes('@')) {
                          setFormData({ ...formData, email: value, phone: '' });
                        } else {
                          setFormData({ ...formData, phone: value, email: '' });
                        }
                      }}
                      placeholder='Enter phone or email'
                      required
                    />
                  </div>
                  <Button
                    type='button'
                    variant='primary'
                    className='w-full'
                    onClick={sendOTP}
                    disabled={loading || (!formData.phone && !formData.email)}
                  >
                    {loading ? 'Sending OTP...' : 'Send OTP'}
                  </Button>
                </>
              ) : (
                <>
                  <div>
                    <label className='block text-sm font-medium text-neutral-700 mb-2'>
                      Enter OTP *
                    </label>
                    <Input
                      type='text'
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder='Enter 6-digit OTP'
                      maxLength={6}
                      className='text-center text-2xl tracking-widest'
                    />
                    <p className='text-xs text-neutral-500 mt-2'>
                      OTP sent to {formData.phone || formData.email}
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
                      onClick={verifyOTPAndLogin}
                      disabled={otp.length !== 6 || loading}
                    >
                      {loading ? 'Verifying...' : 'Verify & Login'}
                    </Button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className='space-y-6'>
              {error && (
                <div className='p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm'>
                  {error}
                </div>
              )}

              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-2'>
                  {loginMethod === 'email' ? 'Email Address' : 'Phone Number'} *
                </label>
                <Input
                  type={loginMethod === 'email' ? 'email' : 'tel'}
                  value={loginMethod === 'email' ? formData.email : formData.phone}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      [loginMethod === 'email' ? 'email' : 'phone']: e.target.value,
                    })
                  }
                  placeholder={
                    loginMethod === 'email' ? 'Enter your email' : 'Enter your phone number'
                  }
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-2'>Password *</label>
                <Input
                  type='password'
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder='Enter your password'
                  required
                />
              </div>

              <div className='flex items-center justify-between'>
                <label className='flex items-center'>
                  <input
                    type='checkbox'
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className='mr-2'
                  />
                  <span className='text-sm text-neutral-600'>Remember me</span>
                </label>
                <Link
                  href='/patient-portal/forgot-password'
                  className='text-sm text-primary-600 hover:text-primary-700'
                >
                  Forgot password?
                </Link>
              </div>

              <Button type='submit' variant='primary' className='w-full' disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
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
              Don't have an account?{' '}
              <Link href='/patient-portal/register' className='text-primary-600 hover:text-primary-700 font-medium'>
                Sign up
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
