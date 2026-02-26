'use client';

import { useI18n } from '@/contexts/I18nContext';
import Link from 'next/link';
import { forwardRef } from 'react';
import { CompactLoader } from './Loader';

/**
 * Platform Button – single source for all interactive actions.
 *
 * Variants (semantic):
 *   primary    – filled blue  (brand color, main CTA)
 *   secondary  – outlined blue (alternative CTA, same brand family)
 *   success    – filled green (medical confirm / approve / finalize)
 *   outline    – alias of secondary
 *   danger     – filled red   (irreversible / destructive only)
 *   logout     – alias of danger
 *   warning    – filled amber (cautionary)
 *   ghost      – transparent + blue text (subtle, low-emphasis)
 *   link       – inline text link, no height/padding
 *
 * Sizes:  xs | sm | md (default) | lg | xl | compact | auto | listRow
 *   compact – 28px height for tight surfaces (banners, toolbars)
 *   auto    – content height (dropdown menu items, no fixed height)
 *   link variant always ignores size (flows inline with text)
 *
 * Shapes: rounded (default) | pill | square
 *
 * Special props:
 *   iconOnly   – square button, size-matched
 *   fullWidth  – w-full
 *   align      – 'center' (default) | 'start' (left-align, e.g. menu items)
 *   isLoading  – spinner + disabled
 *   href       – renders as Next.js <Link>
 *   as="span"  – renders as accessible <span role="button">
 */

/** Base layout shared by every button variant. Matches website: group + overflow for secondary hover fill. */
const BASE =
  'inline-flex items-center justify-center font-medium whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-neutral-900 flex-shrink-0 self-center [&_svg]:shrink-0 [&_svg]:text-current [&_svg]:stroke-current [&_svg]:fill-none transition-all duration-200 group relative overflow-hidden';

const VARIANTS = {
  /** Primary – same as website: green #15803d, white border + ring; hover → blue, active → darker blue. */
  primary:
    'bg-[#15803d] text-white border border-white shadow-[0_0_0_0.5px_#15803d] hover:bg-primary-500 hover:shadow-[0_0_0_0.5px_#1e4fb5] active:bg-primary-600 focus:ring-primary-500 focus:ring-offset-0 dark:focus:ring-offset-neutral-900 transition-all duration-200',

  /** Secondary – same as website: blue fill, white border + ring; hover → green slide overlay (see fillOverlay). */
  secondary:
    'bg-primary-500 text-white border border-white shadow-[0_0_0_0.5px_#1e4fb5] focus:ring-primary-500 focus:ring-offset-0 dark:focus:ring-offset-neutral-900',

  /** Alias of secondary. */
  outline:
    'bg-primary-500 text-white border border-white shadow-[0_0_0_0.5px_#1e4fb5] focus:ring-primary-500 focus:ring-offset-0 dark:focus:ring-offset-neutral-900',

  /** Success – same as website primary (green); hover/active → blue. */
  success:
    'bg-[#15803d] text-white border border-white shadow-[0_0_0_0.5px_#15803d] hover:bg-primary-500 hover:shadow-[0_0_0_0.5px_#1e4fb5] active:bg-primary-600 focus:ring-primary-500 focus:ring-offset-0 dark:focus:ring-offset-neutral-900 transition-all duration-200',

  /** Filled red – irreversible or destructive actions only. */
  danger:
    'bg-status-error text-white border border-status-error hover:opacity-90 active:opacity-80 focus:ring-status-error focus:ring-offset-0 dark:focus:ring-offset-neutral-900 shadow-sm',

  /** Alias of danger – session-ending actions. */
  logout:
    'bg-status-error text-white border border-status-error hover:opacity-90 active:opacity-80 focus:ring-status-error focus:ring-offset-0 dark:focus:ring-offset-neutral-900 shadow-sm',

  /** Filled amber – cautionary / proceed-with-care actions. */
  warning:
    'bg-status-warning text-white border border-status-warning hover:opacity-90 active:opacity-80 focus:ring-status-warning focus:ring-offset-0 dark:focus:ring-offset-neutral-900 shadow-sm',

  /** Transparent + branded text – low-emphasis actions (cancel, back, close). */
  ghost:
    'bg-transparent text-primary-600 dark:text-primary-400 border border-transparent hover:bg-primary-50 dark:hover:bg-neutral-800 hover:border-primary-100 dark:hover:border-neutral-700 active:bg-primary-100 dark:active:bg-neutral-700 focus:ring-primary-500',

  /** Inline text link – no height, no padding, underlines on hover. */
  link: 'bg-transparent text-primary-500 dark:text-primary-400 border-0 shadow-none hover:text-primary-700 dark:hover:text-primary-300 hover:underline focus:ring-primary-500 underline-offset-2',
};

/** Standard height across all sized buttons (matches filter inputs/dropdowns). */
const BUTTON_HEIGHT = 'min-h-[2.375rem] h-[2.375rem]';

