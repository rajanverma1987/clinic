/**
 * Dashboard and stats indexes. Create after DB connect (e.g. from a setup script or on app bootstrap).
 * Field names match models and report.service/getDashboardStatsForDate query patterns.
 */

import connectDB from '@/lib/db/connection.js';
import { logger } from '@/lib/utils/logger.js';
import Appointment from '@/models/Appointment.js';
import Invoice from '@/models/Invoice.js';
import Patient from '@/models/Patient.js';
import Queue from '@/models/Queue.js';

/**
 * Create compound indexes used by dashboard, report, and list queries.
 * List endpoints (appointments, patients, invoices) use tenantId + date/createdAt + status filters;
 * these indexes support both dashboard stats and paginated list APIs.
 * Idempotent: safe to run multiple times (MongoDB createIndex is no-op if index exists).
 *
 * Run once after deploy or from a script:
 *   node -e "import('./lib/db/indexes.js').then(m => m.createDashboardIndexes())"
 * Or from an API route / setup script: await createDashboardIndexes();
 */
export async function createDashboardIndexes() {
  await connectDB();

  try {
    // getDashboardStatsForDate: tenantId + appointmentDate range + status
    await Appointment.collection.createIndex(
      { tenantId: 1, appointmentDate: 1, status: 1 },
      { name: 'dashboard_stats_idx' },
    );

    // New patients this month, patient lists by created
    await Patient.collection.createIndex(
      { tenantId: 1, createdAt: 1 },
      { name: 'patient_stats_idx' },
    );

    // getDashboardStats: Invoice.find(tenantId, invoiceDate range, status)
    await Invoice.collection.createIndex(
      { tenantId: 1, invoiceDate: 1, status: 1 },
      { name: 'revenue_stats_idx' },
    );

    // Queue by tenant, time, status (joinedAt = entry time)
    await Queue.collection.createIndex(
      { tenantId: 1, joinedAt: 1, status: 1 },
      { name: 'queue_stats_idx' },
    );

    logger.info('Dashboard indexes created or already present');
  } catch (err) {
    logger.error('Failed to create dashboard indexes', { error: err?.message });
    throw err;
  }
}
