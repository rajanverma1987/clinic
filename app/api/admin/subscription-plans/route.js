import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import {
  createSubscriptionPlan,
  listSubscriptionPlans,
} from '@/services/subscription.service';
import { PlanBillingCycle } from '@/models/SubscriptionPlan';

/**
 * GET /api/admin/subscription-plans
 * List all subscription plans (Admin only)
 */
async function getHandler(req, user) {
  try {
    // Check if user is super admin (you may need to add this check)
    if (user.role !== 'super_admin') {
      return NextResponse.json(
        errorResponse('Unauthorized', 'UNAUTHORIZED'),
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;

    const plans = await listSubscriptionPlans(status);
    return NextResponse.json(successResponse(plans));
  } catch (error) {
    return NextResponse.json(
      errorResponse((error instanceof Error ? error.message : String(error)) || 'Failed to fetch subscription plans', 'FETCH_ERROR'),
      { status: 400 }
    );
  }
}

/**
 * POST /api/admin/subscription-plans
 * Create subscription plan (Admin only)
 */
async function postHandler(req, user) {
  try {
    // Check if user is super admin
    if (user.role !== 'super_admin') {
      return NextResponse.json(
        errorResponse('Unauthorized', 'UNAUTHORIZED'),
        { status: 403 }
      );
    }

    const body = await req.json();

    const plan = await createSubscriptionPlan({
      name: body.name,
      description: body.description,
      price: body.price, // Expected in cents
      currency: body.currency || 'USD',
      billingCycle: body.billingCycle,
      paypalPlanId: body.paypalPlanId, // Use provided PayPal Plan ID if available
      features: body.features || [],
      maxUsers: body.maxUsers,
      maxPatients: body.maxPatients,
      maxStorageGB: body.maxStorageGB,
      isPopular: body.isPopular || false,
      isHidden: body.isHidden || false,
    });

    return NextResponse.json(successResponse(plan), { status: 201 });
  } catch (error) {
    return NextResponse.json(
      errorResponse((error instanceof Error ? error.message : String(error)) || 'Failed to create subscription plan', 'CREATE_ERROR'),
      { status: 400 }
    );
  }
}

export const GET = withAuth(getHandler);
export const POST = withAuth(postHandler);

