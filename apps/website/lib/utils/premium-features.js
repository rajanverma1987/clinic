/**
 * Premium Features System
 *
 * This module defines and manages premium features across the application.
 * Features can be enabled/disabled based on user subscription tier.
 */

// Define all premium features
export const PREMIUM_FEATURES = {
  // UI/UX Premium Features
  CUSTOM_PRICING_PAGE: 'custom-pricing-page',
  PREMIUM_THEME: 'premium-theme',
  CUSTOM_BRANDING: 'custom-branding',
  WHITE_LABEL: 'white-label',

  // Analytics & Reporting
  ADVANCED_ANALYTICS: 'advanced-analytics',
  CUSTOM_REPORTS: 'custom-reports',
  EXPORT_REPORTS: 'export-reports',

  // Clinical Features
  TELEMEDICINE: 'telemedicine',
  ADVANCED_PRESCRIPTIONS: 'advanced-prescriptions',
  E_PRESCRIPTIONS: 'e-prescriptions',

  // Management Features
  MULTI_LOCATION: 'multi-location',
  INVENTORY_MANAGEMENT: 'inventory-management',
  APPOINTMENT_REMINDERS: 'appointment-reminders',
  SMS_NOTIFICATIONS: 'sms-notifications',

  // Integration Features
  API_ACCESS: 'api-access',
  THIRD_PARTY_INTEGRATIONS: 'third-party-integrations',
  CUSTOM_WEBHOOKS: 'custom-webhooks',

  // Security & Compliance
  ADVANCED_SECURITY: 'advanced-security',
  AUDIT_LOGS: 'audit-logs',
  TWO_FACTOR_AUTH: 'two-factor-auth',
  SSO: 'sso',
};

// Feature tiers mapping
export const FEATURE_TIERS = {
  FREE: 'free',
  BASIC: 'basic',
  PROFESSIONAL: 'professional',
  ENTERPRISE: 'enterprise',
};

// Map features to minimum required tier
export const FEATURE_TIER_MAP = {
  // Free tier features
  [PREMIUM_FEATURES.CUSTOM_PRICING_PAGE]: FEATURE_TIERS.FREE,

  // Basic tier features
  [PREMIUM_FEATURES.APPOINTMENT_REMINDERS]: FEATURE_TIERS.BASIC,
  [PREMIUM_FEATURES.PREMIUM_THEME]: FEATURE_TIERS.BASIC,

  // Professional tier features
  [PREMIUM_FEATURES.TELEMEDICINE]: FEATURE_TIERS.PROFESSIONAL,
  [PREMIUM_FEATURES.ADVANCED_ANALYTICS]: FEATURE_TIERS.PROFESSIONAL,
  [PREMIUM_FEATURES.CUSTOM_REPORTS]: FEATURE_TIERS.PROFESSIONAL,
  [PREMIUM_FEATURES.EXPORT_REPORTS]: FEATURE_TIERS.PROFESSIONAL,
  [PREMIUM_FEATURES.ADVANCED_PRESCRIPTIONS]: FEATURE_TIERS.PROFESSIONAL,
  [PREMIUM_FEATURES.INVENTORY_MANAGEMENT]: FEATURE_TIERS.PROFESSIONAL,
  [PREMIUM_FEATURES.SMS_NOTIFICATIONS]: FEATURE_TIERS.PROFESSIONAL,

  // Enterprise tier features
  [PREMIUM_FEATURES.WHITE_LABEL]: FEATURE_TIERS.ENTERPRISE,
  [PREMIUM_FEATURES.CUSTOM_BRANDING]: FEATURE_TIERS.ENTERPRISE,
  [PREMIUM_FEATURES.MULTI_LOCATION]: FEATURE_TIERS.ENTERPRISE,
  [PREMIUM_FEATURES.API_ACCESS]: FEATURE_TIERS.ENTERPRISE,
  [PREMIUM_FEATURES.THIRD_PARTY_INTEGRATIONS]: FEATURE_TIERS.ENTERPRISE,
  [PREMIUM_FEATURES.CUSTOM_WEBHOOKS]: FEATURE_TIERS.ENTERPRISE,
  [PREMIUM_FEATURES.ADVANCED_SECURITY]: FEATURE_TIERS.ENTERPRISE,
  [PREMIUM_FEATURES.AUDIT_LOGS]: FEATURE_TIERS.ENTERPRISE,
  [PREMIUM_FEATURES.TWO_FACTOR_AUTH]: FEATURE_TIERS.ENTERPRISE,
  [PREMIUM_FEATURES.SSO]: FEATURE_TIERS.ENTERPRISE,
  [PREMIUM_FEATURES.E_PRESCRIPTIONS]: FEATURE_TIERS.ENTERPRISE,
};