// NOTE: This project overrides spacing keys 4,8,12,16,24... to raw px values
// (e.g. px-4 = 4px not 16px). Use non-overridden keys (3,3.5,5,6,7) or
// arbitrary values for button padding to get correct results.
const SIZES = {
  xs: `gap-icon-text px-3 py-0 text-body-xs ${BUTTON_HEIGHT}`,
  sm: `gap-icon-text px-3.5 py-0 text-body-sm ${BUTTON_HEIGHT}`,
  md: `gap-icon-text px-5 py-0 text-button ${BUTTON_HEIGHT}`,
  lg: `gap-icon-text px-6 py-0 text-body-md ${BUTTON_HEIGHT}`,
  xl: `gap-icon-text px-7 py-0 text-body-lg ${BUTTON_HEIGHT}`,
  /** 28px – tight surfaces like banners and notification bars. */
  compact: 'gap-icon-text px-2.5 py-1 text-xs min-h-[28px] h-[28px]',
  /** Natural content height – dropdown menu items and similar embedded contexts. */
  auto: 'gap-icon-text px-3 py-2 text-body-sm',
  /** No padding/min-height – for dashboard list rows; parent .dashboard-list-item controls layout. */
  listRow: 'gap-icon-text p-0 min-h-0 h-auto text-left w-full',
};

/**
 * Icon-only buttons: always square, sized to match their size prop.
 * sm/md = 2.375rem (38px, aligns with filter inputs).
 * lg = 44px (WCAG 2.5.5 minimum touch target).
 */
const ICON_ONLY_SIZES = {
  compact: 'w-7 h-7 p-0 min-h-7 min-w-7',
  xs: 'w-8 h-8 p-0 min-h-8 min-w-8',
  sm: 'w-[2.375rem] h-[2.375rem] p-0 min-h-[2.375rem] min-w-[2.375rem]',
  md: 'w-[2.375rem] h-[2.375rem] p-0 min-h-[2.375rem] min-w-[2.375rem]',
  lg: 'w-11 h-11 p-0 min-h-[44px] min-w-[44px]',
  xl: 'w-12 h-12 p-0 min-h-12 min-w-12',
  auto: 'w-[2.375rem] h-[2.375rem] p-0 min-h-[2.375rem] min-w-[2.375rem]',
};

const SHAPES = {
  rounded: 'rounded-[10px]',
  pill: 'rounded-full',
  square: 'rounded-none',
};

/**
 * Disabled state: preserves variant color at 50% opacity, prevents interaction.
 * Native <button disabled> blocks hover events; span/span-role-button uses tabIndex + onClick guard.
 */
const DISABLED = 'opacity-50 cursor-not-allowed';

export const Button = forwardRef(function Button(
  {
    variant = 'primary',
    size = 'md',
    shape = 'rounded',
    isLoading = false,
    disabled = false,
    iconOnly = false,
    fullWidth = false,
    align = 'center',
    className = '',
    as,
    href,
    children,
    ...rest
  },
  ref,
) {
  const { t } = useI18n();
  const isDisabled = disabled || isLoading;
  const variantStyle = VARIANTS[variant] ?? VARIANTS.primary;

  // link variant is inline text — no fixed height or padding
  const isLink = variant === 'link';
  const sizeStyle = iconOnly
    ? (ICON_ONLY_SIZES[size] ?? ICON_ONLY_SIZES.md)
    : isLink
      ? 'gap-1 px-0 py-0 text-body-sm'
      : (SIZES[size] ?? SIZES.md);
  const isListRow = size === 'listRow';

  const shapeStyle = isLink || isListRow ? '' : (SHAPES[shape] ?? SHAPES.rounded);
  const justifyClass = align === 'start' ? 'justify-start' : 'justify-center';
  const widthClass = fullWidth ? 'w-full' : '';

  const classNames = [
    BASE,
    justifyClass,
    widthClass,
    variantStyle,
    sizeStyle,
    shapeStyle,
    isDisabled ? DISABLED : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const content = isLoading ? (
    <>
      <CompactLoader
        size='sm'
        variant={variant === 'link' || variant === 'ghost' ? 'primary' : 'white'}
        aria-label={t('common.loading')}
      />
      <span>{t('common.loading')}</span>
    </>
  ) : (
    children
  );

  const isSecondaryStyle = variant === 'secondary' || variant === 'outline';
  const fillOverlay = isSecondaryStyle && !isDisabled && (
    <span
      className='absolute left-[1px] top-[1px] bottom-[1px] w-0 group-hover:w-[calc(100%-2px)] transition-[width] duration-300 ease-out rounded-l-[9px] group-hover:rounded-[9px] bg-gradient-to-r from-[#15803d] to-[#166534] z-0'
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
        ref={ref}
        role='button'
        tabIndex={isDisabled ? -1 : 0}
        aria-disabled={isDisabled}
        aria-busy={isLoading || undefined}
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
    <button
      ref={ref}
      type={rest.type ?? 'button'}
      className={classNames}
      disabled={isDisabled}
      aria-busy={isLoading || undefined}
      {...rest}
    >
      {isSecondaryStyle && fillOverlay}
      <span className={contentSpanClass}>{content}</span>
    </button>
  );
});
