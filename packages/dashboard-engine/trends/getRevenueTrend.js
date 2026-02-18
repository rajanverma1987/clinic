import { validateAdapter } from '../context.js';

/**
 * Revenue trend for dashboard: current vs previous period percentage.
 * Uses adapter only; no DB access.
 *
 * @param {string} tenantId
 * @param {TrendOptions} [options] - e.g. { period: 'day' | 'week' | 'month' }
 * @param {import('../context.js').DashboardAdapter} adapter
 * @returns {Promise<RevenueTrend>}
 */
export async function getRevenueTrend(tenantId, options, adapter) {
  validateAdapter(adapter);
  if (!tenantId) return { current: 0, previous: 0, trendPercent: 0, period: options?.period || 'day' };

  const raw = await adapter.getRevenueTrendRaw(tenantId, options || {});
  if (!raw) return { current: 0, previous: 0, trendPercent: 0, period: options?.period || 'day' };

  const current = raw.current ?? 0;
  const previous = raw.previous ?? 0;
  const trendPercent =
    previous > 0
      ? parseFloat((((current - previous) / previous) * 100).toFixed(1))
      : current > 0
        ? 100
        : 0;

  return {
    current,
    previous,
    trendPercent,
    period: raw.period || options?.period || 'day',
  };
}
