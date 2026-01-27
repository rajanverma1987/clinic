import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { RESOURCES, ACTIONS } from '@/lib/permissions/constants';
import { getNoteVersionHistory } from '@/services/clinical-note.service';
import { successResponse, errorResponse } from '@/lib/utils/api-response';

/**
 * GET /api/clinical-notes/:id/versions
 * Get version history of a clinical note
 */
async function getHandler(
    req,
    user,
    { params }
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

