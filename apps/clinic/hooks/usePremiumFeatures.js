/**
 * React Hook for Premium Features
 *
 * Provides easy access to premium features functionality in React components
 */

import { useAuth } from '@/contexts/AuthContext';
import {
  PREMIUM_FEATURES,
  FEATURE_TIERS,
  hasFeatureAccess,
  getUserFeatures,
  getFeatureInfo,
  getUpgradeMessage,
} from '@/lib/utils/premium-features';

/**
 * Hook to check premium feature access
 * @returns {object} - Premium features utilities
 */
export function usePremiumFeatures() {
  const { user } = useAuth();

  /**
   * Check if user has access to a specific feature
   * @param {string} featureKey - Feature key from PREMIUM_FEATURES
   * @returns {boolean}
   */
  const hasAccess = (featureKey) => {
    return hasFeatureAccess(featureKey, user);
  };

  /**
   * Get all features available to the current user
   * @returns {string[]}
   */
  const getAvailableFeatures = () => {
    return getUserFeatures(user);
  };

  /**
   * Get user's current tier
   * @returns {string}
   */
  const getCurrentTier = () => {
    return user?.subscription?.tier || user?.subscriptionTier || FEATURE_TIERS.FREE;
  };

  /**
   * Check if user is on a specific tier or higher
   * @param {string} tier - Tier to check
   * @returns {boolean}
   */
  const isAtLeastTier = (tier) => {
    const tierHierarchy = {
      [FEATURE_TIERS.FREE]: 0,
      [FEATURE_TIERS.BASIC]: 1,
      [FEATURE_TIERS.PROFESSIONAL]: 2,
      [FEATURE_TIERS.ENTERPRISE]: 3,
    };

    const currentTierLevel = tierHierarchy[getCurrentTier()] || 0;
    const requiredTierLevel = tierHierarchy[tier] || 0;

    return currentTierLevel >= requiredTierLevel;
  };

  return {
    // Feature access
    hasAccess,
    getAvailableFeatures,

    // Tier information
    getCurrentTier,
    isAtLeastTier,
    TIERS: FEATURE_TIERS,

    // Feature information
    getFeatureInfo,
    getUpgradeMessage,

    // Feature constants
    FEATURES: PREMIUM_FEATURES,

    // User info
    user,
  };
}

export default usePremiumFeatures;
