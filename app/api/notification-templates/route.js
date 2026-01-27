/**
 * Notification Template API Routes
 */

import { NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { RESOURCES, ACTIONS } from '@/lib/permissions/constants';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/utils/api-response';
import { createNotificationTemplateSchema, notificationTemplateQuerySchema } from '@/lib/validations/notification-template';
import {
  createNotificationTemplate,
  listNotificationTemplates,
  getDefaultTemplate,
} from '@/services/notification-template.service';

/**
 * GET /api/notification-templates
 * List notification templates
 */
async function getHandler(req, user) {
  const { searchParams } = new URL(req.url);

  // Check for default template endpoint
  const type = searchParams.get('default');
  if (type) {
    const template = await getDefaultTemplate(type, user.tenantId);
    if (!template) {
      return NextResponse.json(
        errorResponse('Default template not found', 'NOT_FOUND'),
        { status: 404 }
      );
    }
    return NextResponse.json(successResponse(template));
  }

  const queryParams = {
    page: searchParams.get('page') || undefined,
    limit: searchParams.get('limit') || undefined,
    type: searchParams.get('type') || undefined,
    isDefault: searchParams.get('isDefault') || undefined,
    isActive: searchParams.get('isActive') || undefined,
    search: searchParams.get('search') || undefined,
  };

  const validationResult = notificationTemplateQuerySchema.safeParse(queryParams);
  if (!validationResult.success) {
    return NextResponse.json(
      validationErrorResponse(validationResult.error.errors),
      { status: 400 }
    );
  }

  const result = await listNotificationTemplates(validationResult.data, user.tenantId, user.userId);

  return NextResponse.json(successResponse(result));
}

/**
 * POST /api/notification-templates
 * Create a new notification template
 */
async function postHandler(req, user) {
  const body = await req.json();

  const validationResult = createNotificationTemplateSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      validationErrorResponse(validationResult.error.errors),
      { status: 400 }
    );
  }

  const template = await createNotificationTemplate(validationResult.data, user.tenantId, user.userId);

  return NextResponse.json(
    successResponse({
      id: template._id.toString(),
      name: template.name,
      type: template.type,
      isDefault: template.isDefault,
      createdAt: template.createdAt,
    }),
    { status: 201 }
  );
}

// Apply middleware stack
export const GET = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.NOTIFICATION, ACTIONS.READ)(getHandler)
    )
  )
);

export const POST = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.NOTIFICATION, ACTIONS.CREATE)(postHandler)
    )
  )
);
