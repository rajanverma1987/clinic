/**
 * useQueryStats: cache efficiency and performance markers for debugging.
 * Tracks cache hits/misses and WebSocket connection quality.
 */

import { getCacheHitMiss } from '@/lib/cache/perf-markers';
import { getConnectionQuality } from '@/lib/realtime/realtime-client';
import { useRealtime } from '@/contexts/RealtimeContext';
import { useSWRConfig } from 'swr';
import { useMemo } from 'react';

export function useQueryStats() {
  const { cache } = useSWRConfig();
  const realtime = useRealtime();
  const connectionQuality = getConnectionQuality();

  const hitMiss = getCacheHitMiss();
  const snapshot = useMemo(() => {
    if (!cache || typeof cache.get !== 'function') {
      return {
        hits: hitMiss.hits,
        misses: hitMiss.misses,
        connected: realtime.connected,
        cacheSize: 0,
      };
    }
    const keys = Array.from(cache.keys?.() ?? []);
    return {
      hits: hitMiss.hits,
      misses: hitMiss.misses,
      connected: realtime.connected,
      cacheSize: keys.length,
    };
  }, [cache, realtime.connected, hitMiss.hits, hitMiss.misses]);

  return {
    cacheHits: snapshot.hits,
    cacheMisses: snapshot.misses,
    cacheSize: snapshot.cacheSize ?? 0,
    isRealtimeConnected: snapshot.connected,
    lastPingLatencyMs: connectionQuality.lastPingLatencyMs,
    disconnectCount: connectionQuality.disconnectCount,
    efficiency: snapshot.hits + snapshot.misses > 0
      ? Math.round((snapshot.hits / (snapshot.hits + snapshot.misses)) * 100)
      : null,
  };
}

export { recordCacheHit, recordCacheMiss } from '@/lib/cache/perf-markers';
