/**
 * Apply Note Template API Route
 */

import { NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { RESOURCES, ACTIONS } from '@/lib/permissions/constants';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import { applyTemplate } from '@/services/note-template.service';

/**
 * POST /api/note-templates/[id]/apply
 * Apply template to get structure for creating a clinical note
 */
async function postHandler(req, user, { params }) {
  const templateId = params.id;

  const templateStructure = await applyTemplate(templateId, user.tenantId, user.userId);

  return NextResponse.json(successResponse(templateStructure));
}

// Apply middleware stack
export const POST = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.CLINICAL_NOTE, ACTIONS.READ)(async (req, user, context) => {
        const params = await context.params;
        return postHandler(req, user, { params });
      })
    )
  )
);
