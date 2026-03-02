'use client';

/**
 * Global Search Component (Ctrl+K)
 *
 * Universal search across all entities:
 * - Patients
 * - Appointments
 * - Prescriptions
 * - Invoices
 * - Doctors
 * - Medicines
 *
 * @module components/search/GlobalSearch
 * @since 1.0.0
 */

import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { apiClient } from '@/lib/api/client';
import { logger } from '@/lib/utils/logger.js';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

const SEARCH_DEBOUNCE_MS = 300;
const MIN_SEARCH_LENGTH = 2;

const RESULT_TYPES = {
  PATIENT: 'patient',
  APPOINTMENT: 'appointment',
  PRESCRIPTION: 'prescription',
  INVOICE: 'invoice',
  DOCTOR: 'doctor',
  MEDICINE: 'medicine',
  USER: 'user',
};

const RESULT_ICONS = {
  [RESULT_TYPES.PATIENT]: '👤',
  [RESULT_TYPES.APPOINTMENT]: '📅',
  [RESULT_TYPES.PRESCRIPTION]: '💊',
  [RESULT_TYPES.INVOICE]: '💰',
  [RESULT_TYPES.DOCTOR]: '👨‍⚕️',
  [RESULT_TYPES.MEDICINE]: '💉',
  [RESULT_TYPES.USER]: '👥',
};

export default function GlobalSearch({ isOpen, onClose }) {
  const { t } = useI18n();
  const { user } = useAuth();
  const router = useRouter();
  const isSuperAdmin = user?.role === 'super_admin';
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const debounceTimer = useRef(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Open search - handled by parent
        }
        return;
      }

      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && results[selectedIndex]) {
        e.preventDefault();
        handleResultClick(results[selectedIndex]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, onClose]);

  // Search function
  const performSearch = useCallback(async (searchQuery) => {
    if (searchQuery.length < MIN_SEARCH_LENGTH) {
      setResults([]);
      return;
    }

    try {
      setLoading(true);
      const response = await apiClient.get(`/search?q=${encodeURIComponent(searchQuery)}`);

      if (response.success) {
        setResults(response.data?.results || []);
        setSelectedIndex(0);
      } else {
        setResults([]);
      }
    } catch (err) {
      logger.error('Global search error', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (query.length >= MIN_SEARCH_LENGTH) {
      debounceTimer.current = setTimeout(() => {
        performSearch(query);
      }, SEARCH_DEBOUNCE_MS);
    } else {
      setResults([]);
    }

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [query, performSearch]);

  // Handle result click
  const handleResultClick = (result) => {
    let path = '';

    switch (result.type) {
      case RESULT_TYPES.PATIENT:
        path = `/patients/${result.id}`;
        break;
      case RESULT_TYPES.APPOINTMENT:
        path = `/appointments/${result.id}`;
        break;
      case RESULT_TYPES.PRESCRIPTION:
        path = `/prescriptions/${result.id}`;
        break;
      case RESULT_TYPES.INVOICE:
        path = `/invoices/${result.id}`;
        break;
      case RESULT_TYPES.DOCTOR:
        path = `/doctors/${result.id}`;
        break;
      case RESULT_TYPES.MEDICINE:
        path = `/inventory/items/${result.id}`;
        break;
      case RESULT_TYPES.USER:
        path = `/admin/users${result.subtitle ? `?search=${encodeURIComponent(result.subtitle)}` : ''}`;
        break;
      default:
        return;
    }

    if (path) {
      router.push(path);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-start justify-center pt-20 px-4'>
      {/* Backdrop */}
      <div
        className='global-search-backdrop fixed inset-0 bg-neutral-600/25 dark:bg-black/40'
        onClick={onClose}
        role='button'
        tabIndex={0}
        aria-label={t('common.close')}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClose();
          }
        }}
      />

      {/* Search Modal */}
      <Card className='global-search-panel relative z-10 w-full max-w-2xl shadow-2xl'>
        <div className='p-4'>
          {/* Search Input */}
          <div className='relative'>
            <Input
              ref={inputRef}
              type='text'
              placeholder={isSuperAdmin ? t('search.placeholderAdmin') : t('search.placeholder')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className='pr-20'
            />
            {loading && (
              <div className='absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-500 dark:text-neutral-400'>
                <Loader type='inline' text={t('common.loading')} />
              </div>
            )}
          </div>

          {/* Results */}
          {query.length >= MIN_SEARCH_LENGTH && (
            <div className='mt-4 max-h-96 overflow-y-auto'>
              {loading ? (
                <div className='flex items-center justify-center py-8'>
                  <Loader type='inline' text={t('common.loading')} />
                </div>
              ) : results.length > 0 ? (
                <div className='space-y-1'>
                  {results.map((result, index) => (
                    <div
                      key={`${result.type}-${result.id}`}
                      className={`p-3 rounded-lg cursor-pointer transition-colors duration-200 ease-out ${
                        index === selectedIndex
                          ? 'bg-primary-50 dark:bg-primary-900/40 border-2 border-primary-300 dark:border-primary-500'
                          : 'hover:bg-neutral-50 dark:hover:bg-neutral-700/50 border-2 border-transparent'
                      }`}
                      onClick={() => handleResultClick(result)}
                    >
                      <div className='flex items-center gap-3'>
                        <div className='text-2xl'>{RESULT_ICONS[result.type] || '📄'}</div>
                        <div className='flex-1 min-w-0'>
                          <div className='font-semibold text-neutral-900 dark:text-neutral-100 truncate'>
                            {result.title}
                          </div>
                          <div className='text-sm text-neutral-600 dark:text-neutral-400 truncate'>
                            {result.subtitle}
                          </div>
                          {result.meta && (
                            <div className='text-xs text-neutral-500 dark:text-neutral-400 mt-1'>
                              {result.meta}
                            </div>
                          )}
                        </div>
                        <div className='text-xs text-neutral-500 dark:text-neutral-400 capitalize'>
                          {result.type}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className='text-center py-8 text-neutral-500 dark:text-neutral-400'>
                  <p>{t('search.noResultsFor', { query })}</p>
                  <p className='text-xs mt-2'>{t('search.tryDifferentKeywords')}</p>
                </div>
              )}
            </div>
          )}

          {/* Quick Tips */}
          {query.length < MIN_SEARCH_LENGTH && (
            <div className='mt-4 text-sm text-neutral-500 dark:text-neutral-400'>
              <p className='mb-2'>{t('search.quickTips')}</p>
              <ul className='list-disc list-inside space-y-1 text-xs'>
                {isSuperAdmin ? (
                  <>
                    <li>{t('search.quickTipUsers')}</li>
                    <li>{t('search.quickTipEnter')}</li>
                  </>
                ) : (
                  <>
                    <li>{t('search.quickTipPatient')}</li>
                    <li>{t('search.quickTipAppointments')}</li>
                    <li>{t('search.quickTipMedicines')}</li>
                    <li>{t('search.quickTipEnter')}</li>
                  </>
                )}
              </ul>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
