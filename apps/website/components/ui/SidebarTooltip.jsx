'use client';

import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';

const TOOLTIP_Z_INDEX = 10050;
const GAP_PX = 10;
const SHOW_DELAY_MS = 200;

/**
 * Portal-rendered tooltip for collapsed sidebar nav items.
 * Renders into document.body so it is never clipped and always on top.
 * Single instance: show one tooltip at a time to the right of the anchor.
 * Shows after a short delay to avoid flicker on quick mouse moves.
 */
export function SidebarTooltip({ anchor, label, visible }) {
  const [position, setPosition] = useState(null);
  const [delayedVisible, setDelayedVisible] = useState(false);

  useEffect(() => {
    if (!visible) {
      setDelayedVisible(false);
      return;
    }
    const id = setTimeout(() => setDelayedVisible(true), SHOW_DELAY_MS);
    return () => clearTimeout(id);
  }, [visible]);

  useEffect(() => {
    if (!delayedVisible || !anchor || !label || typeof document === 'undefined') {
      setPosition(null);
      return;
    }

    const updatePosition = () => {
      if (!anchor || !anchor.getBoundingClientRect) return;
      const rect = anchor.getBoundingClientRect();
      setPosition({
        left: rect.right + GAP_PX,
        top: rect.top + rect.height / 2,
      });
    };

    updatePosition();

    const win = window;
    win.addEventListener('scroll', updatePosition, true);
    win.addEventListener('resize', updatePosition);

    return () => {
      win.removeEventListener('scroll', updatePosition, true);
      win.removeEventListener('resize', updatePosition);
    };
  }, [delayedVisible, anchor, label]);

  if (!delayedVisible || !label || !position || typeof document === 'undefined') return null;

  const tooltipContent = (
    <div
      role='tooltip'
      className='sidebar-tooltip-portal'
      style={{
        position: 'fixed',
        left: position.left,
        top: position.top,
        transform: 'translateY(-50%)',
        zIndex: TOOLTIP_Z_INDEX,
        padding: '8px 12px',
        background: 'var(--color-neutral-800)',
        color: '#fff',
        fontSize: '13px',
        fontWeight: 500,
        lineHeight: 1.25,
        borderRadius: '8px',
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15), 0 0 1px rgba(0,0,0,0.1)',
        border: 'none',
      }}
    >
      {label}
    </div>
  );

  return createPortal(tooltipContent, document.body);
}
