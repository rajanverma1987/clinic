'use client';

import { Input } from '@/components/ui/Input';
import { useI18n } from '@/contexts/I18nContext';
import { getDiagnosisDisplayName } from '@/lib/i18n/inventory-name-dictionary';
import { useEffect, useRef, useState } from 'react';

/**
 * ICD-10 search/autocomplete for primary diagnosis (Phase 3.2).
 * Uses data/icd10-common.json; titles shown in locale (ar/es) via getDiagnosisDisplayName.
 */
export function ICD10SearchInput({
  value = '',
  displayValue = '',
  onChange,
  onSelect,
  placeholder,
  className = '',
  codes = [],
}) {
  const { t, locale } = useI18n();
  const localeCode = (locale || 'en').toString().slice(0, 2);
  const [query, setQuery] = useState('');
  const [filtered, setFiltered] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  function displayTextForItem(item) {
    const title = item?.title || '';
    const translatedTitle = getDiagnosisDisplayName(title, localeCode);
    return item?.code ? `${item.code} - ${translatedTitle}`.trim() : translatedTitle;
  }

  function displayTextForValue(fullValue) {
    if (!fullValue || typeof fullValue !== 'string') return fullValue || '';
    const idx = fullValue.indexOf(' - ');
    if (idx === -1) return getDiagnosisDisplayName(fullValue.trim(), localeCode);
    const code = fullValue.slice(0, idx).trim();
    const titlePart = fullValue.slice(idx + 3).trim();
    return code ? `${code} - ${getDiagnosisDisplayName(titlePart, localeCode)}` : getDiagnosisDisplayName(titlePart, localeCode);
  }

  useEffect(() => {
    if (!query.trim()) {
      setFiltered([]);
      setOpen(false);
      return;
    }
    const q = query.toLowerCase();
    const list = codes
      .filter(
        (item) =>
          (item.code && item.code.toLowerCase().includes(q)) ||
          (item.title && item.title.toLowerCase().includes(q)),
      )
      .slice(0, 12);
    setFiltered(list);
    setOpen(list.length > 0);
    setSelectedIndex(-1);
  }, [query, codes]);

  useEffect(() => {
    if (displayValue) setQuery(displayTextForValue(displayValue));
    else if (value) setQuery(displayTextForValue(value));
  }, [value, displayValue, localeCode]);

  const handleSelect = (item) => {
    const text = displayTextForItem(item);
    setQuery(text);
    onChange(item.code || text);
    onSelect && onSelect(item);
    setOpen(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e) => {
    if (!open || filtered.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => (i < filtered.length - 1 ? i + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => (i > 0 ? i - 1 : filtered.length - 1));
    } else if (e.key === 'Enter' && selectedIndex >= 0 && filtered[selectedIndex]) {
      e.preventDefault();
      handleSelect(filtered[selectedIndex]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div style={{ position: 'relative' }} className='icd10-search-wrapper'>
      <Input
        ref={inputRef}
        type='text'
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          onChange(e.target.value);
          onSelect && onSelect(null);
        }}
        onFocus={() => query.trim() && filtered.length > 0 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 220)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder ?? t('prescriptions.primaryDiagnosis')}
        className={className}
      />
      {open && filtered.length > 0 && (
        <ul
          ref={listRef}
          role='listbox'
          onMouseDown={(e) => e.preventDefault()}
          className='absolute left-0 right-0 top-full mt-1 m-0 p-0 list-none bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-600 rounded-lg shadow-lg z-[10070] max-h-60 overflow-y-auto'
        >
          {filtered.map((item, i) => (
            <li
              key={item.code || i}
              role='option'
              aria-selected={i === selectedIndex}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSelect(item);
              }}
              onClick={() => handleSelect(item)}
              className={`px-3 py-2 cursor-pointer text-sm ${
                i === selectedIndex
                  ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-900 dark:text-primary-100'
                  : 'text-neutral-800 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700'
              }`}
            >
              <span className='font-semibold text-neutral-900 dark:text-neutral-100'>{item.code}</span>
              {item.title && (
                <span className='ml-2 text-neutral-600 dark:text-neutral-400'>
                  {getDiagnosisDisplayName(item.title, localeCode)}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
