'use client';

import { Layout } from '@/components/layout/Layout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api/client';
import { showError, showSuccess } from '@/lib/utils/toast';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function CreateManagerPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      // Only doctors and clinic admins can create manager accounts
      if (user.role !== 'doctor' && user.role !== 'clinic_admin') {
        router.push('/dashboard');
        return;
      }
    }
  }, [authLoading, user, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.firstName || !formData.firstName.trim()) {
      showError('First name is required');
      return;
    }
    if (!formData.lastName || !formData.lastName.trim()) {
      showError('Last name is required');
      return;
    }
    if (!formData.email || !formData.email.trim()) {
      showError('Email is required');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      showError('Please enter a valid email address');
      return;
    }
    if (!formData.password || !formData.password.trim()) {
      showError('Password is required');
      return;
    }
    if (formData.password.length < 8) {
      showError('Password must be at least 8 characters');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      showError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      // Create manager account with limited access
      const response = await apiClient.post('/api/users', {
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: 'manager', // Manager role with limited access
      });

      if (response.success) {
        showSuccess('Manager account created successfully!');
        // Reset form
        setFormData({
          email: '',
          password: '',
          confirmPassword: '',
          firstName: '',
          lastName: '',
        });
      } else {
        setError(response.error?.message || 'Failed to create manager account');
        showError(response.error?.message || 'Failed to create manager account');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create manager account';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return <Loader fullScreen size='lg' />;
  }

  if (user?.role !== 'doctor' && user?.role !== 'clinic_admin') {
    return null;
  }

  return (
    <Layout>
      <div style={{ padding: '0 10px' }}>
        <PageHeader
          title='Create Manager Account'
          description='Create a manager account for external use in your clinic with limited access'
          actionButton={
            <Button variant='secondary' onClick={() => router.push('/settings')}>
              Back to Settings
            </Button>
          }
        />

        <Card>
          <div className='p-6'>
            <div className='mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg'>
              <h3 className='font-semibold text-blue-900 mb-2'>Manager Account Features</h3>
              <ul className='text-sm text-blue-800 space-y-1 list-disc list-inside'>
                <li>Limited access to clinic operations</li>
                <li>Can view appointments and queue (read-only)</li>
                <li>Can view basic patient information (no PHI)</li>
                <li>Cannot access financial data</li>
                <li>Cannot modify critical settings</li>
                <li>Cannot create or delete users</li>
              </ul>
            </div>

            <form onSubmit={handleSubmit} className='space-y-6'>
              {error && (
                <div className='p-4 bg-red-50 border border-red-200 rounded-lg text-red-700'>
                  {error}
                </div>
              )}

              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
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
                <label className='block text-sm font-medium text-neutral-700 mb-2'>
                  Email *
                </label>
                <Input
                  type='email'
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-2'>
                  Password *
                </label>
                <div className='relative'>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    minLength={8}
                  />
                  <button
                    type='button'
                    onClick={() => setShowPassword(!showPassword)}
                    className='absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-500 hover:text-neutral-700'
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                <p className='text-sm text-neutral-500 mt-1'>Minimum 8 characters</p>
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
                />
              </div>

              <div className='flex gap-4'>
                <Button type='submit' variant='primary' disabled={isLoading}>
                  {isLoading ? 'Creating...' : 'Create Manager Account'}
                </Button>
                <Button type='button' variant='secondary' onClick={() => router.push('/settings')}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </Card>
      </div>
    </Layout>
  );
}

