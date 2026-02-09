import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { RESOURCES, ACTIONS } from '@/lib/permissions/constants';
import { changeStatusSchema } from '@/lib/validations/appointment';
import { changeAppointmentStatus, cancelAppointment } from '@/services/appointment.service';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/utils/api-response';
import { AppointmentStatus } from '@/models/Appointment';

/**
 * PUT /api/appointments/:id/status
 * Change appointment status
 */
async function putHandler(
  req,
  user,
  { params }
) {
  try {
    const body = await req.json();

    const validationResult = changeStatusSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        validationErrorResponse(validationResult.error.errors),
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
  } catch (error) {
    if (error.name === 'MongoError' || error.name === 'ValidationError') {
      return NextResponse.json(handleMongoError(error), { status: 400 });
    }

    return NextResponse.json(
      errorResponse(
        (error instanceof Error ? error.message : String(error)) || 'Failed to change appointment status',
        'STATUS_CHANGE_ERROR'
      ),
      { status: 400 }
    );
  }
}

// Apply middleware stack
export const PUT = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.APPOINTMENT, ACTIONS.UPDATE)(async (req, user, context) => {
        const params = await context.params;
        return putHandler(req, user, { params });
      })
    )
  )
);

