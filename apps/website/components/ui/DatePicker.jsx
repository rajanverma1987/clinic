'use client';

import React from 'react';

export function DatePicker({
  label,
  error,
  showIcon = true,
  className = '',
  ...props
}) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-semibold text-gray-900 dark:text-neutral-100 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type="date"
          className={`
            form-control-height w-full px-4 py-0 border rounded-lg 
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            ${error ? 'border-red-500 bg-red-50 dark:bg-red-900/20 dark:border-red-600' : 'border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 hover:border-gray-400 dark:hover:border-neutral-500 text-neutral-900 dark:text-neutral-100'}
            ${className}
          `}
          style={{
            // Hide native calendar icon to avoid duplicate
            WebkitAppearance: 'none',
            MozAppearance: 'textfield',
          }}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}

