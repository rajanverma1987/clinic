'use client';

import { useRouter } from 'next/navigation';
import { useI18n } from '@/contexts/I18nContext';
import { Button } from '@/components/ui/Button';

/**
 * Reusable Back Button – uses design-system Button (ghost, icon-only).
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
    <Button
      variant='ghost'
      size='sm'
      iconOnly
      onClick={handleClick}
      aria-label={ariaLabel || t('common.back')}
      className={`rounded-lg border border-neutral-200 hover:border-primary-300 hover:bg-primary-50 text-neutral-600 hover:text-primary-600 ${className}`}
    >
      <svg className='icon icon-sm' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 19l-7-7 7-7' />
      </svg>
    </Button>
  );
}

