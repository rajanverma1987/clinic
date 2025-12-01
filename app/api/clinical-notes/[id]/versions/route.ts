import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/middleware/auth';
import { getNoteVersionHistory } from '@/services/clinical-note.service';
import { successResponse, errorResponse } from '@/lib/utils/api-response';

/**
 * GET /api/clinical-notes/:id/versions
 * Get version history of a clinical note
 */
async function getHandler(
  req: AuthenticatedRequest,
  user: any,
  { params }: { params: { id: string } }
) {
  try {
    const versions = await getNoteVersionHistory(params.id, user.tenantId, user.userId);

    return NextResponse.json(
      successResponse({
        noteId: params.id,
        versions: versions.map((v) => ({
          id: v._id.toString(),
          version: v.version,
          createdAt: v.createdAt,
          updatedAt: v.updatedAt,
          doctorId: v.doctorId.toString(),
        })),
      })
    );
  } catch (error: any) {
    return NextResponse.json(
      errorResponse('Failed to fetch version history', 'INTERNAL_ERROR'),
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await import('@/middleware/auth').then(m => m.authenticate(req));
  if ('error' in authResult) return authResult.error;

  const params = await context.params;
  const authenticatedReq = req as AuthenticatedRequest;
  authenticatedReq.user = authResult.user;

  return getHandler(authenticatedReq, authResult.user, { params });
}

