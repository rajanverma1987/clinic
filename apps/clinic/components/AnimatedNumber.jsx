'use client';

/**
 * Animate number changes (stats/metrics: animate number changes).
 */

import { useEffect, useRef, useState } from 'react';

export function AnimatedNumber({ value, duration = 400, format = (n) => n }) {
  const prevRef = useRef(value);
  const [display, setDisplay] = useState(value);
  const rafRef = useRef(null);

  useEffect(() => {
    const prev = prevRef.current;
    const next = typeof value === 'number' ? value : parseFloat(value) || 0;
    if (prev === next) return;
    prevRef.current = next;
    const start = typeof display === 'number' ? display : parseFloat(display) || 0;
    const startTime = performance.now();
    const tick = () => {
      const t = Math.min((performance.now() - startTime) / duration, 1);
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      setDisplay(start + (next - start) * eased);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration]);

  return format(display);
}
