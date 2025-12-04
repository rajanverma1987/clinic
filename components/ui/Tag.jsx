'use client';

import React from 'react';

export function Tag({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  onClick,
}) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-full';
  
  const variants = {
    default: 'bg-gray-100 text-gray-700',
    primary: 'bg-blue-100 text-blue-700',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-yellow-100 text-yellow-700',
    danger: 'bg-red-100 text-red-700',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  const clickableStyles = onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : '';

  return (
    <span
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${clickableStyles} ${className}`}
      onClick={onClick}
    >
      {children}
    </span>
  );
}

