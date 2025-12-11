'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Custom hook for scroll-triggered animations
 * @param {Object} options - Configuration options
 * @param {string} options.animation - Animation type: 'fadeIn', 'slideUp', 'slideLeft', 'slideRight', 'scale'
 * @param {number} options.threshold - Intersection threshold (0-1)
 * @param {number} options.delay - Animation delay in milliseconds
 * @param {boolean} options.once - Whether to animate only once
 * @returns {Object} - { ref, isVisible, className }
 */
export function useScrollAnimation({
  animation = 'fadeIn',
  threshold = 0.1,
  delay = 0,
  once = true,
} = {}) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const elementRef = useRef(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (delay > 0) {
              setTimeout(() => {
                setIsVisible(true);
                if (once) {
                  setHasAnimated(true);
                }
              }, delay);
            } else {
              setIsVisible(true);
              if (once) {
                setHasAnimated(true);
              }
            }
          } else if (!once && !hasAnimated) {
            setIsVisible(false);
          }
        });
      },
      {
        threshold,
        rootMargin: '0px 0px -100px 0px', // Trigger when element is 100px from viewport
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, delay, once, hasAnimated]);

  const getInitialStyles = () => {
    switch (animation) {
      case 'slideUp':
        return 'opacity-0 translate-y-10';
      case 'slideLeft':
        return 'opacity-0 -translate-x-10';
      case 'slideRight':
        return 'opacity-0 translate-x-10';
      case 'scale':
        return 'opacity-0 scale-95';
      case 'fadeIn':
      default:
        return 'opacity-0';
    }
  };

  const getVisibleStyles = () => {
    switch (animation) {
      case 'slideUp':
        return 'opacity-100 translate-y-0';
      case 'slideLeft':
        return 'opacity-100 translate-x-0';
      case 'slideRight':
        return 'opacity-100 translate-x-0';
      case 'scale':
        return 'opacity-100 scale-100';
      case 'fadeIn':
      default:
        return 'opacity-100';
    }
  };

  return {
    ref: elementRef,
    isVisible,
    className: isVisible ? getVisibleStyles() : getInitialStyles(),
  };
}

export default useScrollAnimation;
