'use client';

import { ChevronLeftIcon } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { useI18n } from '@/contexts/I18nContext';
import { useRouter } from 'next/navigation';

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
      className={`rounded-lg border border-neutral-200 dark:border-neutral-600 hover:border-primary-300 dark:hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/30 text-neutral-600 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200 ease-out ${className}`}
    >
      <ChevronLeftIcon className='icon icon-sm' />
    </Button>
  );
}
