'use client';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Checkbox } from '@/components/ui/Checkbox';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { useAuth } from '@/contexts/AuthContext';
import { useFeatures } from '@/contexts/FeatureContext';
import { useI18n } from '@/contexts/I18nContext';
import { apiClient } from '@/lib/api/client';
import { MANAGER_ACCESS_OPTIONS } from '@/lib/constants/manager-access';
import { showError, showSuccess } from '@/lib/utils/toast';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function CreateManagerPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { user, loading: authLoading } = useAuth();
  const { hasFeature } = useFeatures();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
  });
  const [selectedAccess, setSelectedAccess] = useState([]);
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
      showError(t('admin.firstNameRequired'));
      return;
    }
    if (!formData.lastName || !formData.lastName.trim()) {
      showError(t('admin.lastNameRequired'));
      return;
    }
    if (!formData.email || !formData.email.trim()) {
      showError(t('admin.emailRequired'));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      showError(t('admin.invalidEmail'));
      return;
    }
    if (!formData.password || !formData.password.trim()) {
      showError(t('admin.passwordRequired'));
      return;
    }
    if (formData.password.length < 8) {
      showError(t('admin.passwordMinLength'));
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      showError(t('admin.passwordsDoNotMatch'));
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiClient.post('/users', {
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: 'manager',
        managerAccess: selectedAccess.length > 0 ? selectedAccess : undefined,
      });

      if (response.success) {
        showSuccess(t('errors.managerAccountCreatedSuccess'));
        setFormData({
          email: '',
          password: '',
          confirmPassword: '',
          firstName: '',
          lastName: '',
        });
        setSelectedAccess([]);
      } else {
        const msg = response.error?.message || t('settings.createManagerServerError');
        setError(msg);
        showError(msg);
      }
    } catch (error) {
      const rawMessage =
        error instanceof Error ? error.message : 'Failed to create manager account';
      const isHtmlOrParseError =
        typeof rawMessage === 'string' &&
        (rawMessage.includes('<!DOCTYPE') || rawMessage.includes('Unexpected token'));
      const errorMessage = isHtmlOrParseError
        ? t('settings.createManagerServerError') ||
          'Server returned an error. Check your permissions or try again.'
        : rawMessage;
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return <Loader type='page' text={t('common.loading')} />;
  }

  if (user?.role !== 'doctor' && user?.role !== 'clinic_admin') {
    return null;
  }

  return (
    <div className='tab-content-standard-width-left mt-3'>
      <Card>
        <div className='p-6'>
          <div className='mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-900/30 dark:border-blue-700'>
            <h3 className='font-semibold text-blue-900 dark:text-blue-100 mb-2'>{t('settings.managerAccessTitle')}</h3>
            <p className='text-sm text-blue-800 dark:text-blue-200'>{t('settings.managerAccessDescription')}</p>
          </div>

          <form onSubmit={handleSubmit} className='space-y-6'>
            {error && (
              <div className='p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 dark:bg-red-900/30 dark:border-red-700 dark:text-red-200'>
                {error}
              </div>
            )}

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div>
                <label className='block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2'>
                  {t('settings.firstNameRequired')}
                </label>
                <Input
                  type='text'
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2'>
                  {t('settings.lastNameRequired')}
                </label>
                <Input
                  type='text'
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className='border border-neutral-200 rounded-lg p-4 bg-neutral-50/50 dark:bg-neutral-800/50 dark:border-neutral-600'>
              <h4 className='text-sm font-medium text-neutral-800 dark:text-neutral-200 mb-3'>
                {t('settings.managerAccessTitle')}
              </h4>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-2'>
                {MANAGER_ACCESS_OPTIONS.filter(
                  (opt) => opt.requiredFeature === null || hasFeature(opt.requiredFeature),
                ).map((opt) => (
                  <label key={opt.id} className='flex items-center gap-2 cursor-pointer'>
                    <Checkbox
                      checked={selectedAccess.includes(opt.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedAccess((prev) => [...prev, opt.id]);
                        } else {
                          setSelectedAccess((prev) => prev.filter((id) => id !== opt.id));
                        }
                      }}
                      aria-label={t(opt.labelKey)}
                    />
                    <span className='text-sm text-neutral-700 dark:text-neutral-300'>{t(opt.labelKey)}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className='block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2'>{t('settings.emailRequired')}</label>
              <Input
                type='email'
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2'>{t('settings.passwordRequired')}</label>
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
                  className='absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'
                >
                  {showPassword ? t('common.hide') : t('common.show')}
                </button>
              </div>
              <p className='text-sm text-neutral-500 dark:text-neutral-400 mt-1'>{t('settings.minimumChars')}</p>
            </div>

            <div>
                <label className='block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2'>
                {t('settings.confirmPasswordRequired')}
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
                {isLoading ? t('common.creating') : t('settings.createManager')}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}
