'use client';

import { useI18n } from '@/contexts/I18nContext';
import { AlertCircle, AlertTriangle, Home, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from './Button';
import { Card } from './Card';

/**
 * Premium Error Display Component
 * Consistent error UI across the application with proper design
 *
 * @param {Object} props
 * @param {string} [props.title] - Error title (defaults to i18n key)
 * @param {string} [props.message] - Error message
 * @param {number} [props.statusCode] - HTTP status code (404, 500, etc.)
 * @param {boolean} [props.showRetry] - Show retry button
 * @param {boolean} [props.showHome] - Show home button
 * @param {function} [props.onRetry] - Retry callback
 * @param {string} [props.variant] - 'default' | 'page' | 'inline' | 'card'
 * @param {string} [props.className] - Additional CSS classes
 */
export function ErrorDisplay({
  title,
  message,
  statusCode,
  showRetry = true,
  showHome = false,
  onRetry,
  variant = 'default',
  className = '',
}) {
  const { t } = useI18n();
  const router = useRouter();

  // Determine error type and default messages
  const getErrorInfo = () => {
    if (statusCode === 404) {
      return {
        title: title || t('errors.notFoundTitle'),
        message: message || t('errors.notFoundMessage'),
        icon: AlertCircle,
        iconColor: 'text-status-info',
      };
    }
    if (statusCode === 403 || statusCode === 401) {
      return {
        title: title || t('errors.unauthorizedTitle'),
        message: message || t('errors.unauthorizedMessage'),
        icon: AlertTriangle,
        iconColor: 'text-status-warning',
      };
    }
    if (statusCode === 500 || statusCode >= 500) {
      return {
        title: title || t('errors.serverErrorTitle'),
        message: message || t('errors.serverErrorMessage'),
        icon: AlertTriangle,
        iconColor: 'text-status-error',
      };
    }
    return {
      title: title || t('errors.genericTitle'),
      message: message || t('errors.genericMessage'),
      icon: AlertTriangle,
      iconColor: 'text-status-error',
    };
  };

  const errorInfo = getErrorInfo();
  const Icon = errorInfo.icon;

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  const handleHome = () => {
    router.push('/dashboard');
  };

  // Page variant - full screen error
  if (variant === 'page') {
    return (
      <div
        className={`fixed inset-0 flex items-center justify-center ${className}`}
        style={{
          background:
            'linear-gradient(135deg, rgba(255, 255, 255, 0.99) 0%, rgba(250, 252, 255, 0.98) 50%, rgba(247, 250, 252, 0.98) 100%)',
          backdropFilter: 'blur(20px) saturate(190%)',
          WebkitBackdropFilter: 'blur(20px) saturate(190%)',
          zIndex: 9999,
        }}
      >
        <div className='relative z-10 max-w-lg w-full mx-4'>
          <Card className='p-8 text-center' elevated>
            <div className='flex flex-col items-center gap-6'>
              {/* Error Icon */}
              <div
                className={`flex items-center justify-center w-20 h-20 rounded-full ${errorInfo.iconColor.replace('text-', 'bg-')}20`}
              >
                <Icon className={`${errorInfo.iconColor} icon icon-2xl`} strokeWidth={1.5} />
              </div>

              {/* Error Content */}
              <div className='flex flex-col gap-3'>
                <h1 className='text-h2 font-bold text-neutral-900 dark:text-neutral-100'>
                  {errorInfo.title}
                </h1>
                <p className='text-body-md text-neutral-600 dark:text-neutral-400 max-w-md mx-auto'>
                  {errorInfo.message}
                </p>
                {statusCode && (
                  <p className='text-body-sm text-neutral-500 dark:text-neutral-500 font-mono'>
                    {t('errors.errorCode')}: {statusCode}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className='flex items-center gap-3 mt-2'>
                {showRetry && (
                  <Button
                    variant='primary'
                    size='md'
                    onClick={handleRetry}
                    className='flex items-center gap-2'
                  >
                    <RefreshCw className='icon icon-sm' />
                    {t('errors.retry')}
                  </Button>
                )}
                {showHome && (
                  <Button
                    variant='outline'
                    size='md'
                    onClick={handleHome}
                    className='flex items-center gap-2'
                  >
                    <Home className='icon icon-sm' />
                    {t('errors.goHome')}
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Card variant - error in a card
  if (variant === 'card') {
    return (
      <Card className={`p-6 ${className}`} elevated>
        <div className='flex flex-col items-center gap-4 text-center'>
          <div
            className={`flex items-center justify-center w-16 h-16 rounded-full ${errorInfo.iconColor.replace('text-', 'bg-')}20`}
          >
            <Icon className={`${errorInfo.iconColor} icon icon-xl`} strokeWidth={1.5} />
          </div>
          <div className='flex flex-col gap-2'>
            <h3 className='text-h4 font-semibold text-neutral-900 dark:text-neutral-100'>
              {errorInfo.title}
            </h3>
            <p className='text-body-sm text-neutral-600 dark:text-neutral-400'>
              {errorInfo.message}
            </p>
          </div>
          {showRetry && (
            <Button
              variant='secondary'
              size='sm'
              onClick={handleRetry}
              className='flex items-center gap-2'
            >
              <RefreshCw className='icon icon-sm' />
              {t('errors.retry')}
            </Button>
          )}
        </div>
      </Card>
    );
  }

  // Inline variant - compact error display
  if (variant === 'inline') {
    return (
      <div
        className={`flex items-start gap-3 p-4 rounded-lg border border-status-error/20 bg-status-error/5 ${className}`}
      >
        <Icon className={`${errorInfo.iconColor} icon icon-md shrink-0 mt-0.5`} strokeWidth={1.5} />
        <div className='flex-1 min-w-0'>
          <p className='text-body-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-1'>
            {errorInfo.title}
          </p>
          <p className='text-body-sm text-neutral-600 dark:text-neutral-400'>{errorInfo.message}</p>
          {showRetry && (
            <Button
              variant='outline'
              size='sm'
              onClick={handleRetry}
              className='mt-3 flex items-center gap-2'
            >
              <RefreshCw className='icon icon-xs' />
              {t('errors.retry')}
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Default variant - balanced error display
  return (
    <div
      className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}
    >
      <div
        className={`flex items-center justify-center w-16 h-16 rounded-full ${errorInfo.iconColor.replace('text-', 'bg-')}20 mb-4`}
      >
        <Icon className={`${errorInfo.iconColor} icon icon-xl`} strokeWidth={1.5} />
      </div>
      <h2 className='text-h3 font-bold text-neutral-900 dark:text-neutral-100 mb-2'>
        {errorInfo.title}
      </h2>
      <p className='text-body-md text-neutral-600 dark:text-neutral-400 max-w-md mb-6'>
        {errorInfo.message}
      </p>
      {statusCode && (
        <p className='text-body-sm text-neutral-500 dark:text-neutral-500 font-mono mb-6'>
          {t('errors.errorCode')}: {statusCode}
        </p>
      )}
      <div className='flex items-center gap-3'>
        {showRetry && (
          <Button
            variant='primary'
            size='md'
            onClick={handleRetry}
            className='flex items-center gap-2'
          >
            <RefreshCw className='icon icon-sm' />
            {t('errors.retry')}
          </Button>
        )}
        {showHome && (
          <Button
            variant='outline'
            size='md'
            onClick={handleHome}
            className='flex items-center gap-2'
          >
            <Home className='icon icon-sm' />
            {t('errors.goHome')}
          </Button>
        )}
      </div>
    </div>
  );
}
