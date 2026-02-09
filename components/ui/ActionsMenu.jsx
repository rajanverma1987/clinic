'use client';

import { MoreVerticalIcon } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { useEffect, useRef, useState } from 'react';

/**
 * Single icon (⋮) that opens a dropdown of actions. Use in tables/lists to replace multiple buttons.
 *
 * @param {Object} props
 * @param {Array<{ key: string, label: string, icon?: React.ReactNode, onClick: () => void, danger?: boolean, disabled?: boolean }>} props.items - Menu items
 * @param {string} [props.ariaLabel='Actions'] - Trigger button aria-label
 * @param {string} [props.triggerSize='sm'] - Button size for trigger
 * @param {string} [props.className] - Extra class on trigger wrapper
 * @param {boolean} [props.alignRight] - Align dropdown to right edge of trigger (default true)
 */
export function ActionsMenu({
  items,
  ariaLabel = 'Actions',
  triggerSize = 'sm',
  className = '',
  alignRight = true,
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [open]);

  const filteredItems = Array.isArray(items)
    ? items.filter((i) => i && (i.label != null || i.key))
    : [];
  if (filteredItems.length === 0) return null;

  return (
    <div className={`relative inline-block ${className}`.trim()} ref={wrapperRef}>
      <Button
        variant='ghost'
        size={triggerSize}
        className='!p-1.5 min-w-0'
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        aria-label={ariaLabel}
        aria-haspopup='true'
        aria-expanded={open}
      >
        <MoreVerticalIcon className='icon icon-sm' ariaHidden />
      </Button>
      {open && (
        <div
          className='absolute z-[10060] mt-1 min-w-[10rem] rounded-lg border border-neutral-200 bg-white py-1 shadow-lg dark:border-neutral-600 dark:bg-neutral-800'
          style={alignRight ? { right: 0 } : { left: 0 }}
          role='menu'
          aria-orientation='vertical'
        >
          {filteredItems.map((item) => (
            <button
              key={item.key}
              type='button'
              role='menuitem'
              disabled={item.disabled}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-body-sm transition-colors ${
                item.danger
                  ? 'text-status-error hover:bg-status-error/10'
                  : 'text-neutral-800 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-700'
              } ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                if (!item.disabled && item.onClick) item.onClick();
                setOpen(false);
              }}
            >
              {item.icon && (
                <span className='flex-shrink-0 [&_.icon]:w-4 [&_.icon]:h-4'>{item.icon}</span>
              )}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
