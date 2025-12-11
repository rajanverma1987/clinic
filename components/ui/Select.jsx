'use client';

import React from 'react';

export function Select({
  label,
  error,
  helperText,
  options,
  placeholder,
  size = 'md',
  className = '',
  ...props
}) {
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-base',
    lg: 'px-5 py-3 text-lg',
  };

  return (
    <div className="w-full">
      {label && (
        <label className={`block text-body-sm font-medium mb-1 ${
          props.disabled ? 'text-neutral-500' : 'text-neutral-900'
        }`}>
          {label}
          {props.required && <span className="text-status-error ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          className={`
            w-full ${sizes[size]}
            border rounded-lg text-body-md
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:shadow-focus
            appearance-none
            bg-white bg-[url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%23828282' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")] 
            bg-[length:1.5em_1.5em] bg-[right_0.75rem_center] bg-no-repeat pr-10
            ${error 
              ? 'border-status-error bg-white focus:ring-status-error focus:border-status-error' 
              : 'border-neutral-300 hover:border-neutral-300 text-neutral-900 placeholder:text-neutral-500'
            }
            ${props.disabled ? 'opacity-50 cursor-not-allowed bg-neutral-100 text-neutral-500' : 'cursor-pointer'}
            ${className}
          `}
          {...props}
        >
          {placeholder && (
            <option value="" disabled hidden>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-1 text-body-sm text-status-error">{error}</p>}
        {helperText && !error && <p className="mt-1 text-body-sm text-neutral-500">{helperText}</p>}
      </div>
    </div>
  );
}

