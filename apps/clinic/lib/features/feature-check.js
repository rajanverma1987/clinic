/**
 * Feature Access Checking Service
 * Checks if a tenant has access to specific features based on their subscription
 */

import connectDB from '@/lib/db/connection.js';
import Subscription from '@/models/Subscription.js';
import SubscriptionPlan from '@/models/SubscriptionPlan.js';

/**
 * Get tenant's subscription with plan details
 */
export async function getTenantSubscriptionWithPlan(tenantId) {
  await connectDB();
  
  const subscription = await Subscription.findOne({ tenantId })
    .populate('planId')
    .sort({ createdAt: -1 })
    .lean();

  if (!subscription || subscription.status !== 'ACTIVE') {
    return null;
  }

  return subscription;
}

/**
 * Get tenant's available features
 */
export async function getTenantFeatures(tenantId) {
  const subscription = await getTenantSubscriptionWithPlan(tenantId);
  
  if (!subscription || !subscription.planId) {
    return [];
  }

  const plan = subscription.planId;
  return plan.features || [];
}

/**
 * Check if tenant has access to a specific feature
 */
export async function hasFeatureAccess(tenantId, feature) {
  const features = await getTenantFeatures(tenantId);
  return features.includes(feature);
}

/**
 * Check if tenant has access to any of the required features
 */
export async function hasAnyFeatureAccess(tenantId, requiredFeatures) {
  if (requiredFeatures.length === 0) {
    return true; // No features required, allow access
  }

  const tenantFeatures = await getTenantFeatures(tenantId);
  return requiredFeatures.some(feature => tenantFeatures.includes(feature));
}

/**
 * Check if tenant has access to all required features
 */
export async function hasAllFeatureAccess(tenantId, requiredFeatures) {
  if (requiredFeatures.length === 0) {
    return true; // No features required, allow access
  }

  const tenantFeatures = await getTenantFeatures(tenantId);
  return requiredFeatures.every(feature => tenantFeatures.includes(feature));
}

/**
 * Get tenant's subscription limits
 */
export async function getTenantLimits(tenantId) {
  const subscription = await getTenantSubscriptionWithPlan(tenantId);
  
  if (!subscription || !subscription.planId) {
    return {
      maxUsers: null,
      maxPatients: null,
      maxStorageGB: null,
    };
  }

  const plan = subscription.planId;
  return {
    maxUsers: plan.maxUsers || null,
    maxPatients: plan.maxPatients || null,
    maxStorageGB: plan.maxStorageGB || null,
  };
}

