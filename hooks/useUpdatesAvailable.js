/**
 * "Updates available" notification: when background revalidation returns new data
 * different from current, show banner; user clicks to apply (no auto-apply).
 */

import { useCallback, useEffect, useRef, useState } from 'react';

export function useUpdatesAvailable(data, isValidating, mutate) {
  const [updatesAvailable, setUpdatesAvailable] = useState(false);
  const pendingDataRef = useRef(null);
  const prevDataRef = useRef(data);

  useEffect(() => {
    if (!isValidating && data !== undefined && prevDataRef.current !== undefined) {
      const prev = prevDataRef.current;
      const next = data;
      if (prev !== next && JSON.stringify(prev) !== JSON.stringify(next)) {
        pendingDataRef.current = next;
        setUpdatesAvailable(true);
      }
      prevDataRef.current = data;
    } else if (data !== undefined) {
      prevDataRef.current = data;
    }
  }, [data, isValidating]);

  const applyUpdates = useCallback(() => {
    if (pendingDataRef.current !== null) {
      mutate(pendingDataRef.current, { revalidate: false });
      pendingDataRef.current = null;
    }
    setUpdatesAvailable(false);
  }, [mutate]);

  return { updatesAvailable, applyUpdates };
}
