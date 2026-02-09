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
      pulse: 'rgba(45, 156, 219, 0.15)',
    },
    secondary: {
      main: '#27AE60',
      pulse: 'rgba(39, 174, 96, 0.15)',
    },
    neutral: {
      main: '#828282',
      pulse: 'rgba(130, 130, 130, 0.15)',
    },
  };

  const cfg = sizeConfig[effectiveSize] ?? sizeConfig.md;
  const colors = variantConfig[variant] ?? variantConfig.primary;
  const pulsePx = `${cfg.pulse}px`;
  const ringOffset = 4;

  const spinner = (
    <div
      className="loader-root relative flex shrink-0 items-center justify-center"
      style={{ width: pulsePx, height: pulsePx }}
      aria-hidden="true"
    >
      <div
        className="loader-bg-pulse absolute inset-0 rounded-full"
        style={{ background: colors.pulse }}
      />
      <div className="loader-logo-wrap absolute inset-0 flex items-center justify-center">
        <img
          src="/images/logoclinic.png"
          alt=""
          width={cfg.spinner}
          height={cfg.spinner}
          className="loader-logo object-contain"
          style={{
            width: cfg.spinner,
            height: 'auto',
            maxHeight: cfg.spinner,
            objectFit: 'contain',
          }}
        />
      </div>
      <div
        className="loader-ring absolute rounded-full"
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
          borderRightColor: 'transparent',
          borderBottomColor: 'transparent',
          borderLeftColor: 'transparent',
        }}
      />
    </div>
  );

  if (effectiveInline) {
    const wrapperClass = `flex flex-col items-center gap-6 ${className}`.trim();
    return message ? (
      <div {...a11yProps} className={wrapperClass}>
        {spinner}
        <span className="text-body-sm font-medium tracking-wide text-neutral-700 whitespace-nowrap">
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
      className="flex flex-col items-center"
      style={{ gap: effectiveFullScreen ? '2.5rem' : '1.5rem' }}
    >
      {spinner}
      <span
        className="loader-text-pulse loader-message font-medium tracking-wide text-neutral-700 text-center max-w-xs"
        style={{
          fontSize: effectiveFullScreen ? '1rem' : 'var(--text-body-sm, 14px)',
          lineHeight: effectiveFullScreen ? '1.5rem' : 'var(--text-body-sm-line-height, 20px)',
          letterSpacing: '0.025em',
          marginTop: effectiveFullScreen ? '0.5rem' : undefined,
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
            'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(247, 250, 252, 0.98) 100%)',
          backdropFilter: 'blur(12px)',
        }}
        role="status"
        aria-busy="true"
        aria-live="polite"
        aria-label={ariaLabel ?? message ?? undefined}
      >
        {content}
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-center ${className}`.trim()}
      {...a11yProps}
    >
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
    primary: 'var(--color-primary-500)',
    secondary: '#27AE60',
    neutral: '#828282',
    white: '#ffffff',
  };
  const px = sizeMap[size] ?? sizeMap.sm;
  const color = variantColors[variant] ?? variantColors.primary;

  return (
    <span
      className={`loader-compact inline-flex items-center justify-center ${className}`.trim()}
      style={{ width: px, height: px }}
      role="status"
      aria-label={ariaLabel}
      aria-busy="true"
    >
      <span
        className="loader-compact-ring block rounded-full border-2 border-solid border-transparent"
        style={{
          width: '100%',
          height: '100%',
          borderTopColor: color,
          borderRightColor: color,
          borderBottomColor: 'transparent',
          borderLeftColor: 'transparent',
        }}
        aria-hidden="true"
      />
    </span>
  );
}
