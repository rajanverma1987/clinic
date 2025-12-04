import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import { createPayPalPlan } from '@/services/paypal.service';

/**
 * POST /api/admin/subscription-plans/create-paypal-plan
 * Create PayPal billing plan on-the-fly
 * Admin only
 */
async function postHandler(req, user) {
    try {
        if (user.role !== 'super_admin') {
            return NextResponse.json(
                errorResponse('Unauthorized', 'UNAUTHORIZED'),
                { status: 403 }
            );
        }

        const body = await req.json();

        // Validate required fields
        if (!body.name || !body.price || !body.currency || !body.billingCycle) {
            return NextResponse.json(
                errorResponse('Missing required fields: name, price, currency, billingCycle', 'VALIDATION_ERROR'),
                { status: 400 }
            );
        }

        // Create PayPal plan
        const paypalPlanId = await createPayPalPlan(
            body.name,
            body.description || `${body.name} subscription plan`,
            body.price, // In dollars
            body.currency,
            body.billingCycle
        );

        return NextResponse.json(
            successResponse({
                paypalPlanId,
                message: 'PayPal billing plan created successfully',
            })
        );
    } catch (error) {
        console.error('Failed to create PayPal plan:', error);
        return NextResponse.json(
            errorResponse(
                (error instanceof Error ? error.message : String(error)) || 'Failed to create PayPal plan. Check PayPal credentials.',
                'PAYPAL_ERROR'
            ),
            { status: 400 }
        );
    }
}

export const POST = withAuth(postHandler);

