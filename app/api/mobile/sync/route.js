/**
 * Mobile API - Data Sync
 * Get incremental updates since last sync
 */

import { NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { successResponse } from '@/lib/utils/api-response';
import connectDB from '@/lib/db/connection.js';
import Appointment from '@/models/Appointment.js';
import Prescription from '@/models/Prescription.js';
import Invoice from '@/models/Invoice.js';
import { withTenant } from '@/lib/db/tenant-helper.js';

/**
 * GET /api/mobile/sync?since=timestamp
 * Get updates since last sync timestamp
 */
async function getHandler(req, user) {
  await connectDB();

  const { searchParams } = new URL(req.url);
  const since = searchParams.get('since') ? new Date(searchParams.get('since')) : new Date(Date.now() - 24 * 60 * 60 * 1000); // Default: last 24 hours

  const tenantQuery = withTenant(user.tenantId, {
    updatedAt: { $gte: since },
    deletedAt: null,
  });

  const [appointments, prescriptions, invoices] = await Promise.all([
    Appointment.find(tenantQuery).limit(50).lean(),
    Prescription.find(tenantQuery).limit(50).lean(),
    Invoice.find(tenantQuery).limit(50).lean(),
  ]);

  return NextResponse.json(successResponse({
    syncTimestamp: new Date().toISOString(),
    appointments: appointments.length,
    prescriptions: prescriptions.length,
    invoices: invoices.length,
    data: {
      appointments: appointments.slice(0, 20), // Limit for mobile
      prescriptions: prescriptions.slice(0, 20),
      invoices: invoices.slice(0, 20),
    },
  }));
}

export const GET = withErrorHandler(withAuth(getHandler));
