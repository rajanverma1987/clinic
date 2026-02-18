import { validateAdapter } from '../context.js';

/**
 * Retry failed payment (e.g. subscription). Delegates to adapter (app implements PayPal/service).
 * Engine does not touch DB or payment provider.
 *
 * @param {string} tenantId
 * @param {RetryPaymentPayload} payload - e.g. { subscriptionId, maxRetries }
 * @param {import('../context.js').DashboardAdapter} adapter
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export async function retryPayment(tenantId, payload, adapter) {
  validateAdapter(adapter);
  if (!tenantId || !payload) return { success: false, error: 'tenantId and payload are required' };
  return adapter.retryPayment(tenantId, payload);
}
