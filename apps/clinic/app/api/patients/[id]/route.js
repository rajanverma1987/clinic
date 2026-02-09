/**
 * Patient Detail API Routes
 * Based on NEW-PLANS.md requirements
 */

import { NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { RESOURCES, ACTIONS } from '@/lib/permissions/constants';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/utils/api-response';
import { patientUpdateSchema } from '@/lib/validations/patient';
import {
  getPatientById,
  updatePatient,
  deletePatient,
} from '@/services/patient.service';

/**
 * GET /api/patients/[id]
 * Get patient by ID
 */
async function getHandler(req, user, { params }) {
  const patientId = params.id;

  // Get IP and user agent
  const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                    req.headers.get('x-real-ip') ||
                    'unknown';
  const userAgent = req.headers.get('user-agent') || 'unknown';

  const patient = await getPatientById(
    patientId,
    user.tenantId,
    user.userId,
    ipAddress,
    userAgent
  );

  return NextResponse.json(successResponse(patient));
}

/**
 * PUT /api/patients/[id]
 * Update patient
 */
async function putHandler(req, user, { params }) {
  const patientId = params.id;
  const body = await req.json();

  // Validate input
  const validationResult = patientUpdateSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      validationErrorResponse(validationResult.error.errors),
      { status: 400 }
    );
  }

  // Get IP and user agent
  const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                    req.headers.get('x-real-ip') ||
                    'unknown';
  const userAgent = req.headers.get('user-agent') || 'unknown';

  const patient = await updatePatient(
    patientId,
    validationResult.data,
    user.tenantId,
    user.userId,
    ipAddress,
    userAgent
  );

  return NextResponse.json(successResponse(patient));
}

/**
 * DELETE /api/patients/[id]
 * Delete patient (soft delete)
 */
async function deleteHandler(req, user, { params }) {
  const patientId = params.id;

  // Get IP and user agent
  const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                    req.headers.get('x-real-ip') ||
                    'unknown';
  const userAgent = req.headers.get('user-agent') || 'unknown';

  await deletePatient(
    patientId,
    user.tenantId,
    user.userId,
    ipAddress,
    userAgent
  );

  return NextResponse.json(successResponse({ message: 'Patient deleted successfully' }));
}

// Apply middleware
export const GET = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.PATIENT, ACTIONS.READ)(getHandler)
    )
  )
);

export const PUT = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.PATIENT, ACTIONS.UPDATE)(putHandler)
    )
  )
);

export const DELETE = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.PATIENT, ACTIONS.DELETE)(deleteHandler)
    )
  )
);
