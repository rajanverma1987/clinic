import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/middleware/auth';
import { changeStatusSchema } from '@/lib/validations/appointment';
import { changeAppointmentStatus, cancelAppointment } from '@/services/appointment.service';
import { successResponse, errorResponse, handleMongoError } from '@/lib/utils/api-response';
import { AppointmentStatus } from '@/models/Appointment';

/**
 * PUT /api/appointments/:id/status
 * Change appointment status
 */
async function putHandler(
  req: AuthenticatedRequest,
  user: any,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();

    const validationResult = changeStatusSchema.safeParse(body);
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

    // Use cancelAppointment for cancellation
    if (validationResult.data.status === AppointmentStatus.CANCELLED) {
      const appointment = await cancelAppointment(
        params.id,
        validationResult.data.cancellationReason || 'Cancelled by user',
        user.tenantId,
        user.userId
      );

      if (!appointment) {
        return NextResponse.json(
          errorResponse('Appointment not found', 'NOT_FOUND'),
          { status: 404 }
        );
      }

      return NextResponse.json(successResponse({
        id: appointment._id.toString(),
        status: appointment.status,
        cancelledAt: appointment.cancelledAt,
      }));
    }

    // Use changeAppointmentStatus for other status changes
    const appointment = await changeAppointmentStatus(
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

    return NextResponse.json(successResponse({
      id: appointment._id.toString(),
      status: appointment.status,
      arrivedAt: appointment.arrivedAt,
      startedAt: appointment.startedAt,
      completedAt: appointment.completedAt,
    }));
  } catch (error: any) {
    if (error.name === 'MongoError' || error.name === 'ValidationError') {
      return NextResponse.json(handleMongoError(error), { status: 400 });
    }

    return NextResponse.json(
      errorResponse(
        error.message || 'Failed to change appointment status',
        'STATUS_CHANGE_ERROR'
      ),
      { status: 400 }
    );
  }
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

