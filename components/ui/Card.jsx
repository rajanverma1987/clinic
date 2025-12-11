'use client';

export function Card({ title, children, className = '', actions, elevated = false }) {
  // Base classes with theme specifications
  // Default Card: bg-white, border: neutral-200, radius: 10px, padding: 16-24px
  const baseClasses = `bg-white rounded-[10px] border border-neutral-200`;

  // Shadow based on elevation
  // Default: shadow-md (0 2px 4px rgba(0,0,0,0.04))
  // Elevated: shadow-lg (0 4px 12px rgba(0,0,0,0.08))
  const shadowClass = elevated
    ? 'shadow-lg' // Elevated card: 0 4px 12px rgba(0,0,0,0.08)
    : 'shadow-md'; // Default card: 0 2px 4px rgba(0,0,0,0.04)

  return (
    <div className={`${baseClasses} ${shadowClass} ${className}`}>
      {(title || actions) && (
        <div className='px-6 py-4 border-b border-neutral-200 flex items-center justify-between'>
          {title && <h3 className='text-h4 text-neutral-900'>{title}</h3>}
          {actions && <div>{actions}</div>}
        </div>
      )}
      <div className='px-6 py-4'>{children}</div>
    </div>
  );
}
