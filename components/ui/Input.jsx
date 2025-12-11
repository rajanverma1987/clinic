'use client';

import { useEffect, useRef } from 'react';

export function Input({ label, error, helperText, className = '', disabled, required, ...props }) {
  const inputRef = useRef(null);

  // Prevent browser default validation popup
  useEffect(() => {
    if (inputRef.current) {
      // Store required state in data attribute for custom validation
      if (required) {
        inputRef.current.setAttribute('data-required', 'true');
        inputRef.current.setAttribute('aria-required', 'true');
      }
      
      // Add validation rules based on input type
      if (props.type === 'email') {
        inputRef.current.setAttribute('data-validate', 'email');
      }
      if (props.type === 'password') {
        inputRef.current.setAttribute('data-validate', 'password');
      }
      if (props.name || props.id) {
        inputRef.current.setAttribute('data-field-name', label || props.name || props.id);
      }
    }
  }, [required, props.type, props.name, props.id, label]);

  // Base classes with theme specifications
  // Default: bg-white, border: neutral-300, radius: 8px, padding: 12px
  const baseClasses = `w-full px-3 py-3 text-body-md border rounded-lg`;

  // States following clinic theme
  // Default: bg-white, border: neutral-300, text: neutral-900, placeholder: neutral-500
  // Focus: border primary-500, shadow: 0 0 0 3px rgba(45,156,219,0.20)
  // Error: border status-error, helper text: error red
  const disabledClasses = disabled
    ? 'bg-neutral-100 border-neutral-300 text-neutral-500 cursor-not-allowed opacity-60'
    : error
    ? 'border-status-error bg-white focus:outline-none focus:ring-2 focus:ring-status-error focus:border-status-error'
    : 'border-neutral-300 bg-white text-neutral-900 placeholder:text-neutral-500 hover:border-primary-300 focus:outline-none focus:border-primary-500 focus:shadow-focus focus:ring-2 focus:ring-primary-500/20';

  return (
    <div className='w-full' data-input-wrapper>
      {label && (
        <label
          className={`block text-body-sm font-medium mb-0.5 ${
            disabled ? 'text-neutral-500' : 'text-neutral-900'
          }`}
          htmlFor={props.id}
        >
          {label}
          {required && <span className='text-status-error ml-1'>*</span>}
        </label>
      )}
      <input
        ref={inputRef}
        className={`${baseClasses} ${disabledClasses} ${className}`}
        disabled={disabled}
        onInvalid={(e) => {
          // Prevent browser default validation popup
          e.preventDefault();
          e.stopPropagation();
        }}
        {...props}
        // Remove required to prevent browser popup, we handle it via data-required
        required={false}
      />
      {error && (
        <p className='mt-0.5 text-body-sm text-status-error'>
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className='mt-0.5 text-body-sm text-neutral-500'>
          {helperText}
        </p>
      )}
    </div>
  );
}

export default Input;
