'use client';

import { Button } from '@/components/ui/Button';

/**
 * Shared empty state component for lists, subscription, etc.
 * @param {string} title - Heading text
 * @param {string} message - Description text
 * @param {string} [actionLabel] - Optional button label
 * @param {function} [onAction] - Optional button click handler
 */
export function EmptyState({ title, message, actionLabel, onAction }) {
  return (
    <div className='flex flex-col items-center justify-center py-12 px-4 text-center'>
      <h3 className='text-lg font-semibold text-neutral-900 mb-2'>{title}</h3>
      <p className='text-sm text-neutral-600 max-w-md mb-4'>{message}</p>
      {actionLabel && onAction && (
        <Button variant='primary' onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
