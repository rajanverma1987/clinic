'use client';

import { useI18n } from '@/contexts/I18nContext';
import { CompactLoader } from './Loader';

/**
 * Platform Button – single source for all actions.
 *
 * Variants:
 *   primary / success  – green #15803d default, 1px white border + 0.5px green ring; hover/active → blue
 *   secondary / outline – blue default, 1px white border + 0.5px blue ring, fill effect to green on hover
 *   danger / destructive / logout – red fill
 *   warning – amber fill
 *   ghost / tertiary – transparent, hover bg
 *   link – text link
 *
 * Sizes: xs, sm, md, lg, xl. Shape: rounded, pill, square.
 * Props: variant, size, shape, isLoading, disabled, iconOnly, className, children, ...rest
 */

const BASE =
  'inline-flex items-center justify-center gap-icon-text font-medium whitespace-nowrap transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none flex-shrink-0 self-center [&_svg]:shrink-0 [&_svg]:text-current [&_svg]:stroke-current [&_svg]:fill-current group relative overflow-hidden';

const VARIANTS = {
  primary:
    'bg-[#15803d] text-white border border-white shadow-[0_0_0_0.5px_#15803d] hover:bg-primary-500 hover:shadow-[0_0_0_0.5px_#3b82f6] active:bg-primary-600 focus:ring-primary-500 focus:ring-offset-0 transition-all duration-200',
  success:
    'bg-[#15803d] text-white border border-white shadow-[0_0_0_0.5px_#15803d] hover:bg-primary-500 hover:shadow-[0_0_0_0.5px_#3b82f6] active:bg-primary-600 focus:ring-primary-500 focus:ring-offset-0 transition-all duration-200',
  secondary:
    'bg-primary-500 text-white border border-white shadow-[0_0_0_0.5px_#3b82f6] focus:ring-primary-500',
  outline:
    'bg-primary-500 text-white border border-white shadow-[0_0_0_0.5px_#3b82f6] focus:ring-primary-500',
  danger:
    'bg-status-error text-white border border-status-error hover:bg-red-600 hover:border-red-600 active:bg-red-700 focus:ring-status-error shadow-sm',
  destructive:
    'bg-status-error text-white border border-status-error hover:bg-red-600 hover:border-red-600 active:bg-red-700 focus:ring-status-error shadow-sm',
  logout:
    'bg-status-error text-white border border-status-error hover:bg-red-600 hover:border-red-600 active:bg-red-700 focus:ring-status-error shadow-sm',
  warning:
    'bg-status-warning text-white border border-status-warning hover:bg-amber-500 hover:border-amber-500 active:bg-amber-600 focus:ring-status-warning shadow-sm',
  ghost:
    'bg-transparent text-primary-600 border border-transparent hover:bg-primary-50 hover:border-primary-100 active:bg-primary-100 focus:ring-primary-500',
  tertiary:
    'bg-transparent text-primary-600 border border-transparent hover:bg-primary-50 hover:border-primary-100 active:bg-primary-100 focus:ring-primary-500',
  link: 'bg-transparent text-primary-500 border-0 shadow-none hover:text-primary-700 hover:underline focus:ring-primary-500 underline-offset-2',
};

const SIZES = {
  xs: 'px-3 py-1.5 text-body-xs min-h-[32px]',
  sm: 'px-4 py-2.5 text-body-sm min-h-[38px]',
  md: 'px-5 py-3 text-button min-h-[44px]',
  lg: 'px-6 py-3.5 text-body-md min-h-[52px]',
  xl: 'px-8 py-4 text-body-lg min-h-[60px]',
};

const ICON_ONLY_SIZES = {
  xs: 'w-8 h-8 p-0 min-h-[32px]',
  sm: 'w-10 h-10 p-0 min-h-[38px]',
  md: 'w-12 h-12 p-0 min-h-[44px]',
  lg: 'w-14 h-14 p-0 min-h-[52px]',
  xl: 'w-16 h-16 p-0 min-h-[60px]',
};

const SHAPES = {
  rounded: 'rounded-[10px]',
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
  const sizeStyle = iconOnly
    ? ICON_ONLY_SIZES[size] ?? ICON_ONLY_SIZES.md
    : SIZES[size] ?? SIZES.md;
  const shapeStyle =
    iconOnly && shape === 'rounded' ? SHAPES.rounded : SHAPES[shape] ?? SHAPES.rounded;
  const pillShape = iconOnly && shape === 'pill' ? SHAPES.pill : shapeStyle;
  const isSecondaryStyle = variant === 'secondary' || variant === 'outline';
  const iconOnlyPill = iconOnly && shape === 'pill';
  const classNames = `${BASE} ${variantStyle} ${sizeStyle} ${pillShape} ${
    iconOnlyPill ? 'aspect-square' : ''
  } ${isDisabled ? DISABLED : ''} ${className}`.trim();
  const content = isLoading ? (
    <>
      <CompactLoader
        size='sm'
        variant={
          variant === 'link' || variant === 'ghost' || variant === 'tertiary' ? 'primary' : 'white'
        }
      />
      <span>{t('common.loading')}</span>
    </>
  ) : (
    children
  );

  const fillOverlay = isSecondaryStyle && !isDisabled && (
    <span
      className='absolute left-[1px] top-[1px] bottom-[1px] w-0 group-hover:w-[calc(100%-2px)] transition-[width] duration-300 ease-out rounded-l-[9px] group-hover:rounded-[9px] bg-gradient-to-r from-[#15803d] to-[#166534] z-0'
      aria-hidden
    />
  );

  const contentSpanClass =
    (isSecondaryStyle ? 'relative z-10 ' : '') +
    'inline-flex items-center justify-center gap-[var(--icon-text-gap)]';

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
