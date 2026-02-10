'use client';

/**
 * Cache warming on login: preload dashboard stats, lists, charts when user is available.
 * Runs once per tenant so navigation to dashboard is instant.
 */

import { useAuth } from '@/contexts/AuthContext';
import {
  DASHBOARD_CHARTS_KEY,
  DASHBOARD_LISTS_KEY,
  DASHBOARD_STATS_KEY,
} from '@/lib/swr/dashboard-keys';
import { useEffect, useRef } from 'react';
import { useSWRConfig } from 'swr';

export function CacheWarming() {
  const { user } = useAuth();
  const tenantId = user?.tenantId ?? null;
  const warmed = useRef(false);
  const { mutate } = useSWRConfig();

  useEffect(() => {
    if (!tenantId || warmed.current) return;
    warmed.current = true;
    mutate(DASHBOARD_STATS_KEY);
    mutate(DASHBOARD_LISTS_KEY);
    mutate(DASHBOARD_CHARTS_KEY);
  }, [tenantId, mutate]);

  return null;
}
