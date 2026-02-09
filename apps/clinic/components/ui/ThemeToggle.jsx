'use client';

import { useI18n } from '@/contexts/I18nContext.jsx';
import { useTheme } from '@/contexts/ThemeContext';

/**
 * Theme toggle button – switches between light and dark dashboard theme.
 * Renders sun icon in dark mode (click to go light), moon icon in light mode (click to go dark).
 */
export function ThemeToggle({ className = '', size = 'md', ariaLabel }) {
  const { t } = useI18n();
  const { theme, toggleTheme, mounted } = useTheme();
  const isDark = theme === 'dark';
  const iconClass = size === 'sm' ? 'w-5 h-5' : 'w-6 h-6';
  const defaultAriaLabel = isDark ? t('theme.switchToLight') : t('theme.switchToDark');

  // Always render the same <button> so server and client DOM match (avoids hydration mismatch).
  return (
    <button
      type='button'
      disabled={!mounted}
      onClick={mounted ? toggleTheme : undefined}
      className={`inline-flex items-center justify-center rounded-lg text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:text-neutral-100 dark:hover:bg-neutral-700 transition-colors disabled:pointer-events-none ${iconClass} ${className}`}
      aria-label={ariaLabel ?? defaultAriaLabel}
    >
      {isDark ? (
        <svg
          className={iconClass}
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
          aria-hidden
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z'
          />
        </svg>
      ) : (
        <svg
          className={iconClass}
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
          aria-hidden
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z'
          />
        </svg>
      )}
    </button>
  );
}
