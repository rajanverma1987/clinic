/**
 * Redis cache TTL (seconds). Aligned with CursorMD/New realtime-caching-strategy.md.
 * Use for backend Redis keys; frontend SWR uses lib/cache/cache-config.js (ms).
 */
const CACHE_TTL_SECONDS = {
  APPOINTMENTS: 60,
  PATIENTS: 300,
  DOCTORS: 3600,
  SETTINGS: 86400,
  STATS: 300,
  MEDICINES: 1800,
};

module.exports = { CACHE_TTL_SECONDS };
