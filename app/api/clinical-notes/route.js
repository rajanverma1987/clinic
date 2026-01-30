import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { RESOURCES, ACTIONS } from '@/lib/permissions/constants';
import { createClinicalNoteSchema, clinicalNoteQuerySchema } from '@/lib/validations/clinical-note';
import {
  createClinicalNote,
  listClinicalNotes,
} from '@/services/clinical-note.service';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/utils/api-response';

/**
 * GET /api/clinical-notes
 * List clinical notes with pagination and filters
 */
async function getHandler(req, user) {
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
  } catch (error) {
    // Error handling is done by withErrorHandler middleware
    throw error;
  }
}

/**
 * POST /api/clinical-notes
 * Create a new clinical note
 */
async function postHandler(req, user) {
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
  } catch (error) {
    // Error handling is done by withErrorHandler middleware
    throw error;
  }
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

