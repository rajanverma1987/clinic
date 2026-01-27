'use client';

export function Card({ title, children, className = '', actions, elevated = false }) {
  /* Doctor_Dashboard.md: border-radius 12px, padding 20px, box-shadow 0 2px 8px rgba(0,0,0,0.08) */
  const baseClasses = `bg-white rounded-xl border border-neutral-200`;
  const shadowClass = elevated ? 'shadow-lg' : 'shadow-[0_2px_8px_rgba(0,0,0,0.08)]';

  return (
    <div className={`${baseClasses} ${shadowClass} ${className}`}>
      {(title || actions) && (
        <div
          className='border-b border-neutral-200 flex items-center justify-between'
          style={{ padding: 'var(--dashboard-card-padding, 20px)' }}
        >
          {title && <h3 className='text-h4 text-neutral-900'>{title}</h3>}
          {actions && <div>{actions}</div>}
        </div>
      )}
      <div style={{ padding: 'var(--dashboard-card-padding, 20px)' }}>{children}</div>
    </div>
  );
}
