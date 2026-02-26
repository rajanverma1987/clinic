'use client';

import { Button } from '@/components/ui/Button';
import { useI18n } from '@/contexts/I18nContext';
import { showSuccess } from '@/lib/utils/toast';
import { useCallback, useState } from 'react';

/**
 * Subscribe strip. Place above footer on home page.
 * No backend: shows success toast on submit; can later wire to API or mailchimp.
 */
export function SubscribeStrip() {
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      const trimmed = (email || '').trim();
      if (!trimmed) return;
      setSubmitting(true);
      showSuccess(t('subscribe.success'));
      setEmail('');
      setSubmitting(false);
    },
    [email, t],
  );

  return (
    <section
      className='border-t border-neutral-200 bg-neutral-50 py-14 px-4 sm:px-6'
      aria-labelledby='subscribe-heading'
    >
      <div className='max-w-xl mx-auto text-center'>
        <h2
          id='subscribe-heading'
          className='text-neutral-900 font-semibold text-base sm:text-lg mb-5'
        >
          {t('subscribe.title')}
        </h2>
        <form
          onSubmit={handleSubmit}
          className='flex flex-col sm:flex-row gap-3 sm:gap-0 items-stretch max-w-md mx-auto'
        >
          <input
            type='email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('subscribe.placeholder')}
            disabled={submitting}
            aria-label={t('subscribe.placeholder')}
            className='flex-1 min-w-0 min-h-[48px] h-[48px] sm:rounded-l-full sm:rounded-r-none rounded-lg px-5 border border-neutral-300 sm:border-r-0 bg-white text-neutral-900 placeholder:text-neutral-400 text-base leading-none box-border focus:outline-none focus:ring-2 focus:ring-primary-500/25 focus:border-primary-500 disabled:opacity-60 disabled:cursor-not-allowed'
          />
          <Button
            type='submit'
            variant='primary'
            disabled={submitting}
            className='min-h-[48px] h-[48px] sm:rounded-l-none sm:rounded-r-full rounded-lg px-8 shrink-0 font-semibold w-full sm:w-auto border-0'
          >
            {t('subscribe.button')}
          </Button>
        </form>
      </div>
    </section>
  );
}
