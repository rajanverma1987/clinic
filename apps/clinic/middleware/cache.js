/**
 * Cache middleware – no-op. Caching disabled; re-implement when needed.
 */

export function withCache(handler) {
  return async (req, ...args) => handler(req, ...args);
}

export default withCache;
