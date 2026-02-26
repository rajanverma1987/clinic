/**
 * Client-side performance monitoring for component render and tab switch timing.
 * Enterprise: uses logger (no console). Use in useEffect: start measurement when effect runs, report in cleanup.
 */

import { logger } from '@/lib/utils/logger';

const SLOW_RENDER_MS = 100;

/**
 * Measure time from effect run to cleanup (approximates "time until next render or unmount").
 * Call at the start of useEffect and return the returned function as cleanup.
 * Logs a warning and optionally sends to analytics when duration exceeds threshold.
 *
 * @param {string} componentName - Name of the component (for logs and analytics)
 * @param {object} [options]
 * @param {number} [options.slowThresholdMs=100] - Duration above which to warn and report
 * @param {string} [options.analyticsEndpoint='/api/analytics/performance'] - POST URL for metrics
 * @returns {() => void} Cleanup function to call from useEffect return
 */
export function measureComponentRender(componentName, options = {}) {
  const { slowThresholdMs = SLOW_RENDER_MS, analyticsEndpoint = '/api/analytics/performance' } =
    options;
  const start = performance.now();

  return () => {
    const duration = performance.now() - start;

    if (duration > slowThresholdMs && typeof window !== 'undefined') {
      if (process.env.NODE_ENV === 'development') {
        logger.warn('Slow render', { component: componentName, durationMs: Math.round(duration) });
      }

      try {
        fetch(analyticsEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            component: componentName,
            duration: Math.round(duration),
            timestamp: Date.now(),
          }),
          keepalive: true,
        }).catch(() => {});
      } catch (_e) {
        // Fire-and-forget; do not break app
      }
    }
  };
}

/**
 * Measure tab switch duration. Call when initiating a tab change, return the returned
 * function when the switch is complete (e.g. in a useEffect that runs after the new tab is active).
 *
 * @param {string} fromTab - Previous tab id
 * @param {string} toTab - New tab id
 * @returns {() => void} Call when switch is done to log duration
 */
export function measureTabSwitch(fromTab, toTab) {
  const start = performance.now();

  return () => {
    const duration = performance.now() - start;
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
      logger.info('Tab switch', { fromTab, toTab, durationMs: Math.round(duration) });
    }
  };
}

export const PerformanceMonitor = {
  measureComponentRender,
  measureTabSwitch,
};
