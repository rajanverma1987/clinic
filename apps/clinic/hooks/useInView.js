'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Intersection Observer: detect when element is in viewport.
 * Use for lazy rendering (e.g. render heavy widget only when scrolled into view).
 *
 * @param {object} [options] - IntersectionObserverInit (threshold, rootMargin, root)
 * @returns {{ ref: React.RefObject, isInView: boolean, hasBeenInView: boolean }}
 */
export function useInView(options = {}) {
  const ref = useRef(null);
  const [isInView, setIsInView] = useState(false);
  const [hasBeenInView, setHasBeenInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const intersecting = entry.isIntersecting;
        setIsInView(intersecting);
        if (intersecting) setHasBeenInView(true);
      },
      {
        threshold: 0.1,
        rootMargin: '200px',
        ...options,
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, isInView, hasBeenInView };
}
