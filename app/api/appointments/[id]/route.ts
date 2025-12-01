import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/middleware/auth';
import { updateAppointmentSchema, changeStatusSchema } from '@/lib/validations/appointment';
import {
  getAppointmentById,
  updateAppointment,
  deleteAppointment,
  changeAppointmentStatus,
  cancelAppointment,
} from '@/services/appointment.service';
import { successResponse, errorResponse, handleMongoError } from '@/lib/utils/api-response';

/**
 * GET /api/appointments/:id
 * Get a single appointment by ID
 */
async function getHandler(
  req: AuthenticatedRequest,
  user: any,
  { params }: { params: { id: string } }
) {
  try {
    const appointment = await getAppointmentById(params.id, user.tenantId, user.userId);

    if (!appointment) {
      return NextResponse.json(
        errorResponse('Appointment not found', 'NOT_FOUND'),
        { status: 404 }
      );
    }

    return NextResponse.json(successResponse(appointment));
  } catch (error: any) {
    if (error.name === 'MongoError' || error.name === 'ValidationError') {
      return NextResponse.json(handleMongoError(error), { status: 400 });
    }

    return NextResponse.json(
      errorResponse('Failed to fetch appointment', 'INTERNAL_ERROR'),
      { status: 500 }
    );
  }
}

/**
 * PUT /api/appointments/:id
 * Update an appointment
 */
async function putHandler(
  req: AuthenticatedRequest,
  user: any,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();

    const validationResult = updateAppointmentSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        errorResponse(
          'Validation failed',
          'VALIDATION_ERROR',
          validationResult.error.errors
        ),
        { status: 400 }
      );
    }

    const appointment = await updateAppointment(
      params.id,
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

    return NextResponse.json(
      successResponse({
        id: appointment._id.toString(),
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        status: appointment.status,
        updatedAt: appointment.updatedAt,
      })
    );
  } catch (error: any) {
    if (error.name === 'MongoError' || error.name === 'ValidationError') {
      return NextResponse.json(handleMongoError(error), { status: 400 });
    }

    return NextResponse.json(
      errorResponse(
        error.message || 'Failed to update appointment',
        'UPDATE_ERROR'
      ),
      { status: 400 }
    );
  }
}

/**
 * DELETE /api/appointments/:id
 * Soft delete an appointment
 */
async function deleteHandler(
  req: AuthenticatedRequest,
  user: any,
  { params }: { params: { id: string } }
) {
  try {
    const deleted = await deleteAppointment(params.id, user.tenantId, user.userId);

    if (!deleted) {
      return NextResponse.json(
        errorResponse('Appointment not found', 'NOT_FOUND'),
        { status: 404 }
      );
    }

    return NextResponse.json(
      successResponse({ message: 'Appointment deleted successfully' })
    );
  } catch (error: any) {
    return NextResponse.json(
      errorResponse('Failed to delete appointment', 'DELETE_ERROR'),
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await import('@/middleware/auth').then(m => m.authenticate(req));
  if ('error' in authResult) return authResult.error;

  const params = await context.params;
  const authenticatedReq = req as AuthenticatedRequest;
  authenticatedReq.user = authResult.user;

  return getHandler(authenticatedReq, authResult.user, { params });
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await import('@/middleware/auth').then(m => m.authenticate(req));
  if ('error' in authResult) return authResult.error;

  const params = await context.params;
  const authenticatedReq = req as AuthenticatedRequest;
  authenticatedReq.user = authResult.user;

  return putHandler(authenticatedReq, authResult.user, { params });
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await import('@/middleware/auth').then(m => m.authenticate(req));
  if ('error' in authResult) return authResult.error;

  const params = await context.params;
  const authenticatedReq = req as AuthenticatedRequest;
  authenticatedReq.user = authResult.user;

  return deleteHandler(authenticatedReq, authResult.user, { params });
}

