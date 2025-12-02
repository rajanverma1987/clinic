import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/utils/api-response';

// In-memory store for signaling messages (use Redis in production)
const signalingStore: Map<string, any[]> = new Map();

/**
 * GET /api/telemedicine/signaling/[id]
 * Poll for signaling messages
 */
async function getHandler(req: AuthenticatedRequest, user: any, sessionId: string) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        errorResponse('userId query parameter required', 'VALIDATION_ERROR'),
        { status: 400 }
      );
    }

    // Get messages for this user in this session
    const messages = signalingStore.get(sessionId) || [];
    const userMessages = messages.filter(m => m.to === userId);

    // Remove delivered messages
    const remainingMessages = messages.filter(m => m.to !== userId);
    signalingStore.set(sessionId, remainingMessages);

    return NextResponse.json(successResponse(userMessages));
  } catch (error: any) {
    return NextResponse.json(
      errorResponse(error.message || 'Failed to fetch signals', 'FETCH_ERROR'),
      { status: 400 }
    );
  }
}

/**
 * POST /api/telemedicine/signaling/[id]
 * Send signaling message (offer, answer, ICE candidate)
 */
async function postHandler(req: AuthenticatedRequest, user: any, sessionId: string) {
  try {
    const body = await req.json();

    // Validate message
    if (!body.type || !body.from || !body.to) {
      return NextResponse.json(
        errorResponse('Invalid signaling message format', 'VALIDATION_ERROR'),
        { status: 400 }
      );
    }

    // Store message for recipient
    const messages = signalingStore.get(sessionId) || [];
    messages.push({
      ...body,
      sessionId,
      timestamp: new Date().toISOString(),
    });
    signalingStore.set(sessionId, messages);

    // Auto-cleanup old messages after 5 minutes
    setTimeout(() => {
      const currentMessages = signalingStore.get(sessionId) || [];
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      const recentMessages = currentMessages.filter(m => 
        new Date(m.timestamp).getTime() > fiveMinutesAgo
      );
      signalingStore.set(sessionId, recentMessages);
    }, 5 * 60 * 1000);

    return NextResponse.json(successResponse({ sent: true }));
  } catch (error: any) {
    return NextResponse.json(
      errorResponse(error.message || 'Failed to send signal', 'SEND_ERROR'),
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

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await import('@/middleware/auth').then(m => m.authenticate(req));
  if ('error' in authResult) return authResult.error;

  const params = await context.params;
  const authenticatedReq = req as AuthenticatedRequest;
  authenticatedReq.user = authResult.user;
  return postHandler(authenticatedReq, authResult.user, params.id);
}

