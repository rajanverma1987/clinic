/**
 * Query Optimization Utilities
 * Helper functions for optimizing database queries
 */

/**
 * Add common query optimizations to a query
 * @param {Query} query - Mongoose query
 * @param {Object} options - Optimization options
 * @returns {Query} - Optimized query
 */
export function optimizeQuery(query, options = {}) {
  const {
    useLean = true,
    select = null,
    limit = null,
    sort = null,
  } = options;

  // Use lean() for read-only queries (faster, less memory)
  if (useLean) {
    query.lean();
  }

  // Select only needed fields
  if (select) {
    query.select(select);
  }

  // Add limit to prevent large result sets
  if (limit) {
    query.limit(limit);
  }

  // Add default sort if provided
  if (sort) {
    query.sort(sort);
  }

  return query;
}

/**
 * Get pagination-safe limit (max 50 items per page)
 * @param {number} requestedLimit - Requested limit
 * @param {number} maxLimit - Maximum allowed limit (default 50)
 * @returns {number} - Safe limit value
 */
export function getSafeLimit(requestedLimit, maxLimit = 50) {
  const limit = parseInt(requestedLimit, 10) || 10;
  return Math.min(limit, maxLimit);
}

/**
 * Build efficient date range filter
 * @param {Date|string} startDate - Start date
 * @param {Date|string} endDate - End date
 * @returns {Object} - MongoDB date filter
 */
export function buildDateRangeFilter(startDate, endDate) {
  const filter = {};
  
  if (startDate || endDate) {
    filter.$gte = startDate ? new Date(startDate) : new Date(0);
    filter.$lte = endDate ? new Date(endDate) : new Date();
  }
  
  return Object.keys(filter).length > 0 ? filter : undefined;
}

/**
 * Check if query should use index
 * @param {Object} filter - Query filter
 * @param {Array} indexedFields - List of indexed field combinations
 * @returns {boolean} - True if filter matches index
 */
export function canUseIndex(filter, indexedFields) {
  const filterKeys = Object.keys(filter).sort();
  
  return indexedFields.some((indexFields) => {
    const indexKeys = indexFields.map((f) => f.replace(/^-/, '')).sort();
    return filterKeys.every((key) => indexKeys.includes(key));
  });
}
