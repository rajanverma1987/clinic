import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { updateClinicalNoteSchema } from '@/lib/validations/clinical-note';
import {
  getClinicalNoteById,
  updateClinicalNote,
  deleteClinicalNote,
  getNoteVersionHistory,
} from '@/services/clinical-note.service';
import { successResponse, errorResponse, handleMongoError } from '@/lib/utils/api-response';

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
    if (error.name === 'MongoError' || error.name === 'ValidationError') {
      return NextResponse.json(handleMongoError(error), { status: 400 });
    }

    return NextResponse.json(
      errorResponse('Failed to fetch clinical note', 'INTERNAL_ERROR'),
      { status: 500 }
    );
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
        errorResponse(
          'Validation failed',
          'VALIDATION_ERROR',
          validationResult.error.errors
        ),
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
    if (error.name === 'MongoError' || error.name === 'ValidationError') {
      return NextResponse.json(handleMongoError(error), { status: 400 });
    }

    return NextResponse.json(
      errorResponse(
        (error instanceof Error ? error.message : String(error)) || 'Failed to update clinical note',
        'UPDATE_ERROR'
      ),
      { status: 400 }
    );
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
    return NextResponse.json(
      errorResponse('Failed to delete clinical note', 'DELETE_ERROR'),
      { status: 500 }
    );
  }
}

export async function GET(
  req,
  context
) {
  const authResult = await import('@/middleware/auth').then(m => m.authenticate(req));
  if ('error' in authResult) return authResult.error;

  const params = await context.params;
  const authenticatedReq = req;
  authenticatedReq.user = authResult.user;

  return getHandler(authenticatedReq, authResult.user, { params });
}

export async function PUT(
  req,
  context
) {
  const authResult = await import('@/middleware/auth').then(m => m.authenticate(req));
  if ('error' in authResult) return authResult.error;

  const params = await context.params;
  const authenticatedReq = req;
  authenticatedReq.user = authResult.user;

  return putHandler(authenticatedReq, authResult.user, { params });
}

export async function DELETE(
  req,
  context
) {
  const authResult = await import('@/middleware/auth').then(m => m.authenticate(req));
  if ('error' in authResult) return authResult.error;

  const params = await context.params;
  const authenticatedReq = req;
  authenticatedReq.user = authResult.user;

  return deleteHandler(authenticatedReq, authResult.user, { params });
}

