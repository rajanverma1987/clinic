'use client';

import { useI18n } from '@/contexts/I18nContext';

/**
 * Button – matches clinic tool: primary green with border/shadow, secondary with green hover overlay.
 */
const BASE =
  'inline-flex items-center justify-center font-medium whitespace-nowrap transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white disabled:opacity-50 disabled:pointer-events-none flex-shrink-0 self-center [&_svg]:shrink-0 [&_svg]:text-current [&_svg]:stroke-current [&_svg]:fill-none group relative overflow-hidden';

const VARIANTS = {
  primary:
    'bg-cta-primary text-white border-2 border-white shadow-[0_0_0_1px_var(--color-cta-primary)] hover:bg-primary-500 hover:border-white active:bg-primary-600 focus:ring-primary-500 focus:ring-offset-0 transition-all duration-200',
  success:
    'bg-cta-primary text-white border-2 border-white shadow-[0_0_0_1px_var(--color-cta-primary)] hover:bg-primary-500 hover:border-white active:bg-primary-600 focus:ring-primary-500 focus:ring-offset-0 transition-all duration-200',
  secondary:
    'bg-primary-500 text-white border border-white shadow-[0_0_0_0.5px_var(--color-primary-500)] focus:ring-primary-500 focus:ring-offset-0',
  outline:
    'bg-primary-500 text-white border border-white shadow-[0_0_0_0.5px_var(--color-primary-500)] focus:ring-primary-500 focus:ring-offset-0',
  danger:
    'bg-status-error text-white border border-status-error hover:bg-red-600 hover:border-red-600 active:bg-red-700 focus:ring-status-error focus:ring-offset-0 shadow-sm',
  ghost:
    'bg-transparent text-primary-600 border border-transparent hover:bg-primary-50 hover:border-primary-100 active:bg-primary-100 focus:ring-primary-500',
  link: 'bg-transparent text-primary-500 border-0 shadow-none hover:text-primary-700 hover:underline focus:ring-primary-500 underline-offset-2',
};

const SIZES = {
  xs: 'gap-1.5 px-3 py-2 text-xs min-h-[32px]',
  sm: 'gap-2 px-4 py-2.5 text-sm min-h-[40px]',
  md: 'gap-2 px-5 py-3 text-base min-h-[44px]',
  lg: 'gap-2.5 px-6 py-3.5 text-base min-h-[52px]',
  xl: 'gap-3 px-7 py-4 text-lg min-h-[60px]',
};

const SHAPES = {
  rounded: 'rounded-lg',
  pill: 'rounded-full',
  square: 'rounded-none',
};

const DISABLED =
  '!bg-neutral-300 !text-white !border-neutral-300 hover:!bg-neutral-300 hover:!border-neutral-300';

export function Button({
  variant = 'primary',
  size = 'md',
  shape = 'rounded',
  isLoading = false,
  disabled = false,
  iconOnly = false,
  className = '',
  as,
  children,
  ...rest
}) {
  const { t } = useI18n();
  const isDisabled = disabled || isLoading;
  const variantStyle = VARIANTS[variant] ?? VARIANTS.primary;
  const sizeStyle = iconOnly ? (SIZES[size] ?? SIZES.md) : (SIZES[size] ?? SIZES.md);
  const shapeStyle = SHAPES[shape] ?? SHAPES.rounded;
  const isSecondaryStyle = variant === 'secondary' || variant === 'outline';
  const classNames =
    `${BASE} ${variantStyle} ${sizeStyle} ${shapeStyle} ${isDisabled ? DISABLED : ''} ${className}`.trim();

  const content = isLoading ? (
    <span className='inline-flex items-center justify-center gap-2'>{t('common.loading')}</span>
  ) : (
    children
  );

  const fillOverlay = isSecondaryStyle && !isDisabled && (
    <span
      className='absolute left-[1px] top-[1px] bottom-[1px] w-0 group-hover:w-[calc(100%-2px)] transition-[width] duration-300 ease-out rounded-l-[7px] group-hover:rounded-[7px] bg-gradient-to-r from-cta-primary to-cta-primary-hover z-0'
      aria-hidden
    />
  );

  const contentSpanClass =
    (isSecondaryStyle ? 'relative z-10 ' : '') +
    'inline-flex items-center justify-center gap-[inherit]';

  if (as === 'span') {
    const { type, ...spanRest } = rest;
    return (
      <span
        role='button'
        tabIndex={isDisabled ? -1 : 0}
        aria-disabled={isDisabled}
        className={classNames}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (!isDisabled && rest.onClick) rest.onClick(e);
          }
        }}
        {...spanRest}
      >
        {isSecondaryStyle && fillOverlay}
        <span className={contentSpanClass}>{content}</span>
      </span>
    );
  }

  return (
    <button type={rest.type ?? 'button'} className={classNames} disabled={isDisabled} {...rest}>
      {isSecondaryStyle && fillOverlay}
      <span className={contentSpanClass}>{content}</span>
    </button>
  );
}
