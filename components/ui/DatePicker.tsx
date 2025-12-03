'use client';

import React from 'react';

interface DatePickerProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  showIcon?: boolean;
}

export function DatePicker({
  label,
  error,
  showIcon = true,
  className = '',
  ...props
}: DatePickerProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type="date"
          className={`
            w-full px-4 py-2.5 border rounded-lg 
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors
            ${error ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white hover:border-gray-400'}
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
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}

