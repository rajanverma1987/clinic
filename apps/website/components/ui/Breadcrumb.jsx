'use client';

import Link from 'next/link';

/**
 * Breadcrumb navigation: Home / Section / Current page
 * @param {{ items: Array<{ label: string; href?: string }> }} props
 */
export function Breadcrumb({ items = [] }) {
  if (!items?.length) return null;

  return (
    <nav className='mb-8' aria-label='Breadcrumb'>
      <ol
        className='flex flex-wrap items-center gap-x-2 text-sm text-neutral-600'
        style={{ gap: '0 8px' }}
      >
        {items.map((item, index) => (
          <li key={index} className='flex items-center gap-2'>
            {index > 0 && (
              <span className='text-neutral-400' aria-hidden>
                /
              </span>
            )}
            {item.href ? (
              <Link
                href={item.href}
                className='hover:text-primary-600 hover:underline transition-colors'
              >
                {item.label}
              </Link>
            ) : (
              <span className='text-neutral-900 font-medium'>{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
