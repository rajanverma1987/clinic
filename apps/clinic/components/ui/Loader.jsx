'use client';

import { LOADER_PRESETS } from '@/lib/constants/loader-usage';

/**
 * Global Loader – clinic logo + spinning ring. Uses global CSS animations (GPU-friendly, respects prefers-reduced-motion).
 *
 * Types: page | section | inline | button
 * - page: full-screen, initial route / auth
 * - section: inline in tab/content block
 * - inline: small block in card/widget
 * - button: CompactLoader inside buttons
 *
 * @param {string} [type] - Preset: fullScreen, inline, size
 * @param {string} [text] - Message below logo; used for aria-label when present
 */
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
    xs: { spinner: 28, pulse: 44, border: 2 },
    sm: { spinner: 36, pulse: 56, border: 2 },
    md: { spinner: 44, pulse: 68, border: 3 },
    lg: { spinner: 56, pulse: 84, border: 3 },
    xl: { spinner: 68, pulse: 100, border: 4 },
  };

  const variantConfig = {
    primary: {
      main: 'var(--color-primary-500)',
      mainRgb: '30, 79, 181', // RGB for rgba() usage
      textColor: '#1a1a1a',
      textRgb: '26, 26, 26',
      pulse: 'rgba(45, 156, 219, 0.15)',
      glow: 'rgba(30, 79, 181, 0.15)',
      ringGlow: 'rgba(30, 79, 181, 0.25)',
      ringInner: 'rgba(30, 79, 181, 0.6)',
      ringRight: 'rgba(30, 79, 181, 0.5)',
    },
    secondary: {
      main: '#27AE60',
      mainRgb: '39, 174, 96',
      textColor: '#1a1a1a',
      textRgb: '26, 26, 26',
      pulse: 'rgba(39, 174, 96, 0.15)',
      glow: 'rgba(39, 174, 96, 0.15)',
      ringGlow: 'rgba(39, 174, 96, 0.25)',
      ringInner: 'rgba(39, 174, 96, 0.6)',
      ringRight: 'rgba(39, 174, 96, 0.5)',
    },
    neutral: {
      main: '#828282',
      mainRgb: '130, 130, 130',
      textColor: '#2d2d2d',
      textRgb: '45, 45, 45',
      pulse: 'rgba(130, 130, 130, 0.15)',
      glow: 'rgba(130, 130, 130, 0.15)',
      ringGlow: 'rgba(130, 130, 130, 0.25)',
      ringInner: 'rgba(130, 130, 130, 0.6)',
      ringRight: 'rgba(130, 130, 130, 0.5)',
    },
  };

  const cfg = sizeConfig[effectiveSize] ?? sizeConfig.md;
  const colors = variantConfig[variant] ?? variantConfig.primary;
  const pulsePx = `${cfg.pulse}px`;
  const ringOffset = 4;

  const spinner = (
    <div
      className='loader-root relative flex shrink-0 items-center justify-center'
      style={{ width: pulsePx, height: pulsePx }}
      aria-hidden='true'
    >
      {/* Outer glow aura - subtle background */}
      <div
        className='loader-glow-ring absolute rounded-full'
        style={{
          top: -ringOffset - 4,
          left: -ringOffset - 4,
          right: -ringOffset - 4,
          bottom: -ringOffset - 4,
          width: `calc(${pulsePx} + ${(ringOffset + 4) * 2}px)`,
          height: `calc(${pulsePx} + ${(ringOffset + 4) * 2}px)`,
          zIndex: 0,
          background: `radial-gradient(circle, rgba(${colors.mainRgb}, 0.08) 0%, transparent 65%)`,
          filter: 'blur(6px)',
          WebkitFilter: 'blur(6px)',
        }}
      />
      {/* Premium gradient background pulse */}
      <div
        className='loader-bg-pulse absolute inset-0 rounded-full'
        style={{
          background: `radial-gradient(circle at center, ${colors.pulse} 0%, rgba(${colors.mainRgb}, 0.08) 40%, transparent 75%)`,
          filter: 'blur(10px)',
          WebkitFilter: 'blur(10px)',
        }}
      />
      {/* Logo container with premium styling */}
      <div className='loader-logo-wrap absolute inset-0 flex items-center justify-center z-10'>
        <div
          className='loader-logo-container relative'
          style={{
            width: cfg.spinner,
            height: cfg.spinner,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Inner glow effect behind logo */}
          <div
            className='loader-logo-glow absolute inset-0 rounded-full'
            style={{
              background: `radial-gradient(circle, rgba(${colors.mainRgb}, 0.2) 0%, rgba(${colors.mainRgb}, 0.05) 50%, transparent 80%)`,
              filter: 'blur(6px)',
              WebkitFilter: 'blur(6px)',
              zIndex: -1,
            }}
          />
          <img
            src='/images/logoclinic.png'
            alt=''
            width={cfg.spinner}
            height={cfg.spinner}
            className='loader-logo object-contain'
            style={{
              width: cfg.spinner,
              height: 'auto',
              maxHeight: cfg.spinner,
              objectFit: 'contain',
              filter: 'drop-shadow(0 3px 10px rgba(0, 0, 0, 0.12)) drop-shadow(0 1px 3px rgba(0, 0, 0, 0.08))',
              WebkitFilter: 'drop-shadow(0 3px 10px rgba(0, 0, 0, 0.12)) drop-shadow(0 1px 3px rgba(0, 0, 0, 0.08))',
              position: 'relative',
              zIndex: 1,
            }}
          />
        </div>
      </div>
      {/* Premium spinning ring with gradient - main ring */}
      <div
        className='loader-ring absolute rounded-full'
        style={{
          top: -ringOffset,
          left: -ringOffset,
          right: -ringOffset,
          bottom: -ringOffset,
          width: `calc(${pulsePx} + ${ringOffset * 2}px)`,
          height: `calc(${pulsePx} + ${ringOffset * 2}px)`,
          zIndex: 1,
          borderWidth: `${cfg.border}px`,
          borderStyle: 'solid',
          borderColor: 'transparent',
          borderTopColor: colors.main,
          borderRightColor: `rgba(${colors.mainRgb}, 0.4)`,
          borderBottomColor: 'transparent',
          borderLeftColor: 'transparent',
          filter: `drop-shadow(0 0 8px rgba(${colors.mainRgb}, 0.3)) drop-shadow(0 0 4px rgba(${colors.mainRgb}, 0.2))`,
          WebkitFilter: `drop-shadow(0 0 8px rgba(${colors.mainRgb}, 0.3)) drop-shadow(0 0 4px rgba(${colors.mainRgb}, 0.2))`,
        }}
      />
      {/* Secondary inner ring for depth - counter-rotating */}
      <div
        className='loader-ring-inner absolute rounded-full'
        style={{
          top: -ringOffset + 3,
          left: -ringOffset + 3,
          right: -ringOffset + 3,
          bottom: -ringOffset + 3,
          width: `calc(${pulsePx} + ${(ringOffset - 3) * 2}px)`,
          height: `calc(${pulsePx} + ${(ringOffset - 3) * 2}px)`,
          zIndex: 2,
          borderWidth: '1.5px',
          borderStyle: 'solid',
          borderColor: 'transparent',
          borderTopColor: `rgba(${colors.mainRgb}, 0.5)`,
          borderRightColor: `rgba(${colors.mainRgb}, 0.3)`,
          borderBottomColor: 'transparent',
          borderLeftColor: 'transparent',
          opacity: 0.7,
        }}
      />
    </div>
  );

  if (effectiveInline) {
    const wrapperClass = `flex flex-col items-center gap-6 ${className}`.trim();
    return message ? (
      <div {...a11yProps} className={wrapperClass}>
        {spinner}
        <span
          className='loader-text-pulse text-body-md font-bold tracking-tight whitespace-nowrap'
          style={{
            color: colors.textColor,
            textShadow: `0 2px 10px rgba(${colors.textRgb}, 0.15), 0 1px 4px rgba(${colors.textRgb}, 0.2)`,
            letterSpacing: '-0.015em',
            fontWeight: 600,
            WebkitFontSmoothing: 'antialiased',
            MozOsxFontSmoothing: 'grayscale',
            textRendering: 'optimizeLegibility',
          }}
        >
          {message}
        </span>
      </div>
    ) : (
      <div className={className || undefined} {...a11yProps}>
        {spinner}
      </div>
    );
  }

  const content = message ? (
    <div
      className='flex flex-col items-center'
      style={{ gap: effectiveFullScreen ? '3rem' : '1.75rem' }}
    >
      {spinner}
      <span
        className='loader-text-pulse loader-message font-bold tracking-tight text-center max-w-md'
        style={{
          color: colors.textColor,
          fontSize: effectiveFullScreen ? '1.25rem' : 'var(--text-body-md, 16px)',
          lineHeight: effectiveFullScreen ? '1.75rem' : 'var(--text-body-md-line-height, 24px)',
          letterSpacing: '-0.015em',
          marginTop: effectiveFullScreen ? '0.5rem' : undefined,
          fontWeight: 600,
          textShadow: `0 3px 16px rgba(${colors.textRgb}, 0.15), 0 1px 6px rgba(${colors.textRgb}, 0.2), 0 0 1px rgba(${colors.textRgb}, 0.1)`,
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
          textRendering: 'optimizeLegibility',
        }}
      >
        {message}
      </span>
    </div>
  ) : (
    spinner
  );

  if (effectiveFullScreen) {
    return (
      <div
        className={`fixed inset-0 flex items-center justify-center ${className}`.trim()}
        style={{
          zIndex: 'var(--z-loader, 10070)',
          background:
            'linear-gradient(135deg, rgba(255, 255, 255, 0.99) 0%, rgba(250, 252, 255, 0.98) 30%, rgba(247, 250, 252, 0.98) 70%, rgba(245, 248, 250, 0.99) 100%)',
          backdropFilter: 'blur(20px) saturate(190%)',
          WebkitBackdropFilter: 'blur(20px) saturate(190%)',
        }}
        role='status'
        aria-busy='true'
        aria-live='polite'
        aria-label={ariaLabel ?? message ?? undefined}
      >
        {/* Premium background pattern overlay */}
        <div
          className='absolute inset-0 opacity-[0.02]'
          style={{
            backgroundImage:
              'radial-gradient(circle at 2px 2px, var(--color-primary-500) 1px, transparent 0)',
            backgroundSize: '40px 40px',
          }}
        />
        <div className='relative z-10'>{content}</div>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center ${className}`.trim()} {...a11yProps}>
      {content}
    </div>
  );
}

/**
 * Compact spinner for buttons and small spaces. CSS-only animation, respects reduced motion.
 */
export function CompactLoader({
  size = 'sm',
  className = '',
  variant = 'primary',
  'aria-label': ariaLabel = 'Loading',
}) {
  const sizeMap = { xs: 16, sm: 20, md: 24, lg: 32 };
  const variantColors = {
    primary: { color: 'var(--color-primary-500)', rgb: '30, 79, 181' },
    secondary: { color: '#27AE60', rgb: '39, 174, 96' },
    neutral: { color: '#828282', rgb: '130, 130, 130' },
    white: { color: '#ffffff', rgb: '255, 255, 255' },
  };
  const px = sizeMap[size] ?? sizeMap.sm;
  const colorConfig = variantColors[variant] ?? variantColors.primary;
  const color = colorConfig.color;
  const colorRgb = colorConfig.rgb;

  return (
    <span
      className={`loader-compact inline-flex items-center justify-center ${className}`.trim()}
      style={{ width: px, height: px }}
      role='status'
      aria-label={ariaLabel}
      aria-busy='true'
    >
      {/* Premium compact loader with glow */}
      <span
        className='loader-compact-ring block rounded-full border-2 border-solid border-transparent relative'
        style={{
          width: '100%',
          height: '100%',
          borderTopColor: color,
          borderRightColor: variant === 'white' ? color : `rgba(${colorRgb}, 0.8)`,
          borderBottomColor: 'transparent',
          borderLeftColor: 'transparent',
          filter: variant === 'white' ? 'none' : `drop-shadow(0 0 3px rgba(${colorRgb}, 0.2))`,
          WebkitFilter:
            variant === 'white' ? 'none' : `drop-shadow(0 0 3px rgba(${colorRgb}, 0.2))`,
        }}
        aria-hidden='true'
      />
      {/* Inner glow dot */}
      {variant !== 'white' && (
        <span
          className='absolute rounded-full'
          style={{
            width: '30%',
            height: '30%',
            background: `radial-gradient(circle, rgba(${colorRgb}, 0.8) 0%, transparent 70%)`,
            opacity: 0.6,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
          }}
          aria-hidden='true'
        />
      )}
    </span>
  );
}
