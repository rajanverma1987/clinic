'use client';

/**
 * Shared header for each settings tab content.
 * Renders a consistent title and optional subtitle above tab content.
 */
export function SettingsTabHeader({ title, subtitle }) {
  return (
    <div className='mb-6 text-left'>
      <h2 className='text-xl font-bold text-neutral-900 dark:text-neutral-100'>{title}</h2>
      {subtitle && (
        <p className='text-sm text-neutral-600 dark:text-neutral-400 mt-1'>{subtitle}</p>
      )}
    </div>
  );
}
