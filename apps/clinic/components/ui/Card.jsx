'use client';

export function Card({ title, children, className = '', actions, elevated = false }) {
  /* Doctor_Dashboard.md: border-radius 12px, padding 20px, box-shadow 0 2px 8px rgba(0,0,0,0.08) */
  const baseClasses = `bg-neutral-50 dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-600 transition-[border-color,box-shadow,background-color] duration-200 ease-out`;
  const shadowClass = elevated ? 'shadow-lg' : 'shadow-[var(--dashboard-card-shadow)]';

  return (
    <div className={`${baseClasses} ${shadowClass} ${className}`}>
      {(title || actions) && (
        <div
          className='border-b border-neutral-200 dark:border-neutral-600 flex items-center justify-between'
          style={{ padding: 'var(--dashboard-card-padding, 20px)' }}
        >
          {title && <h3 className='text-h4 text-neutral-900 dark:text-neutral-100'>{title}</h3>}
          {actions && <div>{actions}</div>}
        </div>
      )}
      <div style={{ padding: 'var(--dashboard-card-padding, 20px)' }}>{children}</div>
    </div>
  );
}
