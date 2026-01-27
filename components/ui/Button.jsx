'use client';

import { useI18n } from '@/contexts/I18nContext';
import { useRef } from 'react';
import { CompactLoader } from './Loader';

/**
 * Design-system Button. Use for all actions; avoid raw <button>.
 *
 * Canonical variants (one style each):
 *   primary   – filled blue, main CTA (success is alias)
 *   secondary – blue outline, white bg (outline is alias)
 *   danger    – filled red, destructive (destructive, logout are aliases)
 *   ghost     – transparent, hover bg (tertiary is alias)
 *   link      – text link style
 *   warning   – filled amber, risky actions
 *
 * Sizes: xs, sm, md, lg, xl. Use sm in dense UIs, md as default.
 */
const PRIMARY_STYLE =
  'bg-primary-500 text-white border border-white focus:ring-primary-500 active:bg-primary-700 shadow-md group-hover:shadow-none group relative overflow-hidden z-0';
const SECONDARY_STYLE =
  'bg-white !border !border-primary-500 group-hover:!border-white text-primary-500 group-hover:!text-white focus:ring-primary-500 shadow-md group-hover:shadow-none group relative overflow-hidden z-0 transition-all duration-300';
const DANGER_STYLE =
  'bg-status-error text-white border border-status-error focus:ring-status-error shadow-md group-hover:shadow-none group relative overflow-hidden z-0';

