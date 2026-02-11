'use client';

import { LOADER_PRESETS } from '@/lib/constants/loader-usage';

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

  if (preset?.useCompact) {
    return (
      <CompactLoader
        size={effectiveSize}
        className={className}
        variant={variant}
        aria-label={ariaLabel}
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
    xs: { spinner: 28 },
    sm: { spinner: 36 },
    md: { spinner: 44 },
    lg: { spinner: 56 },
    xl: { spinner: 68 },
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
  const width = Math.round(cfg.spinner * 1.5);

  const spinner = (
    <div className='loader-root flex shrink-0 flex-col items-center gap-3' aria-hidden='true'>
      {/* Logo */}
      <div className='flex items-center justify-center'>
        <img
          src='/images/logoclinic.png'
          alt=''
          width={width}
          height={width}
          className='object-contain'
          style={{
            filter: 'drop-shadow(0 3px 10px rgba(0, 0, 0, 0.12))',
          }}
        />
      </div>

      {/* Loading bar */}
      <div
        className='loader-bar rounded-md p-0.5'
        style={{
          width: width,
          background: '#cecece',
          border: `1px solid ${colors.main}`,
          boxShadow: `0 0 20px rgba(${colors.mainRgb}, 0.5)`,
        }}
      >
        <div className='loader-bar-track'>
          {Array.from({ length: 12 }).map((_, i) => (
            <span
              key={i}
              className='loader-bar-segment'
              style={{
                '--segment-delay': `${i * 0.15}s`,
                '--color-rgb': colors.mainRgb,
                '--color-main': colors.main,
              }}
            />
          ))}
        </div>
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
        className={`fixed inset-0 flex items-center justify-center ${className}`}
        style={{
          zIndex: 10070,
          background:
            'linear-gradient(135deg, rgba(255,255,255,0.99) 0%, rgba(247,250,252,0.98) 100%)',
          backdropFilter: 'blur(20px)',
        }}
        {...a11yProps}
      >
        <div
          className='absolute inset-0 opacity-[0.02]'
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
