import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/middleware/auth';
import { createClinicalNoteSchema, clinicalNoteQuerySchema } from '@/lib/validations/clinical-note';
import {
  createClinicalNote,
  listClinicalNotes,
} from '@/services/clinical-note.service';
import { successResponse, errorResponse, handleMongoError, validationErrorResponse } from '@/lib/utils/api-response';

/**
 * GET /api/clinical-notes
 * List clinical notes with pagination and filters
 */
async function getHandler(req: AuthenticatedRequest, user: any) {
  try {
    const { searchParams } = new URL(req.url);

    const queryParams = {
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
      patientId: searchParams.get('patientId') || undefined,
      doctorId: searchParams.get('doctorId') || undefined,
      appointmentId: searchParams.get('appointmentId') || undefined,
      type: searchParams.get('type') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      isActive: searchParams.get('isActive') || undefined,
    };

    const validationResult = clinicalNoteQuerySchema.safeParse(queryParams);
    if (!validationResult.success) {
      return NextResponse.json(
        validationErrorResponse(validationResult.error.errors),
        { status: 400 }
      );
    }

    const result = await listClinicalNotes(validationResult.data, user.tenantId, user.userId);

    return NextResponse.json(successResponse(result));
  } catch (error: any) {
    if (error.name === 'MongoError' || error.name === 'ValidationError') {
      return NextResponse.json(handleMongoError(error), { status: 400 });
    }

    return NextResponse.json(
      errorResponse('Failed to fetch clinical notes', 'INTERNAL_ERROR'),
      { status: 500 }
    );
  }
}

/**
 * POST /api/clinical-notes
 * Create a new clinical note
 */
async function postHandler(req: AuthenticatedRequest, user: any) {
  try {
    const body = await req.json();

    const validationResult = createClinicalNoteSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        validationErrorResponse(validationResult.error.errors),
        { status: 400 }
      );
    }

    const note = await createClinicalNote(validationResult.data, user.tenantId, user.userId);

    return NextResponse.json(
      successResponse({
        id: note._id.toString(),
        patientId: note.patientId.toString(),
        doctorId: note.doctorId.toString(),
        type: note.type,
        title: note.title,
        version: note.version,
        createdAt: note.createdAt,
      }),
      { status: 201 }
    );
  } catch (error: any) {
    if (error.name === 'MongoError' || error.name === 'ValidationError') {
      return NextResponse.json(handleMongoError(error), { status: 400 });
    }

    return NextResponse.json(
      errorResponse(
        error.message || 'Failed to create clinical note',
        'CREATE_ERROR'
      ),
      { status: 400 }
    );
  }
}

export const GET = withAuth(getHandler);
export const POST = withAuth(postHandler);

