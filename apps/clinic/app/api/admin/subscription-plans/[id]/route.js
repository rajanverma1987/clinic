import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import { updateSubscriptionPlan, getSubscriptionPlanById } from '@/services/subscription.service';
import { PlanBillingCycle, PlanStatus } from '@/models/SubscriptionPlan';

/**
 * GET /api/admin/subscription-plans/[id]
 * Get subscription plan by ID (Admin only)
 */
async function getHandler(req, user, planId) {
    try {
        if (user.role !== 'super_admin') {
            return NextResponse.json(
                errorResponse('Unauthorized', 'UNAUTHORIZED'),
                { status: 403 }
            );
        }

        const plan = await getSubscriptionPlanById(planId);
        if (!plan) {
            return NextResponse.json(
                errorResponse('Subscription plan not found', 'NOT_FOUND'),
                { status: 404 }
            );
        }

        return NextResponse.json(successResponse(plan));
    } catch (error) {
        return NextResponse.json(
            errorResponse((error instanceof Error ? error.message : String(error)) || 'Failed to fetch subscription plan', 'FETCH_ERROR'),
            { status: 400 }
        );
    }
}

/**
 * PUT /api/admin/subscription-plans/[id]
 * Update subscription plan (Admin only)
 */
async function putHandler(req, user, planId) {
    try {
        if (user.role !== 'super_admin') {
            return NextResponse.json(
                errorResponse('Unauthorized', 'UNAUTHORIZED'),
                { status: 403 }
            );
        }

        const body = await req.json();

        const plan = await updateSubscriptionPlan(planId, {
            name: body.name,
            description: body.description,
            price: body.price, // Expected in cents
            currency: body.currency,
            billingCycle: body.billingCycle,
            paypalPlanId: body.paypalPlanId, // Allow updating PayPal Plan ID
            features: body.features || [],
            maxUsers: body.maxUsers,
            maxPatients: body.maxPatients,
            maxStorageGB: body.maxStorageGB,
            isPopular: body.isPopular,
            isHidden: body.isHidden,
            status: body.status,
        });

        if (!plan) {
            return NextResponse.json(
                errorResponse('Subscription plan not found', 'NOT_FOUND'),
                { status: 404 }
            );
        }

        return NextResponse.json(successResponse(plan));
    } catch (error) {
        return NextResponse.json(
            errorResponse((error instanceof Error ? error.message : String(error)) || 'Failed to update subscription plan', 'UPDATE_ERROR'),
            { status: 400 }
        );
    }
}

export async function GET(
    req,
    context
) {
    const authResult = await import('@/middleware/auth').then(m => m.authenticate(req));
    if ('error' in authResult) {
        return authResult.error;
    }

    const params = await context.params;
    const authenticatedReq = req;
    authenticatedReq.user = authResult.user;
    return getHandler(authenticatedReq, authResult.user, params.id);
}

export async function PUT(
    req,
    context
) {
    const authResult = await import('@/middleware/auth').then(m => m.authenticate(req));
    if ('error' in authResult) {
        return authResult.error;
    }

    const params = await context.params;
    const authenticatedReq = req;
    authenticatedReq.user = authResult.user;
    return putHandler(authenticatedReq, authResult.user, params.id);
}

