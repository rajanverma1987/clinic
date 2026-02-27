'use client';

/**
 * AI Assist Suggest – smart documentation and clinical decision support.
 * Shown only when tenant has the AI Assistance add-on. Fetches suggestions from API
 * and lets the user insert them into the current field.
 */

import { useFeatures } from '@/contexts/FeatureContext';
import { useI18n } from '@/contexts/I18nContext';
import { apiClient } from '@/lib/api/client';
import { showError } from '@/lib/utils/toast';
import { useCallback, useEffect, useState } from 'react';
import { Button } from './Button';
import { Loader } from './Loader';

const CONTEXT_LABELS = {
  soap_subjective: 'aiAssist.subjective',
  soap_objective: 'aiAssist.objective',
  soap_assessment: 'aiAssist.assessment',
  soap_plan: 'aiAssist.plan',
  diagnosis: 'aiAssist.diagnosis',
  clinical_notes: 'aiAssist.clinicalNotes',
  cds: 'aiAssist.cds',
};

export function AiAssistSuggest({
  context = 'clinical_notes',
  onInsert,
  className = '',
  size = 'sm',
  variant = 'ghost',
}) {
  const { hasAddon } = useFeatures();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [cdsHints, setCdsHints] = useState([]);

  const fetchSuggestions = useCallback(async () => {
    if (!open) {
      setOpen(true);
      setSuggestions([]);
      setCdsHints([]);
    }
    setLoading(true);
    try {
      const res = await apiClient.get(`/ai-assist/suggest?context=${encodeURIComponent(context)}`);
      if (res?.success && res?.data) {
        setSuggestions(res.data.suggestions || []);
        setCdsHints(res.data.cdsHints || []);
      }
    } catch (err) {
      showError(t('aiAssist.error') || 'Could not load suggestions');
      setSuggestions([]);
      setCdsHints([]);
    } finally {
      setLoading(false);
    }
  }, [context, open, t]);

  const handleToggle = () => {
    if (!open && suggestions.length === 0 && !loading) fetchSuggestions();
    else setOpen((prev) => !prev);
  };

  const handleSelect = (text) => {
    if (typeof onInsert === 'function') onInsert(text);
    setOpen(false);
  };

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  if (!hasAddon('aiAssist')) return null;

  return (
    <div className={`relative inline-block ${className}`}>
      <Button
        type='button'
        variant={variant}
        size={size}
        onClick={handleToggle}
        disabled={loading}
        aria-expanded={open}
        aria-haspopup='listbox'
        aria-label={t('aiAssist.suggest') || 'AI suggest'}
      >
        {loading ? (
          <Loader type='inline' size='sm' />
        ) : (
          <>
            <span className='mr-1.5' aria-hidden>
              ✨
            </span>
            {t('aiAssist.suggest') || 'Suggest'}
          </>
        )}
      </Button>
      {open && (
        <>
          <div className='fixed inset-0 z-40' aria-hidden onClick={() => setOpen(false)} />
          <div
            className='absolute left-0 top-full z-50 mt-1 min-w-[280px] max-w-md max-h-[320px] overflow-y-auto rounded-lg border border-neutral-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-800 py-2'
            role='listbox'
          >
            {suggestions.length > 0 && (
              <div className='px-2 pb-2'>
                <p className='text-xs font-medium text-neutral-500 dark:text-neutral-400 px-2 mb-1.5'>
                  {t(CONTEXT_LABELS[context]) || 'Suggestions'}
                </p>
                <ul className='space-y-0.5'>
                  {suggestions.map((text, i) => (
                    <li key={i}>
                      <button
                        type='button'
                        className='w-full text-left px-3 py-2 text-sm text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-md break-words'
                        onClick={() => handleSelect(text)}
                        role='option'
                      >
                        {text}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {cdsHints && cdsHints.length > 0 && (
              <div className='border-t border-neutral-200 dark:border-neutral-700 px-2 pt-2'>
                <p className='text-xs font-medium text-neutral-500 dark:text-neutral-400 px-2 mb-1.5'>
                  {t('aiAssist.cdsHints') || 'Clinical decision support'}
                </p>
                <ul className='space-y-0.5'>
                  {cdsHints.map((hint, i) => (
                    <li key={i}>
                      <button
                        type='button'
                        className='w-full text-left px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-md flex items-start gap-2'
                        onClick={() => handleSelect(hint)}
                        role='option'
                      >
                        <span className='text-amber-500 shrink-0'>💡</span>
                        {hint}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {!loading && suggestions.length === 0 && cdsHints.length === 0 && (
              <p className='px-3 py-4 text-sm text-neutral-500'>
                {t('aiAssist.noSuggestions') || 'No suggestions for this context.'}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
