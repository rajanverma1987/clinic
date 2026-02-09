/**
 * Appointment Detail API Routes
 * Based on NEW-PLANS.md requirements
 */

import { NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { RESOURCES, ACTIONS } from '@/lib/permissions/constants';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/utils/api-response';
import { updateAppointmentSchema, changeStatusSchema } from '@/lib/validations/appointment';
import {
  getAppointmentById,
  updateAppointment,
  changeAppointmentStatus,
  deleteAppointment,
} from '@/services/appointment.service';

/**
 * GET /api/appointments/[id]
 * Get appointment by ID
 */
async function getHandler(req, user, { params }) {
  const appointmentId = params.id;

  const appointment = await getAppointmentById(
    appointmentId,
    user.tenantId,
    user.userId
  );

  if (!appointment) {
    return NextResponse.json(
      errorResponse('Appointment not found', 'NOT_FOUND'),
      { status: 404 }
    );
  }

  return NextResponse.json(successResponse(appointment));
}

/**
 * PUT /api/appointments/[id]
 * Update appointment
 */
async function putHandler(req, user, { params }) {
  const appointmentId = params.id;
  const body = await req.json();

  // Validate input
  const validationResult = updateAppointmentSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      validationErrorResponse(validationResult.error.errors),
      { status: 400 }
    );
  }

  const appointment = await updateAppointment(
    appointmentId,
    validationResult.data,
    user.tenantId,
    user.userId
  );

  if (!appointment) {
    return NextResponse.json(
      errorResponse('Appointment not found', 'NOT_FOUND'),
      { status: 404 }
    );
  }

  return NextResponse.json(successResponse(appointment));
}

/**
 * PATCH /api/appointments/[id]/status
 * Change appointment status
 */
async function patchStatusHandler(req, user, { params }) {
  const appointmentId = params.id;
  const body = await req.json();

  // Validate input
  const validationResult = changeStatusSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      validationErrorResponse(validationResult.error.errors),
      { status: 400 }
    );
  }

  const appointment = await changeAppointmentStatus(
    appointmentId,
    validationResult.data,
    user.tenantId,
    user.userId
  );

  if (!appointment) {
    return NextResponse.json(
      errorResponse('Appointment not found', 'NOT_FOUND'),
      { status: 404 }
    );
  }

  return NextResponse.json(successResponse(appointment));
}

/**
 * DELETE /api/appointments/[id]
 * Delete appointment (soft delete)
 */
async function deleteHandler(req, user, { params }) {
  const appointmentId = params.id;

  const deleted = await deleteAppointment(
    appointmentId,
    user.tenantId,
    user.userId
  );

  if (!deleted) {
    return NextResponse.json(
      errorResponse('Appointment not found', 'NOT_FOUND'),
      { status: 404 }
    );
  }

  return NextResponse.json(successResponse({ message: 'Appointment deleted successfully' }));
}

// Apply middleware – pass route context (params) through to handlers
export const GET = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.APPOINTMENT, ACTIONS.READ)(async (req, user, context) => {
        const params = context?.params ? await Promise.resolve(context.params) : {};
        return getHandler(req, user, { params });
      })
    )
  )
);

export const PUT = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.APPOINTMENT, ACTIONS.UPDATE)(async (req, user, context) => {
        const params = context?.params ? await Promise.resolve(context.params) : {};
        return putHandler(req, user, { params });
      })
    )
  )
);

export const DELETE = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.APPOINTMENT, ACTIONS.DELETE)(async (req, user, context) => {
        const params = context?.params ? await Promise.resolve(context.params) : {};
        return deleteHandler(req, user, { params });
      })
    )
  )
);

// PATCH for status change
export const PATCH = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.APPOINTMENT, ACTIONS.UPDATE)(async (req, user, context) => {
        const params = context?.params ? await Promise.resolve(context.params) : {};
        return patchStatusHandler(req, user, { params });
      })
    )
  )
);