// Tier hierarchy (higher number = higher tier)
const TIER_HIERARCHY = {
  [FEATURE_TIERS.FREE]: 0,
  [FEATURE_TIERS.BASIC]: 1,
  [FEATURE_TIERS.PROFESSIONAL]: 2,
  [FEATURE_TIERS.ENTERPRISE]: 3,
};

/**
 * Check if a user has access to a premium feature
 * @param {string} featureKey - The feature key from PREMIUM_FEATURES
 * @param {object} user - The user object with subscription information
 * @returns {boolean} - Whether the user has access to the feature
 */
export function hasFeatureAccess(featureKey, user) {
  // If no user, only allow free tier features
  if (!user) {
    const requiredTier = FEATURE_TIER_MAP[featureKey];
    return requiredTier === FEATURE_TIERS.FREE;
  }

  // Get user's subscription tier (default to FREE if not specified)
  const userTier = user?.subscription?.tier || user?.subscriptionTier || FEATURE_TIERS.FREE;

  // Get required tier for feature
  const requiredTier = FEATURE_TIER_MAP[featureKey];

  // If feature doesn't have a tier requirement, allow access
  if (!requiredTier) {
    return true;
  }

  // Compare tiers using hierarchy
  const userTierLevel = TIER_HIERARCHY[userTier] || 0;
  const requiredTierLevel = TIER_HIERARCHY[requiredTier] || 0;

  return userTierLevel >= requiredTierLevel;
}

/**
 * Get all features available for a user's tier
 * @param {object} user - The user object with subscription information
 * @returns {string[]} - Array of available feature keys
 */
export function getUserFeatures(user) {
  const userTier = user?.subscription?.tier || user?.subscriptionTier || FEATURE_TIERS.FREE;
  const userTierLevel = TIER_HIERARCHY[userTier] || 0;

  return Object.entries(FEATURE_TIER_MAP)
    .filter(([, requiredTier]) => {
      const requiredTierLevel = TIER_HIERARCHY[requiredTier] || 0;
      return userTierLevel >= requiredTierLevel;
    })
    .map(([featureKey]) => featureKey);
}

/**
 * Get feature display information
 * @param {string} featureKey - The feature key from PREMIUM_FEATURES
 * @returns {object} - Feature information
 */
export function getFeatureInfo(featureKey) {
  const featureInfo = {
    [PREMIUM_FEATURES.CUSTOM_PRICING_PAGE]: {
      name: 'Custom Pricing Page',
      description: 'Access to premium pricing page design with advanced styling',
      icon: '💎',
    },
    [PREMIUM_FEATURES.PREMIUM_THEME]: {
      name: 'Premium Theme',
      description: 'Access to premium theme colors and styling options',
      icon: '🎨',
    },
    [PREMIUM_FEATURES.CUSTOM_BRANDING]: {
      name: 'Custom Branding',
      description: 'Customize colors, logos, and branding across the platform',
      icon: '🏷️',
    },
    [PREMIUM_FEATURES.WHITE_LABEL]: {
      name: 'White Label',
      description: 'Remove all branding and use your own',
      icon: '⚪',
    },
    [PREMIUM_FEATURES.TELEMEDICINE]: {
      name: 'Telemedicine',
      description: 'Video consultations with patients',
      icon: '📹',
    },
    [PREMIUM_FEATURES.ADVANCED_ANALYTICS]: {
      name: 'Advanced Analytics',
      description: 'Detailed insights and custom dashboards',
      icon: '📊',
    },
    [PREMIUM_FEATURES.CUSTOM_REPORTS]: {
      name: 'Custom Reports',
      description: 'Create and save custom reports',
      icon: '📈',
    },
    [PREMIUM_FEATURES.MULTI_LOCATION]: {
      name: 'Multi-Location',
      description: 'Manage multiple clinic locations',
      icon: '🏥',
    },
    [PREMIUM_FEATURES.API_ACCESS]: {
      name: 'API Access',
      description: 'Full REST API access for integrations',
      icon: '🔌',
    },
  };

  return featureInfo[featureKey] || {
    name: featureKey,
    description: 'Premium feature',
    icon: '✨',
  };
}

/**
 * Get upgrade message for a feature
 * @param {string} featureKey - The feature key from PREMIUM_FEATURES
 * @returns {string} - Upgrade message
 */
export function getUpgradeMessage(featureKey) {
  const requiredTier = FEATURE_TIER_MAP[featureKey];
  const tierName = requiredTier?.charAt(0).toUpperCase() + requiredTier?.slice(1);

  return `This feature requires a ${tierName} subscription. Upgrade now to unlock this feature.`;
}

export default {
  PREMIUM_FEATURES,
  FEATURE_TIERS,
  hasFeatureAccess,
  getUserFeatures,
  getFeatureInfo,
  getUpgradeMessage,
};
