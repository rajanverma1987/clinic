import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import connectDB from '@/lib/db/connection';
import Tenant from '@/models/Tenant';
import Subscription from '@/models/Subscription';
import { SubscriptionStatus } from '@/models/Subscription';

/**
 * GET /api/admin/clients
 * List all clients (tenants) with subscription info (Admin only)
 */
async function getHandler(req, user) {
    try {
        // Check if user is super admin
        if (user.role !== 'super_admin') {
            return NextResponse.json(
                errorResponse('Unauthorized', 'UNAUTHORIZED'),
                { status: 403 }
            );
        }

        await connectDB();

        const tenants = await Tenant.find()
            .select('name slug region isActive createdAt updatedAt')
            .sort({ createdAt: -1 })
            .lean();

        // Get subscription info for each tenant
        const tenantsWithSubscriptions = await Promise.all(
            tenants.map(async (tenant) => {
                const subscription = await Subscription.findOne({ tenantId: tenant._id })
                    .populate('planId', '_id name price billingCycle')
                    .sort({ createdAt: -1 })
                    .lean();

                return {
                    ...tenant,
                    subscription: subscription || null,
                };
            })
        );

        return NextResponse.json(successResponse(tenantsWithSubscriptions));
    } catch (error) {
        return NextResponse.json(
            errorResponse((error instanceof Error ? error.message : String(error)) || 'Failed to fetch clients', 'FETCH_ERROR'),
            { status: 400 }
        );
    }
}

export const GET = withAuth(getHandler);

