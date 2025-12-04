import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import {
    createSubscription,
    getTenantSubscription,
    listSubscriptions,
} from '@/services/subscription.service';

/**
 * GET /api/subscriptions
 * Get current tenant's subscription or list all (admin)
 */
async function getHandler(req, user) {
    try {
        // If super admin, list all subscriptions
        if (user.role === 'super_admin') {
            const subscriptions = await listSubscriptions();
            return NextResponse.json(successResponse(subscriptions));
        }

        // Otherwise, get tenant's subscription
        const subscription = await getTenantSubscription(user.tenantId);
        return NextResponse.json(successResponse(subscription));
    } catch (error) {
        return NextResponse.json(
            errorResponse((error instanceof Error ? error.message : String(error)) || 'Failed to fetch subscription', 'FETCH_ERROR'),
            { status: 400 }
        );
    }
}

/**
 * POST /api/subscriptions
 * Create subscription for tenant
 */
async function postHandler(req, user) {
    try {
        const body = await req.json();

        const result = await createSubscription(
            user.tenantId,
            body.planId,
            user.userId,
            body.customerEmail,
            body.customerName
        );

        return NextResponse.json(successResponse(result), { status: 201 });
    } catch (error) {
        return NextResponse.json(
            errorResponse((error instanceof Error ? error.message : String(error)) || 'Failed to create subscription', 'CREATE_ERROR'),
            { status: 400 }
        );
    }
}

export const GET = withAuth(getHandler);
export const POST = withAuth(postHandler);

