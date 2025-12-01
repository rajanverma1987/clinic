'use client';

import { useI18n } from '@/contexts/I18nContext';
import { supportedLocales, Locale } from '@/lib/i18n';

interface LanguageSwitcherProps {
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md';
}

// Map locales to flag emojis
const localeFlags: Record<Locale, string> = {
  en: '🇺🇸',
  es: '🇪🇸',
  fr: '🇫🇷',
};

const localeTooltips: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
};

export function LanguageSwitcher({ variant = 'light', size = 'md' }: LanguageSwitcherProps) {
  const { locale, setLocale } = useI18n();

  const isDark = variant === 'dark';
  const isSmall = size === 'sm';

  const flagSize = isSmall ? 'text-xl' : 'text-2xl';
  const containerClasses = `flex items-center gap-2 ${isDark ? 'bg-gray-800' : 'bg-transparent'}`;

  const handleLanguageChange = (newLocale: Locale) => {
    if (newLocale !== locale) {
      setLocale(newLocale);
    }
  };

  return (
    <div className={containerClasses}>
      {supportedLocales.map((loc) => {
        const isActive = loc === locale;
        return (
          <button
            key={loc}
            onClick={() => handleLanguageChange(loc)}
            className={`
              ${flagSize} p-1.5 rounded-lg transition-all duration-200
              ${isActive
                ? isDark
                  ? 'bg-gray-700 ring-2 ring-blue-500 scale-110'
                  : 'bg-blue-50 ring-2 ring-blue-500 scale-110'
                : isDark
                ? 'bg-transparent hover:bg-gray-700 opacity-70 hover:opacity-100'
                : 'bg-transparent hover:bg-gray-100 opacity-70 hover:opacity-100'
              }
              ${isSmall ? 'p-1' : 'p-1.5'}
            `}
            title={localeTooltips[loc]}
            aria-label={`Switch to ${localeTooltips[loc]}`}
          >
            {localeFlags[loc]}
          </button>
        );
      })}
    </div>
  );
}

