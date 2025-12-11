'use client';

import { useScrollAnimation } from '@/hooks/useScrollAnimation';

/**
 * Wrapper component for sections with scroll-triggered animations
 */
export function ScrollSection({
  children,
  animation = 'fadeIn',
  threshold = 0.1,
  delay = 0,
  className = '',
  ...props
}) {
  const { ref, className: animationClass } = useScrollAnimation({
    animation,
    threshold,
    delay,
    once: true,
  });

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${animationClass} ${className}`}
      style={{
        transitionProperty: 'opacity, transform',
      }}
      {...props}
    >
      {children}
    </div>
  );
}
