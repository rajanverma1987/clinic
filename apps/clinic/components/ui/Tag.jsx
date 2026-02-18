'use client';

export function Tag({ children, variant = 'default', size = 'md', className = '', onClick }) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-full';

  // Variants using theme colors - Primary: Blue, Secondary: White, Success: Green
  const variants = {
    default: 'bg-neutral-100 text-neutral-700',
    primary: 'bg-primary-100 text-primary-700', // Blue for primary actions
    success: 'bg-success-100 text-success-700', // Green for success/active states
    warning: 'bg-yellow-100 text-yellow-700', // Keep yellow for warning (not in theme but standard)
    danger: 'bg-red-100 text-status-error', // Use status-error for danger
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-body-xs',
    md: 'px-3 py-1 text-body-sm',
    lg: 'px-4 py-1.5 text-body-md',
  };

  const clickableStyles = onClick
    ? 'cursor-pointer hover:opacity-80 transition-opacity duration-200 ease-out'
    : '';

  return (
    <span
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${clickableStyles} ${className}`}
      onClick={onClick}
    >
      {children}
    </span>
  );
}
