'use client';

import { Input } from '@/components/ui/Input';
import { useI18n } from '@/contexts/I18nContext';
import { useEffect, useRef, useState } from 'react';

/**
 * ICD-10 search/autocomplete for primary diagnosis (Phase 3.2).
 * Uses data/icd10-common.json; can be extended with API later.
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
  const { t } = useI18n();
  const [query, setQuery] = useState(displayValue || value);
  const [filtered, setFiltered] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef(null);
  const listRef = useRef(null);

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
          (item.title && item.title.toLowerCase().includes(q))
      )
      .slice(0, 12);
    setFiltered(list);
    setOpen(list.length > 0);
    setSelectedIndex(-1);
  }, [query, codes]);

  useEffect(() => {
    if (displayValue) setQuery(displayValue);
    else if (value) setQuery(value);
  }, [value, displayValue]);

  const handleSelect = (item) => {
    const text = item.code ? `${item.code} - ${item.title || ''}`.trim() : item.title || '';
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
    <div style={{ position: 'relative' }}>
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
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder ?? t('prescriptions.primaryDiagnosis')}
        className={className}
      />
      {open && filtered.length > 0 && (
        <ul
          ref={listRef}
          role='listbox'
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: '100%',
            margin: 0,
            padding: 0,
            listStyle: 'none',
            background: 'var(--color-neutral-0)',
            border: '1px solid var(--color-neutral-200)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-md)',
            zIndex: 50,
            maxHeight: 240,
            overflowY: 'auto',
          }}
        >
          {filtered.map((item, i) => (
            <li
              key={item.code || i}
              role='option'
              aria-selected={i === selectedIndex}
              onClick={() => handleSelect(item)}
              style={{
                padding: 'var(--space-2) var(--space-3)',
                cursor: 'pointer',
                fontSize: 'var(--text-body-sm)',
                background: i === selectedIndex ? 'var(--color-primary-50)' : 'transparent',
                color:
                  i === selectedIndex ? 'var(--color-primary-900)' : 'var(--color-neutral-800)',
              }}
            >
              <span style={{ fontWeight: 600 }}>{item.code}</span>
              {item.title && (
                <span style={{ marginLeft: 'var(--space-2)', color: 'var(--color-neutral-600)' }}>
                  {item.title}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
