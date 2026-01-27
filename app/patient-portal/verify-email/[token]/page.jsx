'use client';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { apiClient } from '@/lib/api/client';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function VerifyEmailPage() {
  const router = useRouter();
  const params = useParams();
  const token = params?.token;
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (token) {
      verifyEmail();
    } else {
      setError('Invalid verification link');
      setLoading(false);
    }
  }, [token]);

  const verifyEmail = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/patient-portal/auth/verify-email/${token}`);

      if (response.success) {
        setVerified(true);
      } else {
        setError(response.error?.message || 'Email verification failed');
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Email verification failed. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-neutral-50 flex items-center justify-center'>
        <Card className='p-8 text-center'>
          <Loader size='lg' className='mx-auto mb-4' />
          <p className='text-neutral-600'>Verifying your email...</p>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className='min-h-screen bg-neutral-50 flex items-center justify-center py-12 px-4'>
        <Card className='p-8 text-center max-w-md'>
          <div className='w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6'>
            <svg
              className='w-12 h-12 text-red-600'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M6 18L18 6M6 6l12 12'
              />
            </svg>
          </div>
          <h1 className='text-2xl font-bold text-neutral-900 mb-4'>Verification Failed</h1>
          <p className='text-neutral-600 mb-6'>{error}</p>
          <div className='space-y-3'>
            <Link href='/patient-portal/register'>
              <Button variant='primary' className='w-full'>
                Register Again
              </Button>
            </Link>
            <Link href='/patient-portal/login'>
              <Button variant='secondary' className='w-full'>
                Go to Login
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  if (verified) {
    return (
      <div className='min-h-screen bg-neutral-50 flex items-center justify-center py-12 px-4'>
        <Card className='p-8 text-center max-w-md'>
          <div className='w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6'>
            <svg
              className='w-14 h-14 text-green-600'
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
          <h1 className='text-3xl font-bold text-neutral-900 mb-4'>Email Verified Successfully! 🎉</h1>
          <p className='text-lg text-neutral-600 mb-2'>
            Your email address has been verified.
          </p>
          <p className='text-sm text-neutral-500 mb-8'>
            You can now log in to your account and start booking appointments.
          </p>
          <Link href='/patient-portal/login'>
            <Button variant='primary' size='lg' className='w-full'>
              Continue to Login
            </Button>
          </Link>
          <Link href='/patient-portal' className='block mt-4 text-sm text-primary-600 hover:text-primary-700'>
            Back to Homepage
          </Link>
        </Card>
      </div>
    );
  }

  return null;
}
