/**
 * Subscription Feature and Limit Checking Service
 */

import connectDB from '@/lib/db/connection';
import Subscription from '@/models/Subscription';
import SubscriptionPlan from '@/models/SubscriptionPlan';
import { SubscriptionStatus } from '@/models/Subscription';
import User from '@/models/User';
import Patient from '@/models/Patient';

export interface SubscriptionCheckResult {
  hasAccess: boolean;
  reason?: string;
  limit?: number;
  current?: number;
}

/**
 * Get tenant's active subscription with plan details
 */
export async function getTenantSubscriptionWithPlan(tenantId: string): Promise<{
  subscription: any;
  plan: any;
} | null> {
  await connectDB();

  const subscription = await Subscription.findOne({
    tenantId,
    status: SubscriptionStatus.ACTIVE,
  })
    .populate('planId')
    .sort({ createdAt: -1 })
    .lean();

  if (!subscription || !(subscription as any).planId) {
    return null;
  }

  return {
    subscription,
    plan: (subscription as any).planId,
  };
}

/**
 * Check if tenant has access to a specific feature
 */
export async function checkFeatureAccess(
  tenantId: string,
  featureName: string
): Promise<SubscriptionCheckResult> {
  const subscriptionData = await getTenantSubscriptionWithPlan(tenantId);

  if (!subscriptionData) {
    return {
      hasAccess: false,
      reason: 'No active subscription found',
    };
  }

  const { plan } = subscriptionData;
  const hasFeature = plan.features && plan.features.includes(featureName);

  if (!hasFeature) {
    return {
      hasAccess: false,
      reason: `Feature "${featureName}" is not included in your subscription plan`,
    };
  }

  return {
    hasAccess: true,
  };
}

/**
 * Check if tenant can create more users
 */
export async function checkUserLimit(tenantId: string): Promise<SubscriptionCheckResult> {
  const subscriptionData = await getTenantSubscriptionWithPlan(tenantId);

  if (!subscriptionData) {
    return {
      hasAccess: false,
      reason: 'No active subscription found',
    };
  }

  const { plan } = subscriptionData;

  // If no limit set, allow unlimited
  if (!plan.maxUsers) {
    return {
      hasAccess: true,
    };
  }

  await connectDB();
  const currentUserCount = await User.countDocuments({
    tenantId,
    isActive: true,
  });

  if (currentUserCount >= plan.maxUsers) {
    return {
      hasAccess: false,
      reason: `User limit reached. Maximum ${plan.maxUsers} users allowed in your plan`,
      limit: plan.maxUsers,
      current: currentUserCount,
    };
  }

  return {
    hasAccess: true,
    limit: plan.maxUsers,
    current: currentUserCount,
  };
}

/**
 * Check if tenant can create more patients
 */
export async function checkPatientLimit(tenantId: string): Promise<SubscriptionCheckResult> {
  const subscriptionData = await getTenantSubscriptionWithPlan(tenantId);

  if (!subscriptionData) {
    return {
      hasAccess: false,
      reason: 'No active subscription found',
    };
  }

  const { plan } = subscriptionData;

  // If no limit set, allow unlimited
  if (!plan.maxPatients) {
    return {
      hasAccess: true,
    };
  }

  await connectDB();
  const currentPatientCount = await Patient.countDocuments({
    tenantId,
    deletedAt: null,
  });

  if (currentPatientCount >= plan.maxPatients) {
    return {
      hasAccess: false,
      reason: `Patient limit reached. Maximum ${plan.maxPatients.toLocaleString()} patients allowed in your plan`,
      limit: plan.maxPatients,
      current: currentPatientCount,
    };
  }

  return {
    hasAccess: true,
    limit: plan.maxPatients,
    current: currentPatientCount,
  };
}

/**
 * Check if tenant has access to a module (based on feature list)
 */
export async function checkModuleAccess(
  tenantId: string,
  moduleName: string
): Promise<SubscriptionCheckResult> {
  // Map module names to feature names
  const moduleToFeatureMap: Record<string, string> = {
    patients: 'Patient Management',
    appointments: 'Appointment Scheduling',
    queue: 'Queue Management',
    prescriptions: 'Prescriptions Management',
    invoices: 'Invoice & Billing',
    inventory: 'Inventory Management',
    reports: 'Reports & Analytics',
    'advanced-reports': 'Advanced Reports & Analytics',
    telemedicine: 'Telemedicine',
    'multi-location': 'Multi-Location Support',
    'api-access': 'API Access',
    'custom-branding': 'Custom Branding',
    'data-export': 'Data Export',
    'audit-logs': 'Audit Logs',
  };

  const featureName = moduleToFeatureMap[moduleName.toLowerCase()] || moduleName;

  return await checkFeatureAccess(tenantId, featureName);
}

/**
 * Get tenant's subscription limits summary
 */
export async function getTenantLimits(tenantId: string): Promise<{
  features: string[];
  maxUsers?: number;
  maxPatients?: number;
  maxStorageGB?: number;
  currentUsers: number;
  currentPatients: number;
} | null> {
  const subscriptionData = await getTenantSubscriptionWithPlan(tenantId);

  if (!subscriptionData) {
    return null;
  }

  await connectDB();
  const currentUserCount = await User.countDocuments({
    tenantId,
    isActive: true,
  });

  const currentPatientCount = await Patient.countDocuments({
    tenantId,
    deletedAt: null,
  });

  const { plan } = subscriptionData;

  return {
    features: plan.features || [],
    maxUsers: plan.maxUsers,
    maxPatients: plan.maxPatients,
    maxStorageGB: plan.maxStorageGB,
    currentUsers: currentUserCount,
    currentPatients: currentPatientCount,
  };
}

