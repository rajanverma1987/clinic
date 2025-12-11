'use client';

import { forwardRef, useEffect, useRef } from 'react';

export const Toggle = forwardRef(
  (
    { id, name, checked, onChange, disabled = false, className = '', label, description, ...props },
    ref
  ) => {
    const inputRef = useRef(null);
    const toggleId = id || `toggle-${name || Math.random().toString(36).substr(2, 9)}`;

    // Merge refs
    useEffect(() => {
      if (typeof ref === 'function') {
        ref(inputRef.current);
      } else if (ref) {
        ref.current = inputRef.current;
      }
    }, [ref]);

    const handleLabelClick = (e) => {
      if (disabled) {
        e.preventDefault();
        return;
      }
      // If clicking directly on the input, let it handle naturally
      if (e.target.tagName === 'INPUT') {
        return;
      }
      // Otherwise, programmatically trigger the input
      if (inputRef.current && !inputRef.current.disabled) {
        e.preventDefault();
        inputRef.current.click();
      }
    };

    return (
      <label
        htmlFor={toggleId}
        onClick={handleLabelClick}
        className={`relative inline-flex items-center ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        } ${className}`}
      >
        <input
          ref={inputRef}
          type='checkbox'
          id={toggleId}
          name={name}
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className='sr-only'
          {...props}
        />
        <div
          className={`relative w-11 h-6 rounded-full transition-all duration-200 ${
            checked ? 'bg-secondary-500' : 'bg-status-error'
          } ${
            disabled
              ? ''
              : 'focus-within:ring-4 focus-within:ring-primary-300 focus-within:outline-none'
          }`}
        >
          <div
            className={`absolute top-[2px] left-[2px] h-5 w-5 rounded-full border-2 border-white transition-all duration-200 ${
              checked ? 'translate-x-5 bg-secondary-700' : 'translate-x-0 bg-status-error'
            }`}
          ></div>
        </div>
        {label && (
          <span
            className='ml-3 text-neutral-700 font-medium'
            style={{ fontSize: '14px', lineHeight: '20px' }}
          >
            {label}
          </span>
        )}
      </label>
    );
  }
);

Toggle.displayName = 'Toggle';
