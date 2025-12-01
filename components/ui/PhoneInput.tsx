'use client';

import React, { useState } from 'react';

interface PhoneInputProps {
  value?: string;
  onChange?: (value: string) => void;
  countryCode?: string;
  onCountryCodeChange?: (code: string) => void;
  label?: string;
  error?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
}

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
}: PhoneInputProps) {
  const [showDropdown, setShowDropdown] = useState(false);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const phoneValue = e.target.value.replace(/\D/g, ''); // Only digits
    if (onChange) {
      onChange(phoneValue);
    }
  };

  const handleCountryCodeChange = (code: string) => {
    if (onCountryCodeChange) {
      onCountryCodeChange(code);
    }
    setShowDropdown(false);
  };

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          {label}
        </label>
      )}
      <div className={`
        flex items-center border rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-colors
        ${error ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white hover:border-gray-400'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}>
        {/* Country Code Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => !disabled && setShowDropdown(!showDropdown)}
            disabled={disabled}
            className="flex items-center px-3 py-2.5 border-r border-gray-300 hover:bg-gray-50 rounded-l-lg transition-colors"
          >
            <span className="text-gray-700 font-medium mr-1">{countryCode}</span>
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {showDropdown && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowDropdown(false)}
              />
              <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-300 rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
                {COUNTRY_CODES.map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => handleCountryCodeChange(item.code)}
                    className={`w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors ${
                      countryCode === item.code ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                    }`}
                  >
                    <span className="font-medium">{item.code}</span>
                    <span className="ml-2 text-gray-500 text-sm">{item.country}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Phone Number Input */}
        <input
          type="tel"
          value={value}
          onChange={handlePhoneChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className="flex-1 px-4 py-2.5 border-none focus:outline-none bg-transparent text-gray-900 placeholder-gray-400"
        />
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}

