'use client';

/**
 * Progressive loading hook per CursorMD/CLAUDE-AI.md.
 * Returns phase state and config for the current route; use with LoadingWrapper or SkeletonFactory.
 */

import { LOADING_STATES } from '@/lib/loading/loading-states';
import { getProgressiveLoadingConfig } from '@/lib/loading/progressive-loader';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';

export function useProgressiveLoading(routePath, dependencies = []) {
  const router = useRouter();
  const [loadingPhases, setLoadingPhases] = useState({});
  const [currentPhase, setCurrentPhase] = useState(0);
  const [loadingState, setLoadingState] = useState(LOADING_STATES.INITIAL);
  const [errors, setErrors] = useState({});

  const config = getProgressiveLoadingConfig(routePath);

  const timeout = useCallback((ms) => {
    return new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms));
  }, []);

  useEffect(() => {
    if (!config?.phases?.length) {
      setLoadingState(LOADING_STATES.SUCCESS);
      return;
    }

    let cancelled = false;

    const loadPhase = async (phaseIndex) => {
      if (cancelled) return;
      const phase = config.phases[phaseIndex];
      if (!phase) {
        setLoadingState(LOADING_STATES.SUCCESS);
        return;
      }

      setCurrentPhase(phaseIndex + 1);
      setLoadingPhases((prev) => ({ ...prev, [phaseIndex]: LOADING_STATES.INITIAL }));

      try {
        await Promise.race([
          new Promise((resolve) => setTimeout(resolve, phase.timeout || 500)),
          timeout(phase.timeout ? phase.timeout + 2000 : 5000),
        ]);
        if (cancelled) return;
        setLoadingPhases((prev) => ({ ...prev, [phaseIndex]: LOADING_STATES.SUCCESS }));
        if (phaseIndex + 1 < config.phases.length) {
          setTimeout(() => loadPhase(phaseIndex + 1), 0);
        } else {
          setLoadingState(LOADING_STATES.SUCCESS);
        }
      } catch (err) {
        if (cancelled) return;
        setLoadingPhases((prev) => ({ ...prev, [phaseIndex]: LOADING_STATES.ERROR }));
        setErrors((prev) => ({ ...prev, [phaseIndex]: err?.message || 'Error' }));
        if (phase.fallback === 'redirect-login') {
          router.replace('/login');
        } else {
          setLoadingState(LOADING_STATES.SUCCESS);
        }
      }
    };

    loadPhase(0);
    return () => {
      cancelled = true;
    };
  }, [routePath, router, ...dependencies]);

  return {
    currentPhase,
    loadingPhases,
    loadingState,
    errors,
    isPhaseLoaded: (phaseIndex) => loadingPhases[phaseIndex] === LOADING_STATES.SUCCESS,
    isLoading: loadingState === LOADING_STATES.INITIAL,
    config,
  };
}
