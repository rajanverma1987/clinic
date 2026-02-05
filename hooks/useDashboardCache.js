/**
 * React hook for dashboard widgets with multi-layer cache (memory, IndexedDB, localStorage).
 * Uses DASHBOARD_CACHE_CONFIG strategy per widget; supports SWR, cache-first, network-first.
 * Validates requiredPermission and requiredRoles before serving cached data or fetching.
 */

import { useAuth } from '@/contexts/AuthContext';
import { CACHE_STRATEGY } from '@/lib/cache/cache-architecture';
import { DASHBOARD_CACHE_CONFIG } from '@/lib/cache/dashboard-cache-config';
import { dashboardCacheManager as cacheManager } from '@/lib/cache/dashboard-cache-manager';
import { hasPermission } from '@/lib/permissions/constants';
import { useCallback, useEffect, useRef, useState } from 'react';

export function useDashboardCache(widget, params, fetcher) {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isStale, setIsStale] = useState(false);

  const config = DASHBOARD_CACHE_CONFIG[widget];
  const isMounted = useRef(true);
  const fetcherRef = useRef(fetcher);

  const hasWidgetPermission =
    !config?.requiredPermission ||
    (user?.role &&
      hasPermission(
        user.role,
        config.requiredPermission.resource,
        config.requiredPermission.action,
      ));
  const hasRoleAccess =
    !config?.requiredRoles || (user?.role && config.requiredRoles.includes(user.role));
  const allowed = hasWidgetPermission && hasRoleAccess;

  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);

  const fetchData = useCallback(
    async (background = false) => {
      if (!background) setLoading(true);
      setError(null);

      try {
        const freshData = await fetcherRef.current(params);
        if (!isMounted.current) return;

        setData(freshData);
        setIsStale(false);
        await cacheManager.set(widget, params, freshData);
        if (!background) setLoading(false);
      } catch (err) {
        if (!isMounted.current) return;
        setError(err);
        setLoading(false);
      }
    },
    [widget, params],
  );

  const loadFromCache = useCallback(async () => {
    if (!allowed) return false;
    const cachedData = await cacheManager.get(widget, params);
    if (cachedData != null) {
      setData(cachedData);
      setLoading(false);
      const entry = await cacheManager.getEntry(widget, params);
      if (entry && cacheManager.isStale(widget, entry)) {
        setIsStale(true);
      }
      return true;
    }
    return false;
  }, [widget, params, allowed]);

  useEffect(() => {
    isMounted.current = true;

    const init = async () => {
      if (!allowed) {
        setError(new Error('Insufficient permissions'));
        setLoading(false);
        return;
      }
      if (!config) {
        await fetchData();
        return;
      }

      switch (config.strategy) {
        case CACHE_STRATEGY.CACHE_FIRST: {
          const hasCache = await loadFromCache();
          if (!hasCache) {
            await fetchData();
          } else if (config.background) {
            const entry = await cacheManager.getEntry(widget, params);
            if (entry && cacheManager.isStale(widget, entry)) {
              fetchData(true);
            }
          }
          break;
        }
        case CACHE_STRATEGY.NETWORK_FIRST:
          try {
            await fetchData();
          } catch (err) {
            const hasCache = await loadFromCache();
            if (!hasCache) {
              setError(err);
              setLoading(false);
            }
          }
          break;

        case CACHE_STRATEGY.SWR: {
          const hasCache = await loadFromCache();
          if (hasCache) {
            fetchData(true);
          } else {
            await fetchData();
          }
          break;
        }
        case CACHE_STRATEGY.NETWORK_ONLY:
          await fetchData();
          break;

        case CACHE_STRATEGY.CACHE_ONLY:
          await loadFromCache();
          setLoading(false);
          break;

        default:
          await fetchData();
      }
    };

    init();

    if (config?.revalidateOn) {
      cacheManager.subscribe(widget, () => {
        fetchData(true);
      });
    }

    return () => {
      isMounted.current = false;
      if (config) cacheManager.unsubscribe(widget);
    };
  }, [widget, JSON.stringify(params), allowed]);

  const revalidate = useCallback(() => {
    fetchData();
  }, [fetchData]);

  const mutate = useCallback(
    async (newData, options = {}) => {
      const { optimistic = false, revalidate: shouldRevalidate = true } = options;

      if (optimistic && newData != null) {
        setData(newData);
        await cacheManager.set(widget, params, newData);
      }

      if (shouldRevalidate) {
        await fetchData(true);
      }
    },
    [widget, params, fetchData],
  );

  return {
    data,
    loading,
    error,
    isStale,
    revalidate,
    mutate,
  };
}
