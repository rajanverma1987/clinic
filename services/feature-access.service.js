/**
 * Feature Access Control Service
 * Checks if a tenant has access to specific features based on their subscription
 */

import connectDB from '@/lib/db/connection.js';
import Subscription from '@/models/Subscription.js';
import SubscriptionPlan from '@/models/SubscriptionPlan.js';
import { SubscriptionStatus } from '@/models/Subscription.js';

/**
 * Feature mapping - maps feature names to application modules/pages
 */
export const FEATURE_MAPPING = {
  'Patient Management': ['/patients', '/api/patients'],
  'Appointment Scheduling': ['/appointments', '/api/appointments'],
  'Queue Management': ['/queue', '/api/queue'],
  'Prescriptions Management': ['/prescriptions', '/api/prescriptions'],
  'Invoice & Billing': ['/invoices', '/api/invoices', '/api/payments'],
  'Inventory Management': ['/inventory', '/api/inventory'],
  'Reports & Analytics': ['/reports', '/api/reports'],
  'Advanced Reports & Analytics': ['/reports', '/api/reports'],
  'Multi-Location Support': ['multi-location'],
  'Telemedicine': ['telemedicine'],
  'API Access': ['api-access'],
  'Custom Branding': ['custom-branding'],
  'Data Export': ['data-export'],
  'Audit Logs': ['audit-logs'],
};

/**
 * Get tenant's subscription features
 */
export async function getTenantFeatures(tenantId) {
  await connectDB();

  const subscription = await Subscription.findOne({ tenantId })
    .populate('planId', 'features')
    .sort({ createdAt: -1 })
    .lean();

  // If no subscription or subscription is not active, return empty array
  if (!subscription || subscription.status !== SubscriptionStatus.ACTIVE) {
    return [];
  }

  const plan = subscription.planId;
  return plan?.features || [];
}

/**
 * Check if tenant has access to a specific feature
 */
export async function hasFeatureAccess(tenantId, featureName) {
  const features = await getTenantFeatures(tenantId);
  return features.includes(featureName);
}

/**
 * Check if tenant has access to any of the provided features
 */
export async function hasAnyFeatureAccess(tenantId, featureNames) {
  const features = await getTenantFeatures(tenantId);
  return featureNames.some(feature => features.includes(feature));
}

/**
 * Check if tenant has access to all of the provided features
 */
export async function hasAllFeatureAccess(tenantId, featureNames) {
  const features = await getTenantFeatures(tenantId);
  return featureNames.every(feature => features.includes(feature));
}

/**
 * Get feature limits for a tenant (maxUsers, maxPatients, maxStorageGB)
 */
export async function getTenantLimits(tenantId) {
  await connectDB();

  const subscription = await Subscription.findOne({ tenantId })
    .populate('planId', 'maxUsers maxPatients maxStorageGB')
    .sort({ createdAt: -1 })
    .lean();

  if (!subscription || subscription.status !== SubscriptionStatus.ACTIVE) {
    return {};
  }

  const plan = subscription.planId;
  return {
    maxUsers: plan?.maxUsers,
    maxPatients: plan?.maxPatients,
    maxStorageGB: plan?.maxStorageGB,
  };
}

/**
 * Check if tenant can perform action based on limits
 */
export async function checkLimit(tenantId, limitType, currentCount) {
  const limits = await getTenantLimits(tenantId);

  let limit;
  switch (limitType) {
    case 'users':
      limit = limits.maxUsers;
      break;
    case 'patients':
      limit = limits.maxPatients;
      break;
    case 'storage':
      limit = limits.maxStorageGB;
      break;
  }

  // If no limit is set, allow unlimited
  if (limit === undefined) {
    return { allowed: true };
  }

  return {
    allowed: currentCount < limit,
    limit,
  };
}

