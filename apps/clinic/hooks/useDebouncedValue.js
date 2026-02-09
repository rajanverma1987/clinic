'use client';

import { useEffect, useState } from 'react';

/**
 * Returns a value that updates only after the input has been stable for `delayMs`.
 * Use for search inputs to avoid firing API requests on every keystroke.
 *
 * @param {*} value - The value to debounce (e.g. searchInput)
 * @param {number} delayMs - Delay in milliseconds (e.g. 300–500)
 * @returns {*} - The debounced value
 */
export function useDebouncedValue(value, delayMs = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debouncedValue;
}
