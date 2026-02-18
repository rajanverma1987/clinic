'use client';

/**
 * TablesSection – Client component. Lazy load on scroll (IntersectionObserver).
 * CursorMD/new fix.md: TablesSection lazy loads on scroll.
 */

import { useEffect, useRef, useState } from 'react';

const DEFAULT_ROOT_MARGIN = '100px';

export function TablesSection({ children, className = '', rootMargin = DEFAULT_ROOT_MARGIN }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setVisible(true);
      },
      { rootMargin, threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [visible, rootMargin]);

  return (
    <section ref={ref} className={`dashboard-section ${className}`}>
      {visible ? children : <div className='min-h-[120px]' aria-hidden />}
    </section>
  );
}
