'use client';

import React from 'react';

/**
 * Table Component - Clinic Theme
 * Follows theme specifications for tables
 */
export function Table({ children, className = '', ...props }) {
  return (
    <div className="overflow-x-auto">
      <table className={`w-full border-collapse ${className}`} {...props}>
        {children}
      </table>
    </div>
  );
}

/**
 * Table Header Component
 * Header row: bg-primary-100, text-primary-700, weight: 600, height: 48px
 */
export function TableHeader({ children, className = '', ...props }) {
  return (
    <thead className={className} {...props}>
      {children}
    </thead>
  );
}

/**
 * Table Header Row
 */
export function TableHeaderRow({ children, className = '', ...props }) {
  return (
    <tr className={`bg-primary-100 ${className}`} {...props}>
      {children}
    </tr>
  );
}

/**
 * Table Header Cell
 */
export function TableHeaderCell({ children, className = '', ...props }) {
  return (
    <th 
      className={`px-4 py-3 text-body-sm font-semibold text-primary-700 text-left h-12 ${className}`}
      {...props}
    >
      {children}
    </th>
  );
}

/**
 * Table Body Component
 */
export function TableBody({ children, className = '', ...props }) {
  return (
    <tbody className={className} {...props}>
      {children}
    </tbody>
  );
}

/**
 * Table Row
 * Height: 44-48px, border-bottom: neutral-200
 * Hover: bg-neutral-100
 * Selected: bg-primary-100, border-left: 3px solid primary-500
 */
export function TableRow({ 
  children, 
  className = '', 
  selected = false,
  onClick,
  ...props 
}) {
  const baseClasses = `h-11 border-b border-neutral-200`;
  const hoverClasses = onClick ? 'hover:bg-neutral-100 cursor-pointer' : 'hover:bg-neutral-100';
  // Selected: bg-primary-100, border-left: 3px solid primary-500 (per theme spec)
  const selectedClasses = selected 
    ? 'bg-primary-100 border-l-[3px] border-l-primary-500' 
    : '';

  return (
    <tr 
      className={`${baseClasses} ${hoverClasses} ${selectedClasses} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </tr>
  );
}

/**
 * Table Cell
 */
export function TableCell({ children, className = '', ...props }) {
  return (
    <td 
      className={`px-4 py-3 text-body-md text-neutral-900 ${className}`}
      {...props}
    >
      {children}
    </td>
  );
}

// Export default Table component
export default Table;
