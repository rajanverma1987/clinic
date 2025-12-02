import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import {
  getSessionById,
  startSession,
  endSession,
  cancelSession,
} from '@/services/telemedicine.service';

/**
 * GET /api/telemedicine/sessions/[id]
 * Get session details
 */
async function getHandler(req: AuthenticatedRequest, user: any, sessionId: string) {
  try {
    const session = await getSessionById(sessionId, user.tenantId);
    
    if (!session) {
      return NextResponse.json(
        errorResponse('Session not found', 'NOT_FOUND'),
        { status: 404 }
      );
    }

    return NextResponse.json(successResponse(session));
  } catch (error: any) {
    return NextResponse.json(
      errorResponse(error.message || 'Failed to fetch session', 'FETCH_ERROR'),
      { status: 400 }
    );
  }
}

/**
 * PUT /api/telemedicine/sessions/[id]
 * Update session (start, end, cancel)
 */
async function putHandler(req: AuthenticatedRequest, user: any, sessionId: string) {
  try {
    const body = await req.json();
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    let session;

    switch (action) {
      case 'start':
        session = await startSession(sessionId, user.tenantId, user.userId, body.roomId);
        break;
      
      case 'end':
        session = await endSession(sessionId, user.tenantId, user.userId, {
          notes: body.notes,
          diagnosis: body.diagnosis,
          connectionQuality: body.connectionQuality,
          technicalIssues: body.technicalIssues,
        });
        break;
      
      case 'cancel':
        session = await cancelSession(sessionId, user.tenantId, user.userId, body.reason);
        break;
      
      default:
        return NextResponse.json(
          errorResponse('Invalid action. Use: start, end, or cancel', 'INVALID_ACTION'),
          { status: 400 }
        );
    }

    if (!session) {
      return NextResponse.json(
        errorResponse('Session not found', 'NOT_FOUND'),
        { status: 404 }
      );
    }

    return NextResponse.json(successResponse(session));
  } catch (error: any) {
    return NextResponse.json(
      errorResponse(error.message || 'Failed to update session', 'UPDATE_ERROR'),
      { status: 400 }
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
  return getHandler(authenticatedReq, authResult.user, params.id);
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
  return putHandler(authenticatedReq, authResult.user, params.id);
}

