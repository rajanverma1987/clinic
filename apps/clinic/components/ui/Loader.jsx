'use client';

import { LOADER_PRESETS } from '@/lib/constants/loader-usage';
import './loader.css';

export function Loader({
  type,
  size = 'md',
  text,
  fullScreen = false,
  className = '',
  variant = 'primary',
  inline = false,
  'aria-label': ariaLabel,
}) {
  const preset =
    type && LOADER_PRESETS[type] && !LOADER_PRESETS[type].useSkeleton ? LOADER_PRESETS[type] : null;

  const effectiveFullScreen = preset ? preset.fullScreen : fullScreen;
  const effectiveInline = preset ? preset.inline : inline;
  const effectiveSize = preset ? preset.size : size;

  if (preset?.useCardLoader) {
    return (
      <CardLoader
        size={effectiveSize}
        className={className}
        variant={variant}
        aria-label={ariaLabel ?? text ?? 'Loading'}
      />
    );
  }

  if (preset?.useCompact) {
    return (
      <CompactLoader
        size={effectiveSize}
        className={className}
        variant={variant}
        aria-label={ariaLabel ?? text ?? 'Loading'}
      />
    );
  }

  const message = text ?? null;
  const a11yProps = {
    role: 'status',
    'aria-busy': true,
    'aria-live': 'polite',
    'aria-label': ariaLabel ?? message ?? undefined,
  };

  const sizeConfig = {
    xs: { spinner: 36 },
    sm: { spinner: 48 },
    md: { spinner: 60 },
    lg: { spinner: 78 },
    xl: { spinner: 92 },
  };

  const variantConfig = {
    primary: {
      main: '#1e4fb5',
      mainRgb: '30, 79, 181',
    },
    secondary: {
      main: '#27AE60',
      mainRgb: '39, 174, 96',
    },
    neutral: {
      main: '#828282',
      mainRgb: '130, 130, 130',
    },
  };

  const cfg = sizeConfig[effectiveSize] ?? sizeConfig.md;
  const colors = variantConfig[variant] ?? variantConfig.primary;
  const width = Math.round(cfg.spinner * 1.5 * 1.25); /* logo and bar share same width; sizeConfig sets base size */

  const spinner = (
    <div className='loader-root flex shrink-0 flex-col items-center gap-3' aria-hidden='true'>
      {/* Logo — stable, no animation; white in dark theme via .loader-logo-img */}
      <div className='flex items-center justify-center'>
        <img
          src='/images/logoclinic.png'
          alt=''
          width={width}
          height={width}
          className='loader-logo-img object-contain'
        />
      </div>

      {/* Loading bar — single inner bar sweeps inside one track */}
      <div
        className='loader-bar loader-bar-track rounded-md overflow-hidden border'
        style={{
          width: width,
          height: 8,
          borderColor: colors.main,
        }}
      >
        <div
          className='loader-bar-fill'
          style={{
            '--color-rgb': colors.mainRgb,
            '--color-main': colors.main,
          }}
        />
      </div>
    </div>
  );

  if (effectiveInline) {
    return (
      <div {...a11yProps} className={className}>
        {spinner}
      </div>
    );
  }

  if (effectiveFullScreen) {
    return (
      <div
        className={`loader-fullscreen fixed inset-0 flex items-center justify-center ${className}`}
        style={{ zIndex: 10070 }}
        {...a11yProps}
      >
        <div
          className='absolute inset-0 opacity-[0.015]'
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, ${colors.main} 1px, transparent 0)`,
            backgroundSize: '40px 40px',
          }}
        />
        <div className='relative z-10'>{spinner}</div>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center ${className}`} {...a11yProps}>
      {spinner}
    </div>
  );
}

/**
 * Card loader – progress bar only (same as below brand logo), no logo.
 * For small contexts: cards, widgets, list items. Brand loader stays for page/section.
 */
export function CardLoader({
  size = 'sm',
  className = '',
  variant = 'primary',
  'aria-label': ariaLabel = 'Loading',
}) {
  const variantConfig = {
    primary: { main: '#1e4fb5', mainRgb: '30, 79, 181' },
    secondary: { main: '#27AE60', mainRgb: '39, 174, 96' },
    neutral: { main: '#828282', mainRgb: '130, 130, 130' },
  };
  const sizeConfig = { xs: 28, sm: 36, md: 44, lg: 56 };
  const spinner = sizeConfig[size] ?? sizeConfig.sm;
  const width = Math.round(spinner * 1.5 * 1.25);
  const colors = variantConfig[variant] ?? variantConfig.primary;

  return (
    <div
      className={`flex items-center justify-center py-6 ${className}`}
      role='status'
      aria-label={ariaLabel}
      aria-busy='true'
    >
      <div
        className='loader-bar loader-bar-track rounded-md overflow-hidden border'
        style={{
          width,
          height: 8,
          borderColor: colors.main,
        }}
      >
        <div
          className='loader-bar-fill'
          style={{
            '--color-rgb': colors.mainRgb,
            '--color-main': colors.main,
          }}
        />
      </div>
    </div>
  );
}

export function CompactLoader({
  size = 'sm',
  className = '',
  variant = 'primary',
  'aria-label': ariaLabel = 'Loading',
}) {
  const sizeMap = { xs: 16, sm: 20, md: 24, lg: 32 };
  const variantColors = {
    primary: { color: '#1e4fb5', rgb: '30, 79, 181' },
    secondary: { color: '#27AE60', rgb: '39, 174, 96' },
    neutral: { color: '#828282', rgb: '130, 130, 130' },
    white: { color: '#ffffff', rgb: '255, 255, 255' },
  };

  const px = sizeMap[size] ?? sizeMap.sm;
  const colorConfig = variantColors[variant] ?? variantColors.primary;

  return (
    <span
      className={`inline-flex items-center justify-center relative ${className}`}
      style={{ width: px, height: px }}
      role='status'
      aria-label={ariaLabel}
      aria-busy='true'
    >
      <span
        className='block rounded-full border-2'
        style={{
          width: '100%',
          height: '100%',
          borderColor: 'transparent',
          borderTopColor: colorConfig.color,
          borderRightColor:
            variant === 'white' ? colorConfig.color : `rgba(${colorConfig.rgb}, 0.8)`,
          filter:
            variant === 'white' ? 'none' : `drop-shadow(0 0 3px rgba(${colorConfig.rgb}, 0.2))`,
          animation: 'spin 1s linear infinite',
        }}
      />
      {variant !== 'white' && (
        <span
          className='absolute rounded-full'
          style={{
            width: '30%',
            height: '30%',
            background: `radial-gradient(circle, rgba(${colorConfig.rgb}, 0.8) 0%, transparent 70%)`,
            opacity: 0.6,
          }}
        />
      )}
    </span>
  );
}
