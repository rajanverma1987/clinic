import { errorResponse, successResponse } from '@/lib/utils/api-response';
import { withAuth } from '@/middleware/auth';
import { NextResponse } from 'next/server';

/**
 * GET /api/prescriptions/check-interactions
 * Stub for drug interaction and allergy conflict checking (Phase 3.4).
 * Query: drugIds=id1,id2&patientId=...
 * Returns { interactions: [], allergyWarnings: [] }.
 * Real implementation would call an external drug database or in-house rules.
 */
async function getHandler(req, user) {
  try {
    const { searchParams } = new URL(req.url);
    const drugIds = searchParams.get('drugIds')?.split(',').filter(Boolean) || [];
    const patientId = searchParams.get('patientId') || '';

    // Stub: no external API yet. Return empty arrays.
    // Allergy checks can be done client-side using patient.allergies vs drug names.
    const result = {
      interactions: [],
      allergyWarnings: [],
    };

    return NextResponse.json(successResponse(result));
  } catch (error) {
    return NextResponse.json(errorResponse('Failed to check interactions', 'INTERNAL_ERROR'), {
      status: 500,
    });
  }
}

export const GET = withAuth(getHandler);
