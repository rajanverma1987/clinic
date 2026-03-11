/**
 * Dashboard cache manager – no-op. Caching disabled; re-implement when needed.
 * Keeps same API so useDashboardCache and websocket-sync keep working (always fetch).
 */

class DashboardCacheManager {
  async get() {
    return null;
  }

  async getEntry() {
    return null;
  }

  async set() {}

  invalidate() {}

  invalidateAll() {}

  subscribe() {}

  unsubscribe() {}

  emit() {}

  isStale() {
    return true;
  }

  getDataVersion() {
    return 1;
  }

  getStats() {
    return {
      memory: { size: 0, keys: [] },
      listeners: { events: [], count: 0 },
    };
  }
}

export const dashboardCacheManager = new DashboardCacheManager();
