/**
 * Apply Notification Template API Route
 */

import { NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { RESOURCES, ACTIONS } from '@/lib/permissions/constants';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/utils/api-response';
import { applyTemplateSchema } from '@/lib/validations/notification-template';
import { applyTemplate } from '@/services/notification-template.service';

/**
 * POST /api/notification-templates/[id]/apply
 * Apply template with variables
 */
async function postHandler(req, user, { params }) {
  const templateId = params.id;
  const body = await req.json();

  const validationResult = applyTemplateSchema.safeParse({
    templateId,
    ...body,
  });

  if (!validationResult.success) {
    return NextResponse.json(
      validationErrorResponse(validationResult.error.errors),
      { status: 400 }
    );
  }

  const result = await applyTemplate(
    templateId,
    validationResult.data.variables || {},
    user.tenantId
  );

  return NextResponse.json(successResponse(result));
}

// Apply middleware stack
export const POST = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.NOTIFICATION, ACTIONS.READ)(async (req, user, context) => {
        const params = await context.params;
        return postHandler(req, user, { params });
      })
    )
  )
);
