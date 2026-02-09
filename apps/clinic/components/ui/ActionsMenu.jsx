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
          className={`dropdown-menu-unified absolute mt-1 ${alignRight ? 'right-0' : 'left-0'}`}
          role='menu'
          aria-orientation='vertical'
        >
          {filteredItems.map((item) => (
            <button
              key={item.key}
              type='button'
              role='menuitem'
              disabled={item.disabled}
              data-danger={item.danger ? '' : undefined}
              onClick={(e) => {
                e.stopPropagation();
                if (!item.disabled && item.onClick) item.onClick();
                setOpen(false);
              }}
            >
              {item.icon && <span className='flex-shrink-0'>{item.icon}</span>}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
