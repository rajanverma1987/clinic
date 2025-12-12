'use client';

import { useRouter } from 'next/navigation';
import { useI18n } from '@/contexts/I18nContext';

/**
 * Reusable Back Button Component
 * Icon-only back button with proper positioning and styling
 */
export function BackButton({ onClick, className = '', ariaLabel }) {
  const router = useRouter();
  const { t } = useI18n();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      router.back();
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`flex items-center justify-center w-10 h-10 rounded-lg border-2 border-neutral-200 hover:border-primary-300 hover:bg-primary-50 text-neutral-600 hover:text-primary-600 transition-all duration-200 ${className}`}
      aria-label={ariaLabel || t('common.back')}
    >
      <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 19l-7-7 7-7' />
      </svg>
    </button>
  );
}

