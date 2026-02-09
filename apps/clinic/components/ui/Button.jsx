'use client';

import { useI18n } from '@/contexts/I18nContext';
import Link from 'next/link';
import { CompactLoader } from './Loader';

/**
 * Platform Button – single source for all actions.
 * All sizes (xs, sm, md, lg, xl) use the same design: radius from design system, proportional padding, same focus/disabled behavior.
 *
 * Variants:
 *   primary / success  – green default; hover/active → primary-500/600
 *   secondary / outline – primary fill with green hover overlay
 *   danger / destructive / logout – red
 *   warning – amber
 *   ghost / tertiary – transparent, hover bg (light + dark)
 *   link – text link
 *
 * Sizes: xs, sm, md, lg, xl. Shape: rounded (design system radius), pill, square.
 */
const BASE =
  'inline-flex items-center justify-center font-medium whitespace-nowrap transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-neutral-900 disabled:opacity-50 disabled:pointer-events-none flex-shrink-0 self-center [&_svg]:shrink-0 [&_svg]:text-current [&_svg]:stroke-current [&_svg]:fill-none group relative overflow-hidden';

const VARIANTS = {
  primary:
    'bg-[#15803d] text-white border-2 border-white shadow-[0_0_0_1px_#15803d] hover:bg-[#166534] hover:border-white active:bg-[#14532d] focus:ring-[#15803d] focus:ring-offset-0 dark:focus:ring-offset-neutral-900 transition-all duration-200',
  success:
    'bg-[#15803d] text-white border-2 border-white shadow-[0_0_0_1px_#15803d] hover:bg-[#166534] hover:border-white active:bg-[#14532d] focus:ring-[#15803d] focus:ring-offset-0 dark:focus:ring-offset-neutral-900 transition-all duration-200',
  secondary:
    'bg-primary-500 text-white border border-white shadow-[0_0_0_0.5px_var(--color-primary-500)] focus:ring-primary-500 focus:ring-offset-0 dark:focus:ring-offset-neutral-900',
  outline:
    'bg-primary-500 text-white border border-white shadow-[0_0_0_0.5px_var(--color-primary-500)] focus:ring-primary-500 focus:ring-offset-0 dark:focus:ring-offset-neutral-900',
  danger:
    'bg-status-error text-white border border-status-error hover:opacity-90 active:opacity-80 focus:ring-status-error focus:ring-offset-0 dark:focus:ring-offset-neutral-900 shadow-sm transition-opacity',
  destructive:
    'bg-status-error text-white border border-status-error hover:opacity-90 active:opacity-80 focus:ring-status-error focus:ring-offset-0 dark:focus:ring-offset-neutral-900 shadow-sm transition-opacity',
  logout:
    'bg-status-error text-white border border-status-error hover:opacity-90 active:opacity-80 focus:ring-status-error focus:ring-offset-0 dark:focus:ring-offset-neutral-900 shadow-sm transition-opacity',
  warning:
    'bg-status-warning text-white border border-status-warning hover:opacity-90 active:opacity-80 focus:ring-status-warning focus:ring-offset-0 dark:focus:ring-offset-neutral-900 shadow-sm transition-opacity',
  ghost:
    'bg-transparent text-primary-600 dark:text-primary-400 border border-transparent hover:bg-primary-50 dark:hover:bg-neutral-800 hover:border-primary-100 dark:hover:border-neutral-700 active:bg-primary-100 dark:active:bg-neutral-700 focus:ring-primary-500',
  tertiary:
    'bg-transparent text-primary-600 dark:text-primary-400 border border-transparent hover:bg-primary-50 dark:hover:bg-neutral-800 hover:border-primary-100 dark:hover:border-neutral-700 active:bg-primary-100 dark:active:bg-neutral-700 focus:ring-primary-500',
  link: 'bg-transparent text-primary-500 dark:text-primary-400 border-0 shadow-none hover:text-primary-700 dark:hover:text-primary-300 hover:underline focus:ring-primary-500 underline-offset-2',
};

