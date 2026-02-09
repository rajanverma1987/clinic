'use client';

/**
 * Client-side query defaults and helpers. Uses SWR (project standard), not React Query.
 * Tune these for stale/cache behaviour and prefetch-on-hover.
 */

import { useSWRConfig } from 'swr';

// Semantic defaults (used when creating custom SWR configs or for reference)
export const DEFAULT_STALE_TIME_MS = 5 * 60 * 1000; // 5 min – data considered fresh
export const DEFAULT_CACHE_TIME_MS = 10 * 60 * 1000; // 10 min – keep in cache
export const DEFAULT_RETRY_COUNT = 1;
export const DEFAULT_RETRY_DELAY_MS = 1000;

/**
 * SWR options aligned with “query config” semantics:
 * - Don’t refetch on window focus or on mount (use deduping + manual revalidate where needed)
 * - Short retry, use cache while revalidating
 */
export const queryLikeSwrOptions = {
  revalidateOnFocus: false,
  revalidateOnMount: false,
  revalidateIfStale: true,
  dedupingInterval: DEFAULT_STALE_TIME_MS,
  errorRetryCount: DEFAULT_RETRY_COUNT,
  errorRetryInterval: DEFAULT_RETRY_DELAY_MS,
  revalidateOnReconnect: true,
};

/**
 * Prefetch on hover: populates SWR cache so navigation feels instant.
 * Use with Link/buttons that lead to data-driven pages. Same key + fetcher
 * must be used in useSWR on the target page for cache to be used.
 *
 * @returns {(queryKey: string | unknown[], queryFn: () => Promise<unknown>) => { onMouseEnter: () => void }}
 */
export function usePrefetchOnHover() {
  const { mutate } = useSWRConfig();

  return (queryKey, queryFn) => ({
    onMouseEnter: () => {
      Promise.resolve(queryFn())
        .then((data) => mutate(queryKey, data, { revalidate: false }))
        .catch(() => {});
    },
  });
}
