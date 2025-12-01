/**
 * Feature Access Checking Service
 * Checks if a tenant has access to specific features based on their subscription
 */

import connectDB from '@/lib/db/connection';
import Subscription from '@/models/Subscription';
import SubscriptionPlan from '@/models/SubscriptionPlan';
import { SubscriptionStatus } from '@/models/Subscription';

/**
 * Get tenant's subscription with plan details
 */
export async function getTenantSubscriptionWithPlan(tenantId: string) {
  await connectDB();
  
  const subscription = await Subscription.findOne({ tenantId })
    .populate('planId')
    .sort({ createdAt: -1 })
    .lean();

  if (!subscription || (subscription as any).status !== SubscriptionStatus.ACTIVE) {
    return null;
  }

  return subscription;
}

/**
 * Get tenant's available features
 */
export async function getTenantFeatures(tenantId: string): Promise<string[]> {
  const subscription = await getTenantSubscriptionWithPlan(tenantId);
  
  if (!subscription || !(subscription as any).planId) {
    return [];
  }

  const plan = (subscription as any).planId;
  return plan.features || [];
}

/**
 * Check if tenant has access to a specific feature
 */
export async function hasFeatureAccess(
  tenantId: string,
  feature: string
): Promise<boolean> {
  const features = await getTenantFeatures(tenantId);
  return features.includes(feature);
}

/**
 * Check if tenant has access to any of the required features
 */
export async function hasAnyFeatureAccess(
  tenantId: string,
  requiredFeatures: string[]
): Promise<boolean> {
  if (requiredFeatures.length === 0) {
    return true; // No features required, allow access
  }

  const tenantFeatures = await getTenantFeatures(tenantId);
  return requiredFeatures.some(feature => tenantFeatures.includes(feature));
}

/**
 * Check if tenant has access to all required features
 */
export async function hasAllFeatureAccess(
  tenantId: string,
  requiredFeatures: string[]
): Promise<boolean> {
  if (requiredFeatures.length === 0) {
    return true; // No features required, allow access
  }

  const tenantFeatures = await getTenantFeatures(tenantId);
  return requiredFeatures.every(feature => tenantFeatures.includes(feature));
}

/**
 * Get tenant's subscription limits
 */
export async function getTenantLimits(tenantId: string) {
  const subscription = await getTenantSubscriptionWithPlan(tenantId);
  
  if (!subscription || !(subscription as any).planId) {
    return {
      maxUsers: null,
      maxPatients: null,
      maxStorageGB: null,
    };
  }

  const plan = (subscription as any).planId;
  return {
    maxUsers: plan.maxUsers || null,
    maxPatients: plan.maxPatients || null,
    maxStorageGB: plan.maxStorageGB || null,
  };
}

