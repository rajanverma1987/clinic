'use client';

/**
 * Top free-trial strip (Dochours-style). Dismissible via localStorage.
 * Shown only when user is not authenticated.
 */
import { Button } from '@/components/ui/Button';
import { useI18n } from '@/contexts/I18nContext';
import { CLINIC_APP_URL } from '@/lib/config';
import { XIcon } from '@/components/icons';
import { useCallback, useEffect, useState } from 'react';

const BANNER_DISMISS_KEY = 'website_free_trial_banner_dismissed';

export function FreeTrialBanner({ onVisibilityChange }) {
  const { t } = useI18n();
  const [visible, setVisible] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || typeof onVisibilityChange !== 'function') return;
    try {
      const dismissed = localStorage.getItem(BANNER_DISMISS_KEY);
      const show = !dismissed;
      setVisible(show);
      onVisibilityChange(show);
    } catch {
      setVisible(true);
      onVisibilityChange(true);
    }
  }, [mounted, onVisibilityChange]);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(BANNER_DISMISS_KEY, '1');
    } catch {}
    setVisible(false);
    if (typeof onVisibilityChange === 'function') onVisibilityChange(false);
  }, [onVisibilityChange]);

  const registerUrl = `${CLINIC_APP_URL.replace(/\/$/, '')}/register`;

  if (!visible) return null;

  return (
    <div
      className="relative z-[9998] flex items-center justify-center gap-4 bg-primary-600 text-white py-2.5 px-4"
      role="banner"
      aria-label={t('homepage.bannerFreeTrial')}
    >
      <p className="text-center text-sm font-medium flex-1 min-w-0">
        {t('homepage.bannerFreeTrial')}
      </p>
      <a
        href={registerUrl}
        className="shrink-0 inline-flex items-center rounded-lg bg-white text-primary-700 font-semibold px-4 py-1.5 text-sm hover:bg-primary-50 transition-colors"
      >
        {t('homepage.bannerCta')}
      </a>
      <button
        type="button"
        onClick={dismiss}
        className="shrink-0 p-1 rounded hover:bg-white/20 transition-colors"
        aria-label="Dismiss banner"
      >
        <XIcon className="icon icon-sm" aria-hidden />
      </button>
    </div>
  );
}
