'use client';

import { Button } from '@/components/ui/Button';
import { extractLocale, getTranslation, supportedLocales } from '@/lib/i18n/index';
import { logger } from '@/lib/utils/logger';
import { Component } from 'react';

function resolveLocale() {
  if (typeof window === 'undefined') {
    return 'en';
  }
  const storedLocale = localStorage.getItem('locale');
  if (storedLocale && supportedLocales.includes(storedLocale)) {
    return storedLocale;
  }
  if (document?.documentElement?.lang) {
    const lang = extractLocale(document.documentElement.lang);
    if (supportedLocales.includes(lang)) {
      return lang;
    }
  }
  if (navigator?.language) {
    const lang = extractLocale(navigator.language);
    if (supportedLocales.includes(lang)) {
      return lang;
    }
  }
  return 'en';
}

function translate(key, fallback) {
  try {
    const locale = resolveLocale();
    const value = getTranslation(key, locale);
    if (value && value !== key) {
      return value;
    }
    return fallback;
  } catch (_error) {
    return fallback;
  }
}

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    logger.error('Dashboard error boundary triggered', error, {
      componentStack: info?.componentStack,
      boundaryName: this.props.name || 'GlobalErrorBoundary',
    });

    if (typeof this.props.onError === 'function') {
      try {
        this.props.onError(error, info);
      } catch (callbackError) {
        logger.error('ErrorBoundary onError callback failed', callbackError);
      }
    }
  }

  handleReload = () => {
    if (typeof this.props.onReload === 'function') {
      this.props.onReload();
      return;
    }
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (typeof this.props.onReset === 'function') {
      try {
        this.props.onReset();
      } catch (callbackError) {
        logger.error('ErrorBoundary onReset callback failed', callbackError);
      }
    }
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const title = translate('errors.generic', 'Something went wrong');
    const suggestion = translate(
      'errors.sessionExpired',
      'Please refresh the page or try again shortly.',
    );
    const retryLabel = translate('common.retry', 'Retry');
    const reloadLabel = translate('common.refresh', 'Refresh');

    return (
      <div
        role='alert'
        className='flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-6 py-16 text-center'
      >
        <div className='w-full max-w-lg rounded-3xl border border-neutral-200 bg-white p-10 shadow-xl'>
          <div className='mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 text-primary-600'>
            <svg className='h-8 w-8' viewBox='0 0 24 24' fill='none' stroke='currentColor'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
              />
            </svg>
          </div>
          <h2 className='mb-3 text-2xl font-semibold text-neutral-900'>{title}</h2>
          <p className='mb-8 text-base text-neutral-600'>{suggestion}</p>
          <div className='flex flex-col items-center justify-center gap-3 sm:flex-row'>
            <Button variant='primary' onClick={this.handleReset} className='w-full sm:w-auto'>
              {retryLabel}
            </Button>
            <Button variant='outline' onClick={this.handleReload} className='w-full sm:w-auto'>
              {reloadLabel}
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
