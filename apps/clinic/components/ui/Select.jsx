'use client';

/**
 * @param {'full'|'fit'} [width='full'] - 'fit': content-fit width with standard padding (for filter/toolbar dropdowns). 'full': full width (default for forms).
 */
export function Select({
  label,
  error,
  helperText,
  options,
  placeholder,
  size = 'md',
  width = 'full',
  className = '',
  ...props
}) {
  const sizeHeightClass =
    size === 'sm' ? 'form-control-sm' : size === 'lg' ? 'form-control-lg' : 'form-control-md';
  const sizes = {
    sm: `form-control-height ${sizeHeightClass} px-3 py-0 text-sm`,
    md: `form-control-height ${sizeHeightClass} px-4 py-0 text-base`,
    lg: `form-control-height ${sizeHeightClass} px-5 py-0 text-lg`,
  };
  const wrapperWidth = width === 'fit' ? 'w-auto min-w-0' : 'w-full';
  const selectWidth = width === 'fit' ? 'w-auto min-w-[8.5rem] max-w-[16rem]' : 'w-full';

  return (
    <div className={wrapperWidth}>
      {label && (
        <label
          className={`block text-body-sm font-medium mb-1 ${
            props.disabled
              ? 'text-neutral-500 dark:text-neutral-400'
              : 'text-neutral-900 dark:text-neutral-100'
          }`}
        >
          {label}
          {props.required && <span className='text-status-error ml-1'>*</span>}
        </label>
      )}
      <div className='relative'>
        <select
          className={`
            ${selectWidth} ${sizes[size]}
            border rounded-lg text-body-md transition-[border-color,box-shadow] duration-200 ease-out
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:shadow-focus
            appearance-none
            bg-white dark:bg-neutral-800 bg-[url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%23828282' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")] 
            bg-[length:1.5em_1.5em] bg-[right_0.75rem_center] bg-no-repeat pr-10
            ${
              error
                ? 'border-status-error bg-white dark:bg-neutral-800 focus:ring-status-error focus:border-status-error'
                : 'border-neutral-300 dark:border-neutral-600 hover:border-neutral-300 dark:hover:border-neutral-500 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-500 dark:placeholder:text-neutral-400'
            }
            ${props.disabled ? 'opacity-50 cursor-not-allowed bg-neutral-100 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400' : 'cursor-pointer'}
            ${className}
          `}
          {...props}
        >
          {placeholder && (
            <option value='' disabled hidden>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <p className='mt-1 text-body-sm text-status-error'>{error}</p>}
        {helperText && !error && <p className='mt-1 text-body-sm text-neutral-500'>{helperText}</p>}
      </div>
    </div>
  );
}
