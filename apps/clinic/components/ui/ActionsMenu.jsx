'use client';

import { MoreVerticalIcon } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const DROPDOWN_ESTIMATED_HEIGHT = 240;
const DROPDOWN_Z_INDEX = 10060;

/**
 * Single icon (⋮) that opens a dropdown of actions. Use in tables/lists to replace multiple buttons.
 * Dropdown is portaled to document.body so it stays visible when inside overflow containers (e.g. last table row).
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
  const [dropdownStyle, setDropdownStyle] = useState({});
  const wrapperRef = useRef(null);
  const dropdownRef = useRef(null);

  useLayoutEffect(() => {
    if (!open || !wrapperRef.current) return;

    const updatePosition = () => {
      if (!wrapperRef.current) return;
      const rect = wrapperRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - rect.bottom;
      const openAbove = spaceBelow < DROPDOWN_ESTIMATED_HEIGHT + 8;

      setDropdownStyle({
        position: 'fixed',
        zIndex: DROPDOWN_Z_INDEX,
        minWidth: '10rem',
        ...(alignRight
          ? { right: `${window.innerWidth - rect.right}px` }
          : { left: `${rect.left}px` }),
        ...(openAbove
          ? { bottom: `${viewportHeight - rect.top + 4}px`, top: 'auto' }
          : { top: `${rect.bottom + 4}px`, bottom: 'auto' }),
      });
    };

    updatePosition();
    window.addEventListener('scroll', updatePosition, { passive: true });
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
    };
  }, [open, alignRight]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const filteredItems = Array.isArray(items)
    ? items.filter((i) => i && (i.label != null || i.key))
    : [];
  if (filteredItems.length === 0) return null;

  const dropdownContent =
    open &&
    typeof document !== 'undefined' &&
    createPortal(
      <div
        ref={dropdownRef}
        className='dropdown-menu-unified'
        style={dropdownStyle}
        role='menu'
        aria-orientation='vertical'
      >
        {filteredItems.map((item) => (
          <Button
            key={item.key}
            type='button'
            variant='ghost'
            fullWidth
            align='start'
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
          </Button>
        ))}
      </div>,
      document.body,
    );

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
      {dropdownContent}
    </div>
  );
}
