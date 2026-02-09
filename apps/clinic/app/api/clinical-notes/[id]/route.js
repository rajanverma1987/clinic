import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { RESOURCES, ACTIONS } from '@/lib/permissions/constants';
import { updateClinicalNoteSchema } from '@/lib/validations/clinical-note';
import {
  getClinicalNoteById,
  updateClinicalNote,
  deleteClinicalNote,
  getNoteVersionHistory,
} from '@/services/clinical-note.service';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/utils/api-response';

/**
 * GET /api/clinical-notes/:id
 * Get a single clinical note by ID
 */
async function getHandler(
  req,
  user,
  { params }
) {
  try {
    const note = await getClinicalNoteById(params.id, user.tenantId, user.userId);

    if (!note) {
      return NextResponse.json(
        errorResponse('Clinical note not found', 'NOT_FOUND'),
        { status: 404 }
      );
    }

    return NextResponse.json(successResponse(note));
  } catch (error) {
    // Error handling is done by withErrorHandler middleware
    throw error;
  }
}

/**
 * PUT /api/clinical-notes/:id
 * Update a clinical note (creates new version)
 */
async function putHandler(
  req,
  user,
  { params }
) {
  try {
    const body = await req.json();

    const validationResult = updateClinicalNoteSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        validationErrorResponse(validationResult.error.errors),
        { status: 400 }
      );
    }

    const note = await updateClinicalNote(
      params.id,
      validationResult.data,
      user.tenantId,
      user.userId
    );

    if (!note) {
      return NextResponse.json(
        errorResponse('Clinical note not found', 'NOT_FOUND'),
        { status: 404 }
      );
    }

    return NextResponse.json(
      successResponse({
        id: note._id.toString(),
        version: note.version,
        previousVersionId: note.previousVersionId?.toString(),
        updatedAt: note.updatedAt,
      })
    );
  } catch (error) {
    // Error handling is done by withErrorHandler middleware
    throw error;
  }
}

/**
 * DELETE /api/clinical-notes/:id
 * Soft delete a clinical note
 */
async function deleteHandler(
  req,
  user,
  { params }
) {
  try {
    const deleted = await deleteClinicalNote(params.id, user.tenantId, user.userId);

    if (!deleted) {
      return NextResponse.json(
        errorResponse('Clinical note not found', 'NOT_FOUND'),
        { status: 404 }
      );
    }

    return NextResponse.json(
      successResponse({ message: 'Clinical note deleted successfully' })
    );
  } catch (error) {
    // Error handling is done by withErrorHandler middleware
    throw error;
  }
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

