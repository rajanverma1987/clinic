import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { RESOURCES, ACTIONS } from '@/lib/permissions/constants';
import { createQueueEntrySchema, queueQuerySchema } from '@/lib/validations/queue';
import {
  createQueueEntry,
  listQueueEntries,
} from '@/services/queue.service';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/utils/api-response';
import { optimizedCacheManager } from '@/lib/cache/OptimizedCacheManager';

/** Server-side cache TTL for queue entries (ms). Cache only for common queries. */
const QUEUE_CACHE_TTL_MS = 30000; // 30 seconds - queue data changes frequently

/**
 * GET /api/queue
 * List queue entries with pagination and filters
 * Cached for common queries (status=waiting, no date filter) to improve performance
 */
async function getHandler(req, user) {
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

  // Cache key: only cache common queries (waiting status, no date filter, no patientId filter)
  const isCacheable = 
    validationResult.data.status === 'waiting' && 
    !validationResult.data.date && 
    !validationResult.data.patientId &&
    !validationResult.data.appointmentId;

  const cacheKey = isCacheable 
    ? `queue-${user.tenantId}-${validationResult.data.status || 'all'}-${validationResult.data.doctorId || 'all'}-${validationResult.data.page || 1}-${validationResult.data.limit || 100}`
    : null;

  const result = cacheKey
    ? await optimizedCacheManager.getOrFetch(
        `queue:${cacheKey}`,
        () => listQueueEntries(validationResult.data, user.tenantId, user.userId),
        QUEUE_CACHE_TTL_MS,
      )
    : await listQueueEntries(validationResult.data, user.tenantId, user.userId);

  return NextResponse.json(successResponse(result));
}

/**
 * POST /api/queue
 * Create a new queue entry (from appointment or walk-in)
 */
async function postHandler(req, user) {
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
}

// Apply middleware stack
export const GET = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.QUEUE, ACTIONS.READ)(getHandler)
    )
  )
);

export const POST = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.QUEUE, ACTIONS.CREATE)(postHandler)
    )
  )
);

