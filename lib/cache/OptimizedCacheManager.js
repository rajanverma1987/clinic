/**
 * In-memory LRU with TTL. No external LRU dependency; keeps order by access and evicts oldest.
 */
class SimpleLRU {
  constructor(options = {}) {
    this.max = options.max ?? 100;
    this.defaultTtlMs = options.ttl ?? 60000;
    /** @type {Map<string, { value: unknown; expiresAt: number }>} */
    this.entries = new Map();
    /** Keys in access order (oldest first) for LRU eviction */
    this.order = [];
  }

  get(key) {
    const entry = this.entries.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this._remove(key);
      return undefined;
    }
    this._touch(key);
    return entry.value;
  }

  set(key, value, ttlMs) {
    const ttl = ttlMs ?? this.defaultTtlMs;
    const expiresAt = Date.now() + ttl;
    if (this.entries.has(key)) {
      this.entries.set(key, { value, expiresAt });
      this._touch(key);
      return;
    }
    while (this.order.length >= this.max && this.order.length > 0) {
      const oldest = this.order.shift();
      if (oldest !== undefined) this.entries.delete(oldest);
    }
    this.entries.set(key, { value, expiresAt });
    this.order.push(key);
  }

  delete(key) {
    this._remove(key);
  }

  _remove(key) {
    this.entries.delete(key);
    const i = this.order.indexOf(key);
    if (i !== -1) this.order.splice(i, 1);
  }

  _touch(key) {
    const i = this.order.indexOf(key);
    if (i !== -1) {
      this.order.splice(i, 1);
      this.order.push(key);
    }
  }
}

/**
 * Optimized cache: request deduplication, LRU with TTL, and batched invalidation
 * to reduce duplicate fetches and WebSocket invalidation overhead.
 */
class OptimizedCacheManager {
  constructor(options = {}) {
    this.memoryCache = new Map();
    this.lruCache = new SimpleLRU({
      max: options.max ?? 100,
      ttl: options.ttl ?? 60000,
    });
    /** @type {Map<string, Promise<unknown>>} */
    this.pendingRequests = new Map();
    this._invalidationQueue = [];
    this._invalidationTimer = null;
    this._invalidationDelayMs = options.invalidationDelayMs ?? 1000;
  }

  /**
   * Get from cache or run fetcher (deduplicated). Same key concurrent callers share one request.
   * @param {string} key - Cache key
   * @param {() => Promise<unknown>} fetcher - Async function that returns data to cache
   * @param {number} [ttl] - TTL in ms for this entry (default from constructor)
   * @returns {Promise<unknown>}
   */
  async getOrFetch(key, fetcher, ttl) {
    const cached = this.lruCache.get(key);
    if (cached !== undefined) return cached;

    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key);
    }

    const promise = fetcher()
      .then((data) => {
        this.lruCache.set(key, data, ttl);
        this.pendingRequests.delete(key);
        return data;
      })
      .catch((err) => {
        this.pendingRequests.delete(key);
        throw err;
      });

    this.pendingRequests.set(key, promise);
    return promise;
  }

  /**
   * Invalidate keys. Batched: deduped and applied after a short delay to reduce overhead.
   * @param {string[]} keys - Keys to invalidate (can contain duplicates; will be deduped)
   */
  invalidate(keys) {
    if (!keys || keys.length === 0) return;
    this._invalidationQueue.push(...keys);

    if (!this._invalidationTimer) {
      this._invalidationTimer = setTimeout(() => {
        const unique = [...new Set(this._invalidationQueue)];
        unique.forEach((k) => this.lruCache.delete(k));
        this._invalidationQueue = [];
        this._invalidationTimer = null;
      }, this._invalidationDelayMs);
    }
  }

  /** Get cached value only (no fetch). Returns undefined on miss or expiry. */
  get(key) {
    return this.lruCache.get(key);
  }

  /** Set value with optional TTL (ms). */
  set(key, value, ttlMs) {
    this.lruCache.set(key, value, ttlMs);
  }

  /** Clear all in-memory and LRU entries; does not cancel in-flight requests. */
  clear() {
    this._invalidationQueue = [];
    if (this._invalidationTimer) {
      clearTimeout(this._invalidationTimer);
      this._invalidationTimer = null;
    }
    this.lruCache = new SimpleLRU({
      max: 100,
      ttl: 60000,
    });
    this.memoryCache.clear();
  }
}

export const optimizedCacheManager = new OptimizedCacheManager();
