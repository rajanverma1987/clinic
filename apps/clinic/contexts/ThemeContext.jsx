'use client';

/**
 * Theme Context – light/dark dashboard theme with localStorage persistence.
 * Respects system preference (prefers-color-scheme) when no stored choice.
 * Toggles class "dark" on document.documentElement for Tailwind dark: variants.
 */

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

const THEME_STORAGE_KEY = 'clinic-dashboard-theme';

const ThemeContext = createContext(undefined);

function readStoredTheme() {
  if (typeof window === 'undefined') return 'light';
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') return stored;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  } catch (_) {}
  return 'light';
}

function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
    root.style.colorScheme = 'dark';
  } else {
    root.classList.remove('dark');
    root.style.colorScheme = 'light';
  }
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = readStoredTheme();
    setThemeState(stored);
    applyTheme(stored);
    setMounted(true);

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      try {
        if (localStorage.getItem(THEME_STORAGE_KEY) != null) return;
        const next = media.matches ? 'dark' : 'light';
        setThemeState(next);
        applyTheme(next);
      } catch (_) {}
    };
    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, []);

  const setTheme = useCallback((next) => {
    const value = next === 'dark' ? 'dark' : 'light';
    setThemeState(value);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, value);
    } catch (_) {}
    applyTheme(value);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  const value = {
    theme,
    setTheme,
    toggleTheme,
    isDark: theme === 'dark',
    mounted,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (ctx === undefined) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
