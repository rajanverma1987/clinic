import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { createQueueEntrySchema, queueQuerySchema } from '@/lib/validations/queue';
import {
  createQueueEntry,
  listQueueEntries,
} from '@/services/queue.service';
import { successResponse, errorResponse, handleMongoError, validationErrorResponse } from '@/lib/utils/api-response';

/**
 * GET /api/queue
 * List queue entries with pagination and filters
 */
async function getHandler(req, user) {
  try {
    const { searchParams } = new URL(req.url);

    const queryParams = {
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
      doctorId: searchParams.get('doctorId') || undefined,
      patientId: searchParams.get('patientId') || undefined,
      status: searchParams.get('status') || undefined,
      priority: searchParams.get('priority') || undefined,
      type: searchParams.get('type') || undefined,
      appointmentId: searchParams.get('appointmentId') || undefined,
      date: searchParams.get('date') || undefined,
      isActive: searchParams.get('isActive') || undefined,
    };

    const validationResult = queueQuerySchema.safeParse(queryParams);
    if (!validationResult.success) {
      return NextResponse.json(
        validationErrorResponse(validationResult.error.errors),
        { status: 400 }
      );
    }

    const result = await listQueueEntries(validationResult.data, user.tenantId, user.userId);

    return NextResponse.json(successResponse(result));
  } catch (error) {
    if (error.name === 'MongoError' || error.name === 'ValidationError') {
      return NextResponse.json(handleMongoError(error), { status: 400 });
    }

    return NextResponse.json(
      errorResponse('Failed to fetch queue entries', 'INTERNAL_ERROR'),
      { status: 500 }
    );
  }
}

/**
 * POST /api/queue
 * Create a new queue entry (from appointment or walk-in)
 */
async function postHandler(req, user) {
  try {
    const body = await req.json();

    const validationResult = createQueueEntrySchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        validationErrorResponse(validationResult.error.errors),
        { status: 400 }
      );
    }

    const queueEntry = await createQueueEntry(validationResult.data, user.tenantId, user.userId);

    return NextResponse.json(
      successResponse({
        id: queueEntry._id.toString(),
        queueNumber: queueEntry.queueNumber,
        type: queueEntry.type,
        patientId: queueEntry.patientId.toString(),
        doctorId: queueEntry.doctorId.toString(),
        appointmentId: queueEntry.appointmentId?.toString(),
        position: queueEntry.position,
        priority: queueEntry.priority,
        status: queueEntry.status,
        estimatedWaitTime: queueEntry.estimatedWaitTime,
        joinedAt: queueEntry.joinedAt,
        createdAt: queueEntry.createdAt,
      }),
      { status: 201 }
    );
  } catch (error) {
    if (error.name === 'MongoError' || error.name === 'ValidationError') {
      return NextResponse.json(handleMongoError(error), { status: 400 });
    }

    return NextResponse.json(
      errorResponse(
        (error instanceof Error ? error.message : String(error)) || 'Failed to create queue entry',
        'CREATE_ERROR'
      ),
      { status: 400 }
    );
  }
}

export const GET = withAuth(getHandler);
export const POST = withAuth(postHandler);

