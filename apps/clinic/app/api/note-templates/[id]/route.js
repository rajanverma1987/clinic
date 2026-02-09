/**
 * Note Template Detail API Routes
 */

import { NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { RESOURCES, ACTIONS } from '@/lib/permissions/constants';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/utils/api-response';
import { updateNoteTemplateSchema } from '@/lib/validations/note-template';
import {
  getNoteTemplateById,
  updateNoteTemplate,
  deleteNoteTemplate,
} from '@/services/note-template.service';

/**
 * GET /api/note-templates/[id]
 * Get template by ID
 */
async function getHandler(req, user, { params }) {
  const templateId = params.id;

  const template = await getNoteTemplateById(templateId, user.tenantId, user.userId);

  if (!template) {
    return NextResponse.json(
      errorResponse('Template not found', 'NOT_FOUND'),
      { status: 404 }
    );
  }

  return NextResponse.json(successResponse(template));
}

/**
 * PUT /api/note-templates/[id]
 * Update template
 */
async function putHandler(req, user, { params }) {
  const templateId = params.id;
  const body = await req.json();

  const validationResult = updateNoteTemplateSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      validationErrorResponse(validationResult.error.errors),
      { status: 400 }
    );
  }

  const template = await updateNoteTemplate(
    templateId,
    validationResult.data,
    user.tenantId,
    user.userId
  );

  if (!template) {
    return NextResponse.json(
      errorResponse('Template not found', 'NOT_FOUND'),
      { status: 404 }
    );
  }

  return NextResponse.json(successResponse(template));
}

/**
 * DELETE /api/note-templates/[id]
 * Delete template (soft delete)
 */
async function deleteHandler(req, user, { params }) {
  const templateId = params.id;

  const deleted = await deleteNoteTemplate(templateId, user.tenantId, user.userId);

  if (!deleted) {
    return NextResponse.json(
      errorResponse('Template not found', 'NOT_FOUND'),
      { status: 404 }
    );
  }

  return NextResponse.json(successResponse({ message: 'Template deleted successfully' }));
}

// Apply middleware stack
export const GET = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.CLINICAL_NOTE, ACTIONS.READ)(async (req, user, context) => {
        const params = await context.params;
        return getHandler(req, user, { params });
      })
    )
  )
);

export const PUT = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.CLINICAL_NOTE, ACTIONS.UPDATE)(async (req, user, context) => {
        const params = await context.params;
        return putHandler(req, user, { params });
      })
    )
  )
);

export const DELETE = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.CLINICAL_NOTE, ACTIONS.DELETE)(async (req, user, context) => {
        const params = await context.params;
        return deleteHandler(req, user, { params });
      })
    )
  )
);
