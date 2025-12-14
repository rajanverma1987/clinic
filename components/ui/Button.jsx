'use client';

import { useI18n } from '@/contexts/I18nContext';
import { CompactLoader } from './Loader';
import { useRef } from 'react';

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
  
  // Base styles with theme specifications
  const baseStyles =
    'inline-flex items-center justify-center text-button transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap relative overflow-hidden border-0';

  // Shape variants
  const shapes = {
    rounded: '', // Will use custom 0.75rem radius
    pill: 'rounded-full',
    square: 'rounded-none',
  };

  // Variants following theme specifications
  const variants = {
    // Primary: bg-primary-500, hover: green gradient overlay (left to right), text: white, permanent white border
    primary:
      'bg-primary-500 text-white border-2 border-white focus:ring-primary-500 active:bg-secondary-700 shadow-md group-hover:shadow-none group relative overflow-hidden z-0',
    // Secondary: Single blue border, white bg, hover: blue gradient fill left to right
    secondary:
      'bg-white border-2 border-primary-500 text-primary-500 group-hover:!text-white focus:ring-primary-500 shadow-md group-hover:shadow-none group relative overflow-hidden z-0 transition-all duration-300',
    // Tertiary: Text-only, no background, low emphasis
    tertiary:
      'bg-transparent border-0 text-primary-500 hover:text-primary-700 focus:ring-primary-500 hover:bg-primary-50 group relative',
    // Destructive/Danger: bg-status-error, hover: darker red gradient
    danger:
      'bg-status-error text-white border-2 border-status-error focus:ring-status-error shadow-md group-hover:shadow-none group relative overflow-hidden z-0',
    destructive: 'bg-status-error text-white border-2 border-status-error focus:ring-status-error shadow-md group-hover:shadow-none group relative overflow-hidden z-0',
    // Success: Green background for positive actions
    success:
      'bg-secondary-500 text-white border-2 border-secondary-500 focus:ring-secondary-500 shadow-md group-hover:shadow-none group relative overflow-hidden z-0 active:bg-secondary-700',
    // Warning: Yellow background for risky actions
    warning:
      'bg-status-warning text-white border-2 border-status-warning focus:ring-status-warning shadow-md group-hover:shadow-none group relative overflow-hidden z-0 active:bg-yellow-600',
    // Link: Looks like text but behaves like button
    link:
      'bg-transparent border-0 text-primary-500 hover:text-primary-700 focus:ring-primary-500 underline-offset-4 hover:underline group relative',
    // Ghost: Transparent with border on hover
    ghost:
      'bg-transparent border-2 border-transparent text-primary-500 hover:border-primary-300 hover:bg-primary-50 focus:ring-primary-500 group relative',
    // Outline: border neutral-300, bg white, text neutral-900, hover: primary blue gradient
    outline:
      'border-2 border-neutral-300 bg-white text-neutral-900 group-hover:!border-primary-500 focus:ring-primary-500 group relative overflow-hidden z-0',
    // Logout: light red background, white text, red gradient on hover
    logout:
      'bg-status-error text-white border-2 border-status-error focus:ring-status-error active:bg-status-error/90 shadow-md group-hover:shadow-none group relative overflow-hidden z-0',
  };

  // Sizes with theme padding (reduced by 10% - using closest standard Tailwind classes)
  const sizes = {
    xs: 'px-2.5 py-1.5 text-body-xs font-semibold min-h-[29px] [&_svg]:w-[9px] [&_svg]:h-[9px]', // Extra small for chips, dense UIs
    sm: 'px-4 py-2.5 text-body-sm font-semibold min-h-[36px] [&_svg]:w-[14px] [&_svg]:h-[14px]', // Small for tables, compact forms
    md: 'px-4 py-2.5 text-button min-h-[40px] [&_svg]:w-[18px] [&_svg]:h-[18px]', // Medium - default everywhere
    lg: 'px-5 py-3 text-body-md font-semibold min-h-[47px] [&_svg]:w-[22px] [&_svg]:h-[22px]', // Large for hero sections, onboarding
    xl: 'px-7 py-4 text-body-lg font-semibold min-h-[54px] [&_svg]:w-[26px] [&_svg]:h-[26px]', // Extra large for prominent CTAs
  };

  // Icon-only button sizes (square aspect ratio, reduced by 10%)
  const iconOnlySizes = {
    xs: 'w-[28px] h-[28px] p-0 [&_svg]:w-[14px] [&_svg]:h-[14px]',
    sm: 'w-[36px] h-[36px] p-0 [&_svg]:w-[18px] [&_svg]:h-[18px]',
    md: 'w-[44px] h-[44px] p-0 [&_svg]:w-[22px] [&_svg]:h-[22px]',
    lg: 'w-[52px] h-[52px] p-0 [&_svg]:w-[26px] [&_svg]:h-[26px]',
    xl: 'w-[56px] h-[56px] p-0 [&_svg]:w-[28px] [&_svg]:h-[28px]',
  };

  // Disabled state - only override when explicitly disabled (not just loading)
  const isDisabled = disabled || isLoading;
  const disabledStyles = isDisabled
    ? '!bg-neutral-300 !text-white cursor-not-allowed hover:!bg-neutral-300 hover:!opacity-50'
    : '';

  // Determine size classes based on iconOnly prop
  const sizeClasses = iconOnly ? (iconOnlySizes[size] || iconOnlySizes.md) : (sizes[size] || sizes.md);
  const shapeClass = shapes[shape] || shapes.rounded;
  
  // For icon-only buttons, use rounded-full if shape is pill, otherwise use shape
  const finalShapeClass = iconOnly && shape === 'pill' ? shapes.pill : shapeClass;

  const handleMouseEnter = (e) => {
    if (variant === 'secondary' && secondaryFillRef.current) {
      secondaryFillRef.current.style.width = '100%';
    }
    if (props.onMouseEnter) props.onMouseEnter(e);
  };

  const handleMouseLeave = (e) => {
    if (variant === 'secondary' && secondaryFillRef.current) {
      secondaryFillRef.current.style.width = '0%';
    }
    if (props.onMouseLeave) props.onMouseLeave(e);
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizeClasses} ${finalShapeClass} ${disabledStyles} ${className}`}
      style={finalShapeClass === '' ? { borderRadius: '0.675rem' } : {}}
      disabled={isDisabled}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {/* Green gradient hover effect - fades in for Primary */}
      {variant === 'primary' && (
        <span className='absolute inset-[2px] bg-gradient-to-r from-secondary-500 to-secondary-700 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-[1]' style={{ borderRadius: '0.675rem' }}></span>
      )}

      {/* Blue gradient hover effect for Secondary - fills left to right */}
      {variant === 'secondary' && (
        <span 
          className='absolute inset-[2px] z-[1] overflow-hidden'
          style={{ borderRadius: '0.675rem' }}
        >
          <span 
            ref={secondaryFillRef}
            className='absolute inset-0 bg-gradient-to-r from-primary-500 to-primary-700'
            style={{
              width: '0%',
              transition: 'width 0.5s ease-out',
            }}
          ></span>
        </span>
      )}

      {/* Red gradient hover effect for Danger/Destructive */}
      {(variant === 'danger' || variant === 'destructive') && (
        <span className='absolute inset-[2px] bg-gradient-to-r from-[#C54141] to-[#A03030] opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-[1]' style={{ borderRadius: '0.75rem' }}></span>
      )}

      {/* Green gradient hover effect for Success */}
      {variant === 'success' && (
        <span className='absolute inset-[2px] bg-gradient-to-r from-secondary-500 to-secondary-700 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-[1]' style={{ borderRadius: '0.675rem' }}></span>
      )}

      {/* Yellow gradient hover effect for Warning */}
      {variant === 'warning' && (
        <span className='absolute inset-[2px] bg-gradient-to-r from-status-warning to-yellow-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-[1]' style={{ borderRadius: '0.75rem' }}></span>
      )}

      {/* Red gradient hover effect for Logout */}
      {variant === 'logout' && (
        <span className='absolute inset-[2px] bg-gradient-to-r from-status-error to-status-error/90 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-[1]' style={{ borderRadius: '0.75rem' }}></span>
      )}

      {/* Primary blue gradient hover effect for Outline */}
      {variant === 'outline' && (
        <span className='absolute inset-[2px] bg-gradient-to-r from-primary-500 to-primary-700 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-[1]' style={{ borderRadius: '0.75rem' }}></span>
      )}



      {/* Shine effect overlay for Logout button */}
      {variant === 'logout' && (
        <span className='absolute inset-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10' style={{ borderRadius: '0.75rem' }}>
          <span
            className='absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shine-once'
            style={{ width: '50%' }}
          ></span>
        </span>
      )}

      {/* Content with relative z-index - SVG colors based on background */}
      <span
        className={`relative z-10 flex items-center justify-center ${
          // Dark backgrounds: white text and white SVGs
          variant === 'primary' ||
          variant === 'danger' ||
          variant === 'destructive' ||
          variant === 'success' ||
          variant === 'warning' ||
          variant === 'logout'
            ? 'text-white [&_svg]:text-white [&_svg]:stroke-white [&_svg]:fill-white group-hover:[&_svg]:text-white group-hover:[&_svg]:stroke-white group-hover:[&_svg]:fill-white'
            // Light backgrounds: dark text and dark SVGs
            : variant === 'secondary' ||
              variant === 'outline' ||
              variant === 'tertiary' ||
              variant === 'ghost' ||
              variant === 'link'
            ? 'text-neutral-900 [&_svg]:text-neutral-900 [&_svg]:stroke-neutral-900 [&_svg]:fill-neutral-900 group-hover:[&_svg]:text-white group-hover:[&_svg]:stroke-white group-hover:[&_svg]:fill-white group-hover:text-white'
            : ''
        }`}
      >
        {isLoading ? (
          <span className='flex items-center' style={{ gap: 'var(--gap-2)' }}>
            <CompactLoader
              size='sm'
              variant={
                variant === 'secondary' || 
                variant === 'outline' || 
                variant === 'tertiary' || 
                variant === 'ghost' || 
                variant === 'link'
                  ? 'primary' 
                  : 'white'
              }
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
