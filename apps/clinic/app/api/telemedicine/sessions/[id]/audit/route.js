/**
 * POST /api/telemedicine/sessions/[id]/audit
 * Record a telemedicine audit event from the client (server-side only; avoids MONGODB_URI in browser).
 */

import { NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { RESOURCES, ACTIONS } from '@/lib/permissions/constants';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import { AuditLogger } from '@/lib/audit/audit-logger.js';
import { findSessionByParamId } from '@/services/telemedicine.service.js';
import { logger } from '@/lib/utils/logger.js';

async function postHandler(req, user, context) {
  try {
    const params = await context.params;
    const sessionId = params.id;
    const body = await req.json().catch(() => ({}));

    if (!sessionId) {
      return NextResponse.json(
        errorResponse('Session ID is required', 'VALIDATION_ERROR'),
        { status: 400 }
      );
    }

    const { action, before, details } = body;
    if (!action || typeof action !== 'string') {
      return NextResponse.json(
        errorResponse('action is required', 'VALIDATION_ERROR'),
        { status: 400 }
      );
    }

    const session = await findSessionByParamId(sessionId, user.tenantId);
    if (!session) {
      return NextResponse.json(
        errorResponse('Session not found', 'NOT_FOUND'),
        { status: 404 }
      );
    }

    await AuditLogger.auditWrite(
      'telemedicine_session',
      sessionId,
      user.userId,
      user.tenantId || 'system',
      action,
      before,
      details || {}
    );

    return NextResponse.json(successResponse({ ok: true }));
  } catch (error) {
    logger.error('Telemedicine audit API error:', error);
    throw error;
  }
}

export const POST = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.TELEMEDICINE, ACTIONS.UPDATE)((req, user, context) =>
        postHandler(req, user, context)
      )
    )
  )
);
