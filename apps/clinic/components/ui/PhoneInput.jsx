'use client';

import { Button } from '@/components/ui/Button';
import { useState } from 'react';

const COUNTRY_CODES = [
  { code: '+1', country: 'US' },
  { code: '+44', country: 'UK' },
  { code: '+91', country: 'IN' },
  { code: '+86', country: 'CN' },
  { code: '+61', country: 'AU' },
  { code: '+33', country: 'FR' },
  { code: '+49', country: 'DE' },
  { code: '+81', country: 'JP' },
  { code: '+82', country: 'KR' },
  { code: '+971', country: 'AE' },
];

export function PhoneInput({
  value = '',
  onChange,
  countryCode = '+1',
  onCountryCodeChange,
  label,
  error,
  placeholder = '00000 00000',
  className = '',
  disabled = false,
  required = false,
}) {
  const [showDropdown, setShowDropdown] = useState(false);

  const handlePhoneChange = (e) => {
    const phoneValue = e.target.value.replace(/\D/g, ''); // Only digits
    if (onChange) {
      onChange(phoneValue);
    }
  };

  const handleCountryCodeChange = (code) => {
    if (onCountryCodeChange) {
      onCountryCodeChange(code);
    }
    setShowDropdown(false);
  };

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className='block text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-2'>
          {label}
        </label>
      )}
      <div
        className={`
        flex items-center border rounded-lg transition-[border-color,box-shadow] duration-200 ease-out focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-primary-500
        ${error ? 'border-status-error bg-red-50 dark:bg-status-error/10' : 'border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-500'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
      >
        {/* Country Code Dropdown */}
        <div className='relative'>
          <Button
            type='button'
            variant='ghost'
            size='sm'
            onClick={() => !disabled && setShowDropdown(!showDropdown)}
            disabled={disabled}
            aria-expanded={showDropdown}
            aria-haspopup='listbox'
            className='flex items-center px-3 py-2.5 border-r border-neutral-300 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 rounded-l-lg min-w-0 rounded-r-none text-neutral-700 dark:text-neutral-200'
          >
            <span className='font-medium mr-1'>{countryCode}</span>
            <svg
              className={`icon icon-xs text-neutral-400 dark:text-neutral-500 ${showDropdown ? 'rotate-180' : ''}`}
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M19 9l-7 7-7-7'
              />
            </svg>
          </Button>

          {/* Dropdown Menu */}
          {showDropdown && (
            <>
              <div
                className='fixed inset-0'
                style={{ zIndex: 10055 }}
                onClick={() => setShowDropdown(false)}
              />
              <div
                className='absolute top-full left-0 mt-1 w-48 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-600 rounded-lg shadow-lg max-h-60 overflow-y-auto'
                style={{ zIndex: 10060 }}
              >
                {COUNTRY_CODES.map((item) => (
                  <Button
                    key={item.code}
                    type='button'
                    variant='ghost'
                    fullWidth
                    align='start'
                    onClick={() => handleCountryCodeChange(item.code)}
                    className={`px-4 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-700 ${
                      countryCode === item.code
                        ? 'bg-primary-50 dark:bg-primary-900/40 text-primary-600 dark:text-primary-200'
                        : 'text-neutral-700 dark:text-neutral-200'
                    }`}
                  >
                    <span className='font-medium'>{item.code}</span>
                    <span className='ml-2 text-neutral-500 dark:text-neutral-400 text-sm'>{item.country}</span>
                  </Button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Phone Number Input */}
        <input
          type='tel'
          value={value}
          onChange={handlePhoneChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className='flex-1 px-4 py-2.5 border-none focus:outline-none bg-transparent text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 min-w-0'
        />
      </div>
      {error && <p className='mt-1 text-sm text-status-error'>{error}</p>}
    </div>
  );
}
