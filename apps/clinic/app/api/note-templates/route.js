/**
 * Note Template API Routes
 * Based on NEW-PLANS.md requirements
 */

import { NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { RESOURCES, ACTIONS } from '@/lib/permissions/constants';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/utils/api-response';
import { createNoteTemplateSchema, noteTemplateQuerySchema } from '@/lib/validations/note-template';
import { createNoteTemplate, listNoteTemplates } from '@/services/note-template.service';

/**
 * GET /api/note-templates
 * List note templates with pagination and filters
 */
async function getHandler(req, user) {
  const { searchParams } = new URL(req.url);

  const queryParams = {
    page: searchParams.get('page') || undefined,
    limit: searchParams.get('limit') || undefined,
    doctorId: searchParams.get('doctorId') || undefined,
    specialty: searchParams.get('specialty') || undefined,
    type: searchParams.get('type') || undefined,
    isActive: searchParams.get('isActive') || undefined,
    isDefault: searchParams.get('isDefault') || undefined,
    search: searchParams.get('search') || undefined,
  };

  const validationResult = noteTemplateQuerySchema.safeParse(queryParams);
  if (!validationResult.success) {
    return NextResponse.json(
      validationErrorResponse(validationResult.error.errors),
      { status: 400 }
    );
  }

  const result = await listNoteTemplates(validationResult.data, user.tenantId, user.userId);

  return NextResponse.json(successResponse(result));
}

/**
 * POST /api/note-templates
 * Create a new note template
 */
async function postHandler(req, user) {
  const body = await req.json();

  const validationResult = createNoteTemplateSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      validationErrorResponse(validationResult.error.errors),
      { status: 400 }
    );
  }

  const template = await createNoteTemplate(validationResult.data, user.tenantId, user.userId);

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
      requirePermission(RESOURCES.CLINICAL_NOTE, ACTIONS.READ)(getHandler)
    )
  )
);

export const POST = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.CLINICAL_NOTE, ACTIONS.CREATE)(postHandler)
    )
  )
);
