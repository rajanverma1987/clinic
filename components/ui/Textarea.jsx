'use client';

import React from 'react';

export function Textarea({
  label,
  error,
  helperText,
  showCount = false,
  maxLength,
  className = '',
  ...props
}) {
  const currentLength = typeof props.value === 'string' ? props.value.length : 0;

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        <textarea
          className={`
            w-full px-4 py-2.5 border rounded-lg 
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors
            resize-none
            ${error ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white hover:border-gray-400'}
            ${className}
          `}
          maxLength={maxLength}
          {...props}
        />
        {showCount && maxLength && (
          <div className="absolute bottom-2 right-2 text-xs text-gray-400">
            {currentLength}/{maxLength}
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      {helperText && !error && <p className="mt-1 text-sm text-gray-500">{helperText}</p>}
    </div>
  );
}

