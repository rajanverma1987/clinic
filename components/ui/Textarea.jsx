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
        <label className="block text-body-sm font-medium text-neutral-900 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        <textarea
          className={`
            w-full px-3 py-3 border rounded-lg text-body-md
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:shadow-focus
            resize-none
            ${error 
              ? 'border-status-error bg-white focus:ring-status-error focus:border-status-error' 
              : 'border-neutral-300 bg-white text-neutral-900 placeholder:text-neutral-500 hover:border-neutral-300'
            }
            ${props.disabled ? 'bg-neutral-100 border-neutral-300 text-neutral-500 cursor-not-allowed opacity-60' : ''}
            ${className}
          `}
          maxLength={maxLength}
          {...props}
        />
        {showCount && maxLength && (
          <div className="absolute bottom-2 right-2 text-body-xs text-neutral-500">
            {currentLength}/{maxLength}
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-body-sm text-status-error">{error}</p>}
      {helperText && !error && <p className="mt-1 text-body-sm text-neutral-500">{helperText}</p>}
    </div>
  );
}

