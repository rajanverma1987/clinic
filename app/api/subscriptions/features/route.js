import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import { getTenantFeatures, getTenantLimits } from '@/lib/features/feature-check';

/**
 * GET /api/subscriptions/features
 * Get tenant's available features and limits
 */
async function getHandler(req, user) {
    try {
        // Super admins have all features
        if (user.role === 'super_admin') {
            return NextResponse.json(
                successResponse({
                    features: [], // Empty means all features
                    limits: {
                        maxUsers: null,
                        maxPatients: null,
                        maxStorageGB: null,
                    },
                })
            );
        }

        const features = await getTenantFeatures(user.tenantId);
        const limits = await getTenantLimits(user.tenantId);

        return NextResponse.json(
            successResponse({
                features,
                limits,
            })
        );
    } catch (error) {
        return NextResponse.json(
            errorResponse((error instanceof Error ? error.message : String(error)) || 'Failed to fetch features', 'FETCH_ERROR'),
            { status: 400 }
        );
    }
}

export async function GET(req) {
    const authResult = await import('@/middleware/auth').then(m => m.authenticate(req));
    if ('error' in authResult) {
        return authResult.error;
    }

    const authenticatedReq = req;
    authenticatedReq.user = authResult.user;
    return getHandler(authenticatedReq, authResult.user);
}

