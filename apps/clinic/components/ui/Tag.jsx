'use client';

export function Tag({ children, variant = 'default', size = 'md', className = '', onClick }) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-full';

  // Variants using theme colors - Primary: Blue, Secondary: White, Success: Green (with dark mode)
  const variants = {
    default:
      'bg-neutral-100 text-neutral-700 dark:bg-neutral-600 dark:text-neutral-200',
    primary:
      'bg-primary-100 text-primary-700 dark:bg-blue-800 dark:text-blue-100',
    success:
      'bg-success-100 text-success-700 dark:bg-green-800 dark:text-green-100',
    warning:
      'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/60 dark:text-yellow-200',
    danger:
      'bg-red-100 text-status-error dark:bg-red-900/60 dark:text-red-200',
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
