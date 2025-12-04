'use client';

import React from 'react';

export function Input({ label, error, helperText, className = '', disabled, ...props }) {
  const baseClasses = `w-full px-4 py-2.5 text-base border rounded-lg transition-colors`;
  
  const disabledClasses = disabled
    ? 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed opacity-60'
    : error
    ? 'border-red-500 bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500'
    : 'border-gray-300 bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500';

  return (
    <div className="w-full">
      {label && (
        <label className={`block text-sm font-medium mb-1 ${
          disabled ? 'text-gray-500' : 'text-gray-700'
        }`}>{label}</label>
      )}
      <input
        className={`${baseClasses} ${disabledClasses} ${className}`}
        disabled={disabled}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      {helperText && !error && <p className="mt-1 text-sm text-gray-500">{helperText}</p>}
    </div>
  );
}

