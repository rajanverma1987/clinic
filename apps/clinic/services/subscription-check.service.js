/**
 * Subscription Feature and Limit Checking Service
 */

import connectDB from '@/lib/db/connection.js';
import Subscription from '@/models/Subscription.js';
import SubscriptionPlan from '@/models/SubscriptionPlan.js';
import { SubscriptionStatus } from '@/models/Subscription.js';
import User from '@/models/User.js';
import Patient from '@/models/Patient.js';

/**
 * Get tenant's active subscription with plan details
 */
export async function getTenantSubscriptionWithPlan(tenantId) {
  await connectDB();

  const subscription = await Subscription.findOne({
    tenantId,
    status: SubscriptionStatus.ACTIVE,
  })
    .populate('planId')
    .sort({ createdAt: -1 })
    .lean();

  if (!subscription || !subscription.planId) {
    return null;
  }

  return {
    subscription,
    plan: subscription.planId,
  };
}

/**
 * Check if tenant has access to a specific feature
 */
export async function checkFeatureAccess(tenantId, featureName) {
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
export async function checkUserLimit(tenantId) {
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
export async function checkPatientLimit(tenantId) {
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
export async function checkModuleAccess(tenantId, moduleName) {
  // Map module names to feature names
  const moduleToFeatureMap = {
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
export async function getTenantLimits(tenantId) {
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

