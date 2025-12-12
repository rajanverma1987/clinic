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

export default function CreateAdminPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    role: 'super_admin',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      if (user.role !== 'super_admin') {
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
      // Use the admin create API or direct user creation
      const response = await apiClient.post('/api/users', {
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: formData.role,
      });

      if (response.success) {
        showSuccess(`${formData.role === 'super_admin' ? 'Super Admin' : 'Admin'} account created successfully!`);
        // Reset form
        setFormData({
          email: '',
          password: '',
          confirmPassword: '',
          firstName: '',
          lastName: '',
          role: 'super_admin',
        });
      } else {
        setError(response.error?.message || 'Failed to create admin account');
        showError(response.error?.message || 'Failed to create admin account');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create admin account';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return <Loader fullScreen size='lg' />;
  }

  if (user?.role !== 'super_admin') {
    return null;
  }

  return (
    <Layout>
      <div style={{ padding: '0 10px' }}>
        <PageHeader
          title='Create Admin Account'
          description='Create new super admin or clinic admin accounts'
          actionButton={
            <Button variant='secondary' onClick={() => router.push('/admin')}>
              Back to Dashboard
            </Button>
          }
        />

        <Card>
          <div className='p-6'>
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
                  Role *
                </label>
                <select
                  className='w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500'
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  required
                >
                  <option value='super_admin'>Super Admin</option>
                  <option value='clinic_admin'>Clinic Admin</option>
                </select>
                <p className='text-sm text-neutral-500 mt-1'>
                  Super Admin: Full system access. Clinic Admin: Manages a specific clinic.
                </p>
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
                  {isLoading ? 'Creating...' : 'Create Admin Account'}
                </Button>
                <Button type='button' variant='secondary' onClick={() => router.push('/admin')}>
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

