'use client';

/**
 * KeepAlive: keeps children mounted when inactive (e.g. tab switch) so state is preserved.
 * Uses visibility + pointer-events instead of unmounting.
 */

import { Button } from '@/components/ui/Button';
import { useRef, useState, useCallback, createContext, useContext } from 'react';

const KeepAliveContext = createContext(null);

export function KeepAliveGroup({ children, defaultActive }) {
  const [activeId, setActiveId] = useState(defaultActive ?? null);
  return (
    <KeepAliveContext.Provider value={{ activeId, setActiveId }}>
      {children}
    </KeepAliveContext.Provider>
  );
}

export function useKeepAlive() {
  return useContext(KeepAliveContext);
}

/**
 * Renders children when activeId matches id; otherwise hides but keeps mounted.
 */
export function KeepAlive({ id, children, className = '' }) {
  const { activeId } = useKeepAlive();
  const isActive = activeId === id;
  return (
    <div
      className={className}
      style={{
        display: isActive ? undefined : 'none',
        visibility: isActive ? undefined : 'hidden',
        position: isActive ? undefined : 'absolute',
        pointerEvents: isActive ? undefined : 'none',
      }}
      aria-hidden={!isActive}
    >
      {children}
    </div>
  );
}

/**
 * Tab button that switches active KeepAlive panel.
 */
export function KeepAliveTab({ id, children, className = '', activeClassName = '' }) {
  const { activeId, setActiveId } = useKeepAlive();
  const isActive = activeId === id;
  return (
    <Button
      type='button'
      variant='ghost'
      className={isActive ? `${className} ${activeClassName}`.trim() : className}
      onClick={() => setActiveId(id)}
      aria-selected={isActive}
    >
      {children}
    </Button>
  );
}
