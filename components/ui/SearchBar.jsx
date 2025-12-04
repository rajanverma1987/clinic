'use client';

import React, { useCallback, useRef, useEffect, memo } from 'react';

function SearchBarComponent({
  onSearch,
  showIcon = true,
  variant = 'default',
  className = '',
  onChange,
  ...props
}) {
  const inputRef = useRef(null);
  const wasFocusedRef = useRef(false);
  const selectionRef = useRef(null);
  const prevValueRef = useRef(props.value);

  // Restore focus after value change if input was focused
  useEffect(() => {
    // Only restore if value changed and input was previously focused
    if (prevValueRef.current !== props.value && wasFocusedRef.current && inputRef.current) {
      const input = inputRef.current;
      
      // If focus was lost during re-render, restore it
      if (document.activeElement !== input) {
        const timeoutId = setTimeout(() => {
          if (input && wasFocusedRef.current && document.activeElement !== input) {
            input.focus();
            // Restore cursor position
            if (selectionRef.current && input.setSelectionRange && input.value) {
              const { start, end } = selectionRef.current;
              const maxPos = input.value.length;
              const safeStart = Math.min(Math.max(0, start), maxPos);
              const safeEnd = Math.min(Math.max(0, end), maxPos);
              input.setSelectionRange(safeStart, safeEnd);
            }
          }
        }, 0);
        
        return () => clearTimeout(timeoutId);
      }
    }
    
    prevValueRef.current = props.value;
  }, [props.value]);

  const handleChange = useCallback((e) => {
    const input = e.target;
    
    // Always track if input is focused
    if (document.activeElement === inputRef.current) {
      wasFocusedRef.current = true;
    }
    
    // Save cursor position before state update
    if (input.selectionStart !== null && input.selectionEnd !== null) {
      selectionRef.current = {
        start: input.selectionStart,
        end: input.selectionEnd,
      };
    }

    // Always call onChange if provided (for controlled inputs)
    if (onChange) {
      onChange(e);
    }
    // Call onSearch for search-specific callback
    if (onSearch) {
      onSearch(e.target.value);
    }
  }, [onChange, onSearch]);

  const handleFocus = useCallback(() => {
    wasFocusedRef.current = true;
  }, []);

  const handleBlur = useCallback(() => {
    wasFocusedRef.current = false;
    selectionRef.current = null;
  }, []);

  const baseStyles = variant === 'minimal' 
    ? 'bg-transparent border-none focus:outline-none'
    : 'bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500';

  return (
    <div className={`relative flex items-center ${variant === 'default' ? 'w-full' : ''}`}>
      {showIcon && (
        <svg
          className="absolute left-3 w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      )}
      <input
        ref={inputRef}
        type="search"
        className={`
          w-full ${showIcon ? 'pl-10' : 'pl-4'} pr-4 py-2.5 
          text-gray-900 placeholder-gray-400
          ${baseStyles}
          ${className}
        `}
        {...props}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />
    </div>
  );
}

// Memoize the component to prevent unnecessary re-renders that could cause focus loss
export const SearchBar = memo(SearchBarComponent);

