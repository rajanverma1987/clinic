import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import {
  getSessionById,
  startSession,
  endSession,
} from '@/services/telemedicine.service';
import connectDB from '@/lib/db/connection.js';
import TelemedicineSession from '@/models/TelemedicineSession.js';
import { withTenant } from '@/lib/db/tenant-helper.js';

/**
 * GET /api/telemedicine/sessions/:id
 * Get a single telemedicine session by ID
 */
async function getHandler(
  req,
  user,
  { params }
) {
  try {
    const session = await getSessionById(params.id, user.tenantId);

    if (!session) {
      return NextResponse.json(
        errorResponse('Session not found', 'NOT_FOUND'),
        { status: 404 }
      );
    }

    return NextResponse.json(successResponse(session));
  } catch (error) {
    console.error('Error in GET /api/telemedicine/sessions/[id]:', error);
    return NextResponse.json(
      errorResponse(
        error instanceof Error ? error.message : 'Failed to fetch session',
        'FETCH_ERROR'
      ),
      { status: 500 }
    );
  }
}

/**
 * PUT /api/telemedicine/sessions/:id
 * Update a telemedicine session (start, end, etc.)
 */
async function putHandler(
  req,
  user,
  { params }
) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');
    const body = await req.json().catch(() => ({}));

    if (action === 'start') {
      const session = await startSession(params.id, user.tenantId, user.userId, body.roomId);
      if (!session) {
        return NextResponse.json(
          errorResponse('Session not found', 'NOT_FOUND'),
          { status: 404 }
        );
      }
      return NextResponse.json(successResponse(session));
    }

    // Update session with any additional fields
    if (body && Object.keys(body).length > 0) {
      await connectDB();
      const session = await TelemedicineSession.findOne(
        withTenant(user.tenantId, { _id: params.id })
      );
      if (!session) {
        return NextResponse.json(
          errorResponse('Session not found', 'NOT_FOUND'),
          { status: 404 }
        );
      }
      // Update session fields
      Object.assign(session, body);
      await session.save();
      return NextResponse.json(successResponse(session.toObject()));
    }

    if (action === 'end') {
      const session = await endSession(params.id, user.tenantId, user.userId, body);
      if (!session) {
        return NextResponse.json(
          errorResponse('Session not found', 'NOT_FOUND'),
          { status: 404 }
        );
      }
      return NextResponse.json(successResponse(session));
    }

    return NextResponse.json(
      errorResponse('Invalid action', 'VALIDATION_ERROR'),
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in PUT /api/telemedicine/sessions/[id]:', error);
    return NextResponse.json(
      errorResponse(
        error instanceof Error ? error.message : 'Failed to update session',
        'UPDATE_ERROR'
      ),
      { status: 500 }
    );
  }
}

export async function GET(
  req,
  context
) {
  const authResult = await import('@/middleware/auth').then(m => m.authenticate(req));
  if ('error' in authResult) return authResult.error;

  const params = await context.params;
  const authenticatedReq = req;
  authenticatedReq.user = authResult.user;

  return getHandler(authenticatedReq, authResult.user, { params });
}

export async function PUT(
  req,
  context
) {
  const authResult = await import('@/middleware/auth').then(m => m.authenticate(req));
  if ('error' in authResult) return authResult.error;

  const params = await context.params;
  const authenticatedReq = req;
  authenticatedReq.user = authResult.user;

  return putHandler(authenticatedReq, authResult.user, { params });
}

