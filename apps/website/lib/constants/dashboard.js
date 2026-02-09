/**
 * Dashboard auto-refresh interval (silent client-side refetch, no page reload).
 * Used for stats, lists, and charts so data stays up to date across all dashboard views.
 */
const DASHBOARD_AUTO_REFRESH_MS = 60 * 1000; // 60 seconds

/**
 * How long dashboard data is considered fresh when returning to the dashboard.
 * Show cached data immediately (no loading); revalidate in background if older.
 * Enterprise: one load, then instant when switching back from other "tabs" (routes).
 */
const DASHBOARD_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

module.exports = { DASHBOARD_AUTO_REFRESH_MS, DASHBOARD_CACHE_TTL_MS };
