'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/marketing/Header';
import { Footer } from '@/components/marketing/Footer';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useI18n } from '@/contexts/I18nContext';
import { apiClient } from '@/lib/api/client';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [step, setStep] = useState('request');
  const [email, setEmail] = useState('');
  const [secretCode, setSecretCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestCode = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await apiClient.post('/auth/forgot-password', { email });
      if (response.success) {
        setSuccess(response.data?.message || t('auth.passwordResetCodeSent'));
        // In development, show the code if returned
        if (response.data?.secretCode) {
          setSuccess(`Code sent! Your secret code is: ${response.data.secretCode} (development only)`);
        }
        setStep('verify');
      } else {
        setError(response.error?.message || 'Failed to send reset code');
      }
    } catch (error) {
      setError(error.message || 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError(t('auth.passwordMismatch'));
      return;
    }

    if (newPassword.length < 8) {
      setError(t('auth.passwordMinLength'));
      return;
    }

    setLoading(true);

    try {
      const response = await apiClient.post('/auth/reset-password', {
        email,
        secretCode,
        newPassword,
      });

      if (response.success) {
        setSuccess(t('auth.passwordResetSuccess'));
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        setError(response.error?.message || 'Failed to reset password');
      }
    } catch (error) {
      setError(error.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 lg:p-10">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {step === 'request' ? t('auth.forgotPassword') : t('auth.resetPassword')}
              </h2>
              <p className="text-gray-600">
                {step === 'request'
                  ? t('auth.passwordResetInstructions')
                  : t('auth.enterSecretCode')}
              </p>
            </div>

            {step === 'request' ? (
              <form onSubmit={handleRequestCode} className="space-y-6">
                {error && (
                  <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg flex items-start space-x-2">
                    <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm">{error}</span>
                  </div>
                )}

                {success && (
                  <div className="bg-green-50 border-l-4 border-green-500 text-green-700 px-4 py-3 rounded-lg">
                    <span className="text-sm">{success}</span>
                  </div>
                )}

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('auth.emailAddress')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                      </svg>
                    </div>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="you@example.com"
                      autoComplete="email"
                      className="pl-10"
                    />
                  </div>
                </div>

                <Button type="submit" isLoading={loading} className="w-full" size="lg">
                  {t('auth.sendResetCode')}
                </Button>

                <div className="text-center">
                  <Link href="/login" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                    ← {t('auth.backToLogin')}
                  </Link>
                </div>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-6">
                {error && (
                  <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg flex items-start space-x-2">
                    <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm">{error}</span>
                  </div>
                )}

                {success && (
                  <div className="bg-green-50 border-l-4 border-green-500 text-green-700 px-4 py-3 rounded-lg">
                    <span className="text-sm">{success}</span>
                  </div>
                )}

                <div>
                  <label htmlFor="secretCode" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('auth.secretCode')} (6 digits)
                  </label>
                  <Input
                    id="secretCode"
                    type="text"
                    value={secretCode}
                    onChange={(e) => setSecretCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                    placeholder="000000"
                    maxLength={6}
                    className="text-center text-2xl tracking-widest font-mono"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {t('auth.secretCodePlaceholder')} {email}
                  </p>
                </div>

                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('auth.newPassword')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('auth.confirmNewPassword')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="pl-10"
                    />
                  </div>
                </div>

                <Button type="submit" isLoading={loading} className="w-full" size="lg">
                  {t('auth.resetPassword')}
                </Button>

                <div className="text-center space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('request');
                      setSecretCode('');
                      setNewPassword('');
                      setConfirmPassword('');
                      setError('');
                      setSuccess('');
                    }}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    ← Back
                  </button>
                  <div>
                    <Link href="/login" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                      {t('auth.backToLogin')}
                    </Link>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

