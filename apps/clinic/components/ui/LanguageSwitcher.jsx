'use client';

import { Button } from '@/components/ui/Button';
import { useI18n } from '@/contexts/I18nContext.jsx';
import { supportedLocales } from '@/lib/i18n/index.js';

// Language names shown in switcher use localeData below; for aria use common.selectLanguage
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './LanguageSwitcher.css';

// Platform languages: English, Spanish, Arabic – flag, name, code
const localeData = {
  en: { flag: '🇺🇸', name: 'English', code: 'EN' },
  es: { flag: '🇪🇸', name: 'Español', code: 'ES' },
  ar: { flag: '🇸🇦', name: 'العربية', code: 'AR' },
};

export function LanguageSwitcher({ variant = 'light', size = 'md' }) {
  const { locale, setLocale, t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef(null);
  const dropdownMenuRef = useRef(null);

  // Dark variant not required yet - always use light variant
  const isSmall = size === 'sm';

  // Ensure component is mounted (for portal)
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Calculate dropdown position when opened
  useEffect(() => {
    if (!isOpen || !dropdownRef.current) return;

    const updatePosition = () => {
      if (!dropdownRef.current) return;

      const rect = dropdownRef.current.getBoundingClientRect();
      const dropdownWidth = 220;
      const dropdownHeight = 200;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const spaceOnRight = viewportWidth - rect.right;
      const spaceOnLeft = rect.left;
      const spaceOnBottom = viewportHeight - rect.bottom;
      const spaceOnTop = rect.top;
      const padding = 16;

      // Calculate position - align to the right edge of the button
      // Ensure dropdown stays within viewport bounds
      let leftPosition = rect.right - dropdownWidth;

      // If it would go off the left edge, align to left edge instead
      if (leftPosition < padding) {
        leftPosition = rect.left;
      }

      // If it would go off the right edge, align to right edge of viewport
      if (leftPosition + dropdownWidth > viewportWidth - padding) {
        leftPosition = viewportWidth - dropdownWidth - padding;
      }

      const alignBottom =
        spaceOnBottom >= dropdownHeight + padding || spaceOnTop < dropdownHeight + padding;

      setDropdownStyle({
        position: 'fixed',
        zIndex: 10052,
        left: `${leftPosition}px`,
        right: 'auto',
        ...(alignBottom
          ? {
              top: `${rect.bottom + 12}px`,
              bottom: 'auto',
            }
          : {
              bottom: `${viewportHeight - rect.top + 12}px`,
              top: 'auto',
            }),
      });
    };

    // Initial position
    updatePosition();

    // Update on scroll/resize
    window.addEventListener('scroll', updatePosition, { passive: true });
    window.addEventListener('resize', updatePosition, { passive: true });

    return () => {
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        dropdownMenuRef.current &&
        !dropdownMenuRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  const handleLanguageChange = (newLocale) => {
    if (newLocale !== locale) {
      setLocale(newLocale);
    }
    setIsOpen(false);
  };

  const currentLocale = localeData[locale] || localeData.en;

  const buttonClasses = [
    'LanguageSwitcher-button',
    'LanguageSwitcher-button--light',
    isSmall ? 'LanguageSwitcher-button--sm' : 'LanguageSwitcher-button--md',
    isOpen ? 'is-open' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const dropdownContent =
    isOpen && mounted ? (
      <>
        {/* Backdrop */}
        <div
          className='LanguageSwitcher-backdrop'
          onClick={() => setIsOpen(false)}
          onMouseDown={(e) => e.preventDefault()}
          aria-hidden='true'
        />
        {/* Dropdown Menu */}
        <div
          className='LanguageSwitcher-dropdown LanguageSwitcher-dropdown--light'
          ref={dropdownMenuRef}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          style={dropdownStyle}
        >
          <div className='LanguageSwitcher-menu'>
            {supportedLocales.map((loc) => {
              const localeInfo = localeData[loc];
              const isActive = loc === locale;
              const itemClasses = [
                'LanguageSwitcher-item',
                'LanguageSwitcher-item--light',
                isSmall ? 'LanguageSwitcher-item--sm' : 'LanguageSwitcher-item--md',
                isActive ? 'is-active' : '',
              ]
                .filter(Boolean)
                .join(' ');

              return (
                <Button
                  key={loc}
                  type='button'
                  variant='ghost'
                  fullWidth
                  align='start'
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleLanguageChange(loc);
                  }}
                  className={itemClasses}
                >
                  <div className='LanguageSwitcher-item-flag-wrapper'>
                    <span className='LanguageSwitcher-item-flag'>{localeInfo.flag}</span>
                  </div>
                  <div className='LanguageSwitcher-item-content'>
                    <div className='LanguageSwitcher-item-name'>{localeInfo.name}</div>
                    <div className={`LanguageSwitcher-item-code ${isActive ? 'is-active' : ''}`}>
                      {localeInfo.code}
                    </div>
                  </div>
                  {isActive && (
                    <div className='LanguageSwitcher-item-check-wrapper'>
                      <svg
                        className='LanguageSwitcher-item-check'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={3}
                          d='M5 13l4 4L19 7'
                        />
                      </svg>
                    </div>
                  )}
                  <span className='LanguageSwitcher-item-glow'></span>
                </Button>
              );
            })}
          </div>
        </div>
      </>
    ) : null;

  return (
    <>
      <div className='LanguageSwitcher' ref={dropdownRef} style={{ position: 'relative' }}>
        <Button
          type='button'
          variant='ghost'
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          className={buttonClasses}
          aria-label={t('common.selectLanguage')}
          aria-expanded={isOpen}
        >
          <div className='LanguageSwitcher-button-content'>
            <div className='LanguageSwitcher-flag-wrapper'>
              <span
                className={`LanguageSwitcher-flag ${
                  isSmall ? 'LanguageSwitcher-flag--sm' : 'LanguageSwitcher-flag--md'
                }`}
              >
                {currentLocale.flag}
              </span>
            </div>
            <div className='LanguageSwitcher-icon-wrapper'>
              <svg
                className={`LanguageSwitcher-icon ${isOpen ? 'is-open' : ''}`}
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                {isOpen ? (
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2.5}
                    d='M5 15l7-7 7 7'
                  />
                ) : (
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2.5}
                    d='M19 9l-7 7-7-7'
                  />
                )}
              </svg>
            </div>
          </div>
          <span className='LanguageSwitcher-ripple'></span>
        </Button>
      </div>

      {/* Render dropdown via portal to document.body */}
      {mounted && dropdownContent && createPortal(dropdownContent, document.body)}
    </>
  );
}