/** Same design for all sizes: proportional padding + min-height; radius comes from SHAPES. */
const SIZES = {
  xs: 'gap-1.5 px-3 py-2 text-body-xs min-h-[32px]',
  sm: 'gap-2 px-4 py-2.5 text-body-sm min-h-[40px]',
  md: 'gap-2 px-5 py-3 text-button min-h-[44px]',
  lg: 'gap-2.5 px-6 py-3.5 text-body-md min-h-[52px]',
  xl: 'gap-3 px-7 py-4 text-body-lg min-h-[60px]',
};

const ICON_ONLY_SIZES = {
  xs: 'w-8 h-8 p-0 min-h-[32px] min-w-[32px]',
  sm: 'w-10 h-10 p-0 min-h-[40px] min-w-[40px]',
  md: 'w-11 h-11 p-0 min-h-[44px] min-w-[44px]',
  lg: 'w-12 h-12 p-0 min-h-[52px] min-w-[52px]',
  xl: 'w-14 h-14 p-0 min-h-[60px] min-w-[60px]',
};

/** Single radius for all button sizes – design system token (--radius-lg = 8px). */
const SHAPES = {
  rounded: 'rounded-lg',
  pill: 'rounded-full',
  square: 'rounded-none',
};

const DISABLED =
  '!bg-neutral-300 !text-white !border-neutral-300 hover:!bg-neutral-300 hover:!border-neutral-300 dark:!bg-neutral-600 dark:!text-neutral-300 dark:!border-neutral-600 dark:hover:!bg-neutral-600 dark:hover:!border-neutral-600';

/**
 * When href is provided, renders as Next.js Link (navigation); otherwise as button.
 * Use for: "Back to X", "See all", "Go to Y" – shareable URL, bookmarkable, better a11y.
 */
export function Button({
  variant = 'primary',
  size = 'md',
  shape = 'rounded',
  isLoading = false,
  disabled = false,
  iconOnly = false,
  className = '',
  as,
  href,
  children,
  ...rest
}) {
  const { t } = useI18n();
  const isDisabled = disabled || isLoading;
  const variantStyle = VARIANTS[variant] ?? VARIANTS.primary;
  const sizeStyle = iconOnly
    ? (ICON_ONLY_SIZES[size] ?? ICON_ONLY_SIZES.md)
    : (SIZES[size] ?? SIZES.md);
  const shapeStyle =
    iconOnly && shape === 'rounded' ? SHAPES.rounded : (SHAPES[shape] ?? SHAPES.rounded);
  const pillShape = iconOnly && shape === 'pill' ? SHAPES.pill : shapeStyle;
  const isSecondaryStyle = variant === 'secondary' || variant === 'outline';
  const iconOnlyPill = iconOnly && shape === 'pill';
  const classNames = `${BASE} ${variantStyle} ${sizeStyle} ${pillShape} ${
    iconOnlyPill ? 'aspect-square' : ''
  } ${isDisabled ? DISABLED : ''} ${className}`.trim();
  const content = isLoading ? (
    <span className='inline-flex items-center justify-center gap-2'>
      <CompactLoader
        size='sm'
        variant={
          variant === 'link' || variant === 'ghost' || variant === 'tertiary' ? 'primary' : 'white'
        }
        aria-label={t('common.loading')}
      />
      <span>{t('common.loading')}</span>
    </span>
  ) : (
    children
  );

  const fillOverlay = isSecondaryStyle && !isDisabled && (
    <span
      className='absolute left-[1px] top-[1px] bottom-[1px] w-0 group-hover:w-[calc(100%-2px)] transition-[width] duration-300 ease-out rounded-l-[7px] group-hover:rounded-[7px] bg-gradient-to-r from-[#15803d] to-[#166534] z-0'
      aria-hidden
    />
  );

  const contentSpanClass =
    (isSecondaryStyle ? 'relative z-10 ' : '') +
    'inline-flex items-center justify-center gap-[var(--icon-text-gap)]';

  if (href && !isDisabled) {
    const { onClick, type, ...linkRest } = rest;
    return (
      <Link href={href} className={classNames} aria-disabled={false} {...linkRest}>
        {isSecondaryStyle && fillOverlay}
        <span className={contentSpanClass}>{content}</span>
      </Link>
    );
  }

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
