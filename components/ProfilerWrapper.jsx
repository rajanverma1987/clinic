'use client';

/**
 * React DevTools Profiler integration: log render duration in dev.
 */

import { Profiler } from 'react';

export function ProfilerWrapper({ id, children, onRender }) {
  if (process.env.NODE_ENV !== 'development') {
    return children;
  }
  const handleRender = (renderId, phase, actualDuration) => {
    onRender?.(renderId, phase, actualDuration);
  };
  return (
    <Profiler id={id || 'app'} onRender={handleRender}>
      {children}
    </Profiler>
  );
}
