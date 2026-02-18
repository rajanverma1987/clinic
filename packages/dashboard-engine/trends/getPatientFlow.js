import { validateAdapter } from '../context.js';

/**
 * Patient flow for dashboard: new/active patients by period and trend.
 * Uses adapter only; no DB access.
 *
 * @param {string} tenantId
 * @param {TrendOptions} [options] - e.g. { period: 'week' | 'month' }
 * @param {import('../context.js').DashboardAdapter} adapter
 * @returns {Promise<PatientFlow>}
 */
export async function getPatientFlow(tenantId, options, adapter) {
  validateAdapter(adapter);
  if (!tenantId) return { newPatients: 0, activePatients: 0, trendPercent: 0, period: options?.period || 'month' };

  const raw = await adapter.getPatientFlowRaw(tenantId, options || {});
  if (!raw) return { newPatients: 0, activePatients: 0, trendPercent: 0, period: options?.period || 'month' };

  const newPatients = raw.newPatients ?? 0;
  const previousNew = raw.previousNew ?? 0;
  const trendPercent =
    previousNew > 0
      ? parseFloat((((newPatients - previousNew) / previousNew) * 100).toFixed(1))
      : newPatients > 0
        ? 100
        : 0;

  return {
    newPatients,
    activePatients: raw.activePatients ?? 0,
    trendPercent,
    period: raw.period || options?.period || 'month',
  };
}
