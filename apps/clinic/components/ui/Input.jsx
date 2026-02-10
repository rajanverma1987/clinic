'use client';

import { useEffect, useRef } from 'react';

/** size: sm 32px, md 40px (default), lg 48px – matches globals.css --input-height-* */
/** variant: 'default' | 'borderless' - Use 'borderless' when input is inside a container with its own border */
export function Input({
  label,
  error,
  helperText,
  size = 'md',
  variant = 'default',
  className = '',
  disabled,
  required,
  ...props
}) {
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

  const sizeClass =
    size === 'sm' ? 'form-control-sm' : size === 'lg' ? 'form-control-lg' : 'form-control-md';

  // Borderless variant: no border, no focus ring, transparent bg (for use inside containers)
  const isBorderless = variant === 'borderless';
  const borderClasses = isBorderless
    ? 'border-0 outline-0 focus:outline-none focus:ring-0 bg-transparent'
    : 'border rounded-[10px]';

  const baseClasses = `w-full form-control-height ${sizeClass} px-4 py-0 text-body-md ${borderClasses}`;

  // States following clinic theme
  // Default: bg-white, border: neutral-300, text: neutral-900, placeholder: neutral-500
  // Focus: border primary-500, shadow: 0 0 0 3px rgba(45,156,219,0.20)
  // Error: border status-error, helper text: error red
  // Borderless: no border styles, transparent background
  const disabledClasses = disabled
    ? isBorderless
      ? 'text-neutral-500 dark:text-neutral-400 cursor-not-allowed opacity-60'
      : 'bg-neutral-100 dark:bg-neutral-700 border-neutral-300 dark:border-neutral-600 text-neutral-500 dark:text-neutral-400 cursor-not-allowed opacity-60'
    : error
      ? isBorderless
        ? 'text-neutral-900 dark:text-neutral-100'
        : 'border-status-error bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-status-error focus:border-status-error'
      : isBorderless
        ? 'text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-500 dark:placeholder:text-neutral-400'
        : 'border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-500 dark:placeholder:text-neutral-400 hover:border-primary-300 dark:hover:border-primary-500 focus:outline-none focus:border-primary-500 focus:shadow-focus focus:ring-2 focus:ring-primary-500/20';

  return (
    <div className='w-full' data-input-wrapper>
      {label && (
        <label
          className={`block text-body-sm font-medium mb-0.5 ${
            disabled
              ? 'text-neutral-500 dark:text-neutral-400'
              : 'text-neutral-900 dark:text-neutral-100'
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
      {error && <p className='mt-0.5 text-body-sm text-status-error'>{error}</p>}
      {helperText && !error && <p className='mt-0.5 text-body-sm text-neutral-500'>{helperText}</p>}
    </div>
  );
}

export default Input;