export function Button({
  variant = 'primary',
  size = 'md',
  shape = 'rounded', // 'rounded', 'pill', 'square'
  isLoading = false,
  className = '',
  disabled,
  iconOnly = false, // For icon-only buttons
  children,
  ...props
}) {
  const { t } = useI18n();
  const secondaryFillRef = useRef(null);

  const baseStyles =
    'inline-flex items-center justify-center gap-2 text-button transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap relative overflow-hidden border-0';

  const shapes = {
    rounded: 'rounded-[10px]',
    pill: 'rounded-full',
    square: 'rounded-none',
  };

  // One canonical style per visual; aliases point to same style
  const variants = {
    primary: PRIMARY_STYLE,
    success: PRIMARY_STYLE,
    secondary: SECONDARY_STYLE,
    outline: SECONDARY_STYLE,
    danger: DANGER_STYLE,
    destructive: DANGER_STYLE,
    logout: DANGER_STYLE,
    warning:
      'bg-status-warning text-white border border-status-warning focus:ring-status-warning shadow-md group-hover:shadow-none group relative overflow-hidden z-0 active:bg-yellow-600',
    link: 'bg-transparent border-0 text-primary-500 hover:text-primary-700 focus:ring-primary-500 underline-offset-4 hover:underline group relative',
    ghost:
      'bg-transparent border border-transparent text-primary-500 hover:border-primary-300 hover:bg-primary-50 focus:ring-primary-500 group relative',
    tertiary:
      'bg-transparent border border-transparent text-primary-500 hover:border-primary-300 hover:bg-primary-50 focus:ring-primary-500 group relative',
  };

  // Sizes with theme padding
  const sizes = {
    xs: 'px-3 py-1.5 text-body-xs font-semibold min-h-[32px]', // Extra small for chips, dense UIs
    sm: 'px-4 py-2.5 text-body-sm font-semibold min-h-[38px]', // Small for tables, compact forms
    md: 'px-5 py-3.5 text-button min-h-[44px]', // Medium - default everywhere
    lg: 'px-6 py-4 text-body-md font-semibold min-h-[52px]', // Large for hero sections, onboarding
    xl: 'px-8 py-5 text-body-lg font-semibold min-h-[60px]', // Extra large for prominent CTAs
  };

  // Icon-only button sizes (square aspect ratio)
  const iconOnlySizes = {
    xs: 'w-8 h-8 p-0',
    sm: 'w-10 h-10 p-0',
    md: 'w-12 h-12 p-0',
    lg: 'w-14 h-14 p-0',
    xl: 'w-16 h-16 p-0',
  };

  // Disabled state - only override when explicitly disabled (not just loading)
  const isDisabled = disabled || isLoading;
  const disabledStyles = isDisabled
    ? '!bg-neutral-300 !text-white cursor-not-allowed hover:!bg-neutral-300 hover:!opacity-50'
    : '';

  const sizeClasses = iconOnly ? iconOnlySizes[size] || iconOnlySizes.md : sizes[size] || sizes.md;
  const shapeClass = shapes[shape] || shapes.rounded;
  const finalShapeClass = iconOnly && shape === 'pill' ? shapes.pill : shapeClass;

  // Resolved visual: primary/success, secondary/outline, danger/destructive/logout share effects
  const isPrimaryStyle = variant === 'primary' || variant === 'success';
  const isSecondaryStyle = variant === 'secondary' || variant === 'outline';
  const isDangerStyle = variant === 'danger' || variant === 'destructive' || variant === 'logout';
  const isLightStyle =
    isSecondaryStyle || variant === 'tertiary' || variant === 'ghost' || variant === 'link';

  const handleMouseEnter = (e) => {
    if (isSecondaryStyle && secondaryFillRef.current) {
      secondaryFillRef.current.style.width = '100%';
    }
    if (props.onMouseEnter) props.onMouseEnter(e);
  };

  const handleMouseLeave = (e) => {
    if (isSecondaryStyle && secondaryFillRef.current) {
      secondaryFillRef.current.style.width = '0%';
    }
    if (props.onMouseLeave) props.onMouseLeave(e);
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizeClasses} ${finalShapeClass} ${disabledStyles} ${className}`}
      disabled={isDisabled}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {/* Primary / success: blue gradient hover */}
      {isPrimaryStyle && (
        <span
          className='absolute inset-[1px] bg-gradient-to-r from-primary-500 to-primary-700 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-[1]'
          style={{ borderRadius: '0.75rem' }}
        />
      )}

      {/* Secondary / outline: blue gradient fill left to right */}
      {isSecondaryStyle && (
        <span
          className='absolute inset-[1px] z-[1] overflow-hidden'
          style={{ borderRadius: '0.75rem' }}
        >
          <span
            ref={secondaryFillRef}
            className='absolute inset-0 bg-gradient-to-r from-primary-500 to-primary-700'
            style={{ width: '0%', transition: 'width 0.5s ease-out' }}
          />
        </span>
      )}

      {/* Danger / destructive / logout: red gradient hover */}
      {isDangerStyle && (
        <span
          className='absolute inset-[1px] bg-gradient-to-r from-[#C54141] to-[#A03030] opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-[1]'
          style={{ borderRadius: '0.75rem' }}
        />
      )}

      {/* Warning: yellow gradient hover */}
      {variant === 'warning' && (
        <span
          className='absolute inset-[1px] bg-gradient-to-r from-status-warning to-yellow-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-[1]'
          style={{ borderRadius: '0.75rem' }}
        />
      )}

      <span
        className={`relative z-10 flex items-center justify-center ${
          isPrimaryStyle || isDangerStyle || variant === 'warning'
            ? 'text-white [&_svg]:text-white [&_svg]:stroke-white [&_svg]:fill-white group-hover:[&_svg]:text-white group-hover:[&_svg]:stroke-white group-hover:[&_svg]:fill-white'
            : isLightStyle
              ? 'text-neutral-900 [&_svg]:text-neutral-900 [&_svg]:stroke-neutral-900 [&_svg]:fill-neutral-900 group-hover:[&_svg]:text-white group-hover:[&_svg]:stroke-white group-hover:[&_svg]:fill-white group-hover:text-white'
              : ''
        }`}
      >
        {isLoading ? (
          <span className='flex items-center' style={{ gap: 'var(--gap-2)' }}>
            <CompactLoader size='sm' variant={isLightStyle ? 'primary' : 'white'} />
            <span>{t('common.loading')}</span>
          </span>
        ) : (
          children
        )}
      </span>
    </button>
  );
}
