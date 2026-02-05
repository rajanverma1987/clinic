'use client';

/**
 * Loading wrapper per CursorMD/CLAUDE-AI.md. Shows skeleton or fallback until the given phase is loaded.
 */

import { SkeletonFactory } from '@/components/skeletons/SkeletonFactory';
import { Loader } from '@/components/ui/Loader';
import { useI18n } from '@/contexts/I18nContext';
import { useProgressiveLoading } from '@/hooks/useProgressiveLoading';
import { usePathname } from 'next/navigation';

/**
 * @param {Object} props
 * @param {React.ReactNode} props.children - Content when phase is loaded
 * @param {string} [props.routePath] - Pathname (defaults to usePathname())
 * @param {number} props.phase - 1-based phase index (e.g. 1 = first phase)
 * @param {React.ReactNode} [props.fallback] - Custom fallback instead of skeleton
 * @param {Array} [props.dependencies] - Extra deps for useProgressiveLoading
 */
export function LoadingWrapper({ children, routePath, phase, fallback, dependencies = [] }) {
  const pathname = usePathname();
  const path = routePath ?? pathname ?? '';
  const { isPhaseLoaded, config } = useProgressiveLoading(path, dependencies);
  const { t } = useI18n();

  if (!config?.phases?.length) {
    return <>{children}</>;
  }

  const phaseConfig = config.phases[phase - 1];
  if (!phaseConfig) {
    return <>{children}</>;
  }

  if (!isPhaseLoaded(phase - 1)) {
    if (fallback) return fallback;
    if (phaseConfig.skeleton && phaseConfig.skeleton !== 'tab-specific') {
      return <SkeletonFactory type={phaseConfig.skeleton} />;
    }
    if (phaseConfig.skeleton === 'tab-specific') {
      return <SkeletonFactory type='detail' />;
    }
    if (phaseConfig.skeleton === 'video-placeholder') {
      return <SkeletonFactory type='video-placeholder' />;
    }
    return <Loader type='page' text={t('common.loading')} />;
  }

  return <>{children}</>;
}
