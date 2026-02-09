/**
 * WhatsApp Conversation API Route
 */

import { NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { RESOURCES, ACTIONS } from '@/lib/permissions/constants';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import { getConversationThread } from '@/services/whatsapp.service';

/**
 * GET /api/whatsapp/conversations/[patientId]
 * Get conversation thread with patient
 */
async function getHandler(req, user, { params }) {
  const patientId = params.patientId;

  const conversation = await getConversationThread(patientId, user.tenantId, user.userId);

  if (!conversation) {
    return NextResponse.json(
      errorResponse('Patient not found', 'NOT_FOUND'),
      { status: 404 }
    );
  }

  return NextResponse.json(successResponse(conversation));
}

// Apply middleware stack
export const GET = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.NOTIFICATION, ACTIONS.READ)(async (req, user, context) => {
        const params = await context.params;
        return getHandler(req, user, { params });
      })
    )
  )
);
