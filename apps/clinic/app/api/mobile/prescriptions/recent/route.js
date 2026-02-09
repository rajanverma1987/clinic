/**
 * Mobile API - Recent Prescriptions
 * Optimized for mobile devices
 */

import { NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { successResponse } from '@/lib/utils/api-response';
import connectDB from '@/lib/db/connection.js';
import Prescription from '@/models/Prescription.js';
import { withTenant } from '@/lib/db/tenant-helper.js';

/**
 * GET /api/mobile/prescriptions/recent
 * Get recent prescriptions (mobile-optimized)
 */
async function getHandler(req, user) {
  await connectDB();

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const patientId = searchParams.get('patientId');

  const query = withTenant(user.tenantId, {
    status: { $ne: 'cancelled' },
  });

  if (patientId) {
    query.patientId = patientId;
  }

  const prescriptions = await Prescription.find(query)
    .populate('patientId', 'firstName lastName patientId')
    .populate('doctorId', 'firstName lastName')
    .sort({ issuedDate: -1 })
    .limit(limit)
    .lean();

  // Mobile-optimized response
  const mobilePrescriptions = prescriptions.map((pres) => ({
    _id: pres._id,
    prescriptionNumber: pres.prescriptionNumber,
    issuedDate: pres.issuedDate,
    validUntil: pres.validUntil,
    status: pres.status,
    patient: {
      _id: pres.patientId?._id,
      name: `${pres.patientId?.firstName || ''} ${pres.patientId?.lastName || ''}`.trim(),
      patientId: pres.patientId?.patientId,
    },
    doctor: {
      _id: pres.doctorId?._id,
      name: `${pres.doctorId?.firstName || ''} ${pres.doctorId?.lastName || ''}`.trim(),
    },
    itemsCount: pres.items?.length || 0,
  }));

  return NextResponse.json(successResponse(mobilePrescriptions));
}

export const GET = withErrorHandler(withAuth(getHandler));
