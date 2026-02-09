/**
 * Notification Template Detail API Routes
 */

import { NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { RESOURCES, ACTIONS } from '@/lib/permissions/constants';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/utils/api-response';
import { updateNotificationTemplateSchema, applyTemplateSchema } from '@/lib/validations/notification-template';
import {
  getNotificationTemplateById,
  updateNotificationTemplate,
  deleteNotificationTemplate,
  applyTemplate,
} from '@/services/notification-template.service';

/**
 * GET /api/notification-templates/[id]
 * Get notification template by ID
 */
async function getHandler(req, user, { params }) {
  const templateId = params.id;

  const template = await getNotificationTemplateById(templateId, user.tenantId, user.userId);

  if (!template) {
    return NextResponse.json(
      errorResponse('Notification template not found', 'NOT_FOUND'),
      { status: 404 }
    );
  }

  return NextResponse.json(successResponse(template));
}

/**
 * PUT /api/notification-templates/[id]
 * Update notification template
 */
async function putHandler(req, user, { params }) {
  const templateId = params.id;
  const body = await req.json();

  const validationResult = updateNotificationTemplateSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      validationErrorResponse(validationResult.error.errors),
      { status: 400 }
    );
  }

  const template = await updateNotificationTemplate(
    templateId,
    validationResult.data,
    user.tenantId,
    user.userId
  );

  if (!template) {
    return NextResponse.json(
      errorResponse('Notification template not found', 'NOT_FOUND'),
      { status: 404 }
    );
  }

  return NextResponse.json(successResponse(template));
}

/**
 * DELETE /api/notification-templates/[id]
 * Delete notification template (soft delete)
 */
async function deleteHandler(req, user, { params }) {
  const templateId = params.id;

  const deleted = await deleteNotificationTemplate(templateId, user.tenantId, user.userId);

  if (!deleted) {
    return NextResponse.json(
      errorResponse('Notification template not found', 'NOT_FOUND'),
      { status: 404 }
    );
  }

  return NextResponse.json(successResponse({ message: 'Notification template deleted successfully' }));
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

export const PUT = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.NOTIFICATION, ACTIONS.UPDATE)(async (req, user, context) => {
        const params = await context.params;
        return putHandler(req, user, { params });
      })
    )
  )
);

export const DELETE = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.NOTIFICATION, ACTIONS.DELETE)(async (req, user, context) => {
        const params = await context.params;
        return deleteHandler(req, user, { params });
      })
    )
  )
);
