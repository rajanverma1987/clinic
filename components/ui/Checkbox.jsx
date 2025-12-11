'use client';

import { forwardRef } from 'react';
import './Checkbox.css';

export const Checkbox = forwardRef(
  ({ id, name, checked, onChange, disabled, className = '', size = 'md', ...props }, ref) => {
    return (
      <label
        className={`checkbox-container size-${size} ${disabled ? 'disabled' : ''} ${className}`}
      >
        <input
          ref={ref}
          type='checkbox'
          id={id}
          name={name}
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          {...props}
        />
        <div className='checkmark'>
          <svg
            className='checkmark-icon'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
            style={{ color: '#FFFFFF' }}
          >
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={3} d='M5 13l4 4L19 7' />
          </svg>
        </div>
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';
