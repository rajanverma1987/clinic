'use client';

import { useI18n } from '@/contexts/I18nContext';
import { CompactLoader } from './Loader';

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className = '',
  disabled,
  children,
  ...props
}) {
  const { t } = useI18n();
  // Base styles with theme specifications
  const baseStyles =
    'inline-flex items-center justify-center text-button rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap relative overflow-hidden border-0';

  // Variants following theme specifications
  const variants = {
    // Primary: bg-primary-500, hover: green gradient overlay (left to right), text: white, permanent white border
    primary:
      'bg-primary-500 text-white border-2 border-white focus:ring-primary-500 active:bg-secondary-700 shadow-md group relative overflow-hidden z-0',
    // Secondary: Single blue border, white bg, hover: green gradient with blue border maintained
    secondary:
      'bg-white border-2 border-primary-500 text-primary-500 group-hover:!text-white focus:ring-primary-500 shadow-md group relative overflow-hidden z-0 transition-all duration-300',
    // Danger: bg-status-error, hover: darker red gradient (left to right)
    danger:
      'bg-status-error text-white border-2 border-status-error focus:ring-status-error shadow-md group relative overflow-hidden z-0',
    // Logout: light red background, white text, red gradient on hover
    logout:
      'bg-status-error text-white border-2 border-status-error focus:ring-status-error active:bg-status-error/90 shadow-md group relative overflow-hidden z-0',
    // Outline: border neutral-300, bg white, text neutral-900, hover: primary blue gradient
    outline:
      'border-2 border-neutral-300 bg-white text-neutral-900 group-hover:!border-primary-500 focus:ring-primary-500 group relative overflow-hidden z-0',
  };

  // Sizes with theme padding (12px vertical, 20px horizontal per theme spec)
  const sizes = {
    sm: 'px-5 py-3 text-body-sm font-semibold min-h-[40px]', // 12px py-3, 20px px-5
    md: 'px-5 py-3 text-button min-h-[44px]', // 12px py-3, 20px px-5 (theme standard: 12px 20px)
    lg: 'px-6 py-4 text-body-md font-semibold min-h-[52px]', // 16px py-4, 24px px-6
  };

  // Disabled state - only override when explicitly disabled (not just loading)
  const isDisabled = disabled || isLoading;
  const disabledStyles = isDisabled
    ? '!bg-neutral-300 !text-white cursor-not-allowed hover:!bg-neutral-300 hover:!opacity-50 hover:!opacity-50'
    : '';

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${disabledStyles} ${className}`}
      disabled={isDisabled}
      {...props}
    >
      {/* Green gradient hover effect - fades in for Primary */}
      {variant === 'primary' && (
        <span className='absolute inset-[2px] bg-gradient-to-r from-secondary-500 to-secondary-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-md z-[1]'></span>
      )}

      {/* Green gradient hover effect for Secondary - doesn't cover border */}
      {variant === 'secondary' && (
        <span className='absolute inset-[2px] bg-gradient-to-r from-secondary-500 to-secondary-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-md z-[1]'></span>
      )}

      {/* Red gradient hover effect for Danger */}
      {variant === 'danger' && (
        <span className='absolute inset-[2px] bg-gradient-to-r from-[#C54141] to-[#A03030] opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-md z-[1]'></span>
      )}

      {/* Red gradient hover effect for Logout */}
      {variant === 'logout' && (
        <span className='absolute inset-[2px] bg-gradient-to-r from-status-error to-status-error/90 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-md z-[1]'></span>
      )}

      {/* Primary blue gradient hover effect for Outline */}
      {variant === 'outline' && (
        <span className='absolute inset-[2px] bg-gradient-to-r from-primary-500 to-primary-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-md z-[1]'></span>
      )}

      {/* Shine effect overlay for Primary button */}
      {variant === 'primary' && (
        <span className='absolute inset-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10 rounded-md'>
          <span
            className='absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shine-once'
            style={{ width: '50%' }}
          ></span>
        </span>
      )}

      {/* Shine effect overlay for Secondary button */}
      {variant === 'secondary' && (
        <span className='absolute inset-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10 rounded-md'>
          <span
            className='absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shine-once'
            style={{ width: '50%' }}
          ></span>
        </span>
      )}

      {/* Shine effect overlay for Logout button */}
      {variant === 'logout' && (
        <span className='absolute inset-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10 rounded-md'>
          <span
            className='absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shine-once'
            style={{ width: '50%' }}
          ></span>
        </span>
      )}

      {/* Content with relative z-index */}
      <span
        className={`relative z-10 flex items-center justify-center ${
          variant === 'secondary' ||
          variant === 'outline' ||
          variant === 'primary' ||
          variant === 'danger' ||
          variant === 'logout'
            ? 'group-hover:text-white'
            : ''
        }`}
      >
        {isLoading ? (
          <span className='flex items-center' style={{ gap: 'var(--gap-2)' }}>
            <CompactLoader
              size='sm'
              variant={variant === 'secondary' || variant === 'outline' ? 'primary' : 'white'}
            />
            <span>{t('common.loading')}</span>
          </span>
        ) : (
          children
        )}
      </span>
    </button>
  );
}
