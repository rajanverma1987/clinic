/**
 * Cache manager – no-op. Caching disabled; re-implement when needed.
 */

class CacheManager {
  static async get() {
    return null;
  }

  static async set() {
    return true;
  }

  static async invalidate() {
    return false;
  }

  static async invalidatePattern() {
    return 0;
  }

  static async cacheApiResponse() {
    return true;
  }

  static async getCachedApiResponse() {
    return null;
  }

  static async cacheSession() {
    return true;
  }

  static async getCachedSession() {
    return null;
  }

  static async cacheClinicSettings() {
    return true;
  }

  static async getCachedClinicSettings() {
    return null;
  }
}

module.exports = CacheManager;
