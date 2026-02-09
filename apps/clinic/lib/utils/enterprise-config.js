/**
 * Enterprise Configuration
 * 
 * Centralized configuration for enterprise features and patterns.
 * Provides consistent configuration across all enterprise utilities.
 * 
 * @module lib/utils/enterprise-config
 * @since 1.0.0
 */

/**
 * Enterprise feature configuration
 */
export const EnterpriseConfig = {
  /**
   * Logging configuration
   */
  logging: {
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'WARN' : 'DEBUG'),
    enableCorrelationId: true,
    enablePerformanceTracking: true,
    enableErrorTracking: process.env.SENTRY_DSN ? true : false,
  },

  /**
   * Caching configuration
   */
  caching: {
    enabled: process.env.REDIS_URL ? true : false,
    defaultTTL: 300, // 5 minutes
    cachePrefix: 'clinic',
    enableMetrics: true,
  },

  /**
   * Retry configuration
   */
  retry: {
    defaultMaxAttempts: 3,
    defaultInitialDelay: 100, // ms
    defaultMaxDelay: 5000, // ms
    defaultBackoffMultiplier: 2,
  },

  /**
   * Circuit breaker configuration
   */
  circuitBreaker: {
    defaultFailureThreshold: 5,
    defaultResetTimeout: 60000, // 1 minute
    defaultTimeout: 30000, // 30 seconds
  },

  /**
   * Database configuration
   */
  database: {
    enableQueryTracking: true,
    slowQueryThreshold: 1000, // ms
    enableMetrics: true,
    useLean: true,
  },

  /**
   * API configuration
   */
  api: {
    enableVersioning: true,
    defaultVersion: 'v1',
    enableRequestLogging: true,
    enableResponseLogging: true,
    slowRequestThreshold: 2000, // ms
  },

  /**
   * Monitoring configuration
   */
  monitoring: {
    enableMetrics: true,
    enableHealthChecks: true,
    metricsRetention: 1000, // samples
  },

  /**
   * Security configuration
   */
  security: {
    sanitizeLogs: true,
    sensitiveFields: ['password', 'token', 'secret', 'key', 'authorization', 'ssn', 'creditCard'],
    enableAuditLogging: true,
  },
};

/**
 * Get configuration value with fallback
 * 
 * @function getConfig
 * @param {string} path - Dot-separated path to config (e.g., 'logging.level')
 * @param {*} defaultValue - Default value if not found
 * @returns {*} Configuration value or default
 * 
 * @example
 * const logLevel = getConfig('logging.level', 'INFO');
 */
export function getConfig(path, defaultValue = null) {
  const keys = path.split('.');
  let value = EnterpriseConfig;
  
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      return defaultValue;
    }
  }
  
  return value !== undefined ? value : defaultValue;
}

/**
 * Check if enterprise feature is enabled
 * 
 * @function isFeatureEnabled
 * @param {string} feature - Feature name
 * @returns {boolean} Whether feature is enabled
 * 
 * @example
 * if (isFeatureEnabled('caching')) {
 *   // Use cache
 * }
 */
export function isFeatureEnabled(feature) {
  const featureMap = {
    caching: EnterpriseConfig.caching.enabled,
    errorTracking: EnterpriseConfig.logging.enableErrorTracking,
    metrics: EnterpriseConfig.monitoring.enableMetrics,
    requestLogging: EnterpriseConfig.api.enableRequestLogging,
    auditLogging: EnterpriseConfig.security.enableAuditLogging,
  };
  
  return featureMap[feature] || false;
}
