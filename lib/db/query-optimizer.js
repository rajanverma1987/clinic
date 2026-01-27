/**
 * Enterprise Database Query Optimizer
 * Provides optimized query patterns and utilities
 */

import { logger } from '@/lib/utils/logger.js';
import { measureTime } from '@/lib/utils/enterprise-helpers.js';
import { recordDatabaseQuery } from '@/lib/monitoring/metrics.js';

/**
 * Optimize query with enterprise patterns
 */
export function optimizeQuery(query, options = {}) {
  const {
    useLean = true,
    select = null,
    limit = null,
    sort = null,
    populate = null,
    explain = false,
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
  
  // Add populate if provided
  if (populate) {
    if (Array.isArray(populate)) {
      populate.forEach(pop => query.populate(pop));
    } else {
      query.populate(populate);
    }
  }
  
  // Explain query in development
  if (explain && process.env.NODE_ENV === 'development') {
    query.explain();
  }
  
  return query;
}

/**
 * Execute query with performance tracking
 */
export async function executeQuery(collection, operation, queryFn, options = {}) {
  const { logSlowQueries = true, slowQueryThreshold = 1000 } = options;
  
  return await measureTime(`db.${collection}.${operation}`, async () => {
    const startTime = Date.now();
    
    try {
      const result = await queryFn();
      const duration = Date.now() - startTime;
      
      // Record metrics
      recordDatabaseQuery(collection, duration, true);
      
      // Log slow queries
      if (logSlowQueries && duration > slowQueryThreshold) {
        logger.warn('Slow database query detected', {
          collection,
          operation,
          duration,
        });
      }
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      recordDatabaseQuery(collection, duration, false);
      logger.error('Database query failed', error, {
        collection,
        operation,
        duration,
      });
      throw error;
    }
  });
}

/**
 * Batch query executor with concurrency control
 */
export async function batchQuery(queries, concurrency = 5) {
  const results = [];
  
  for (let i = 0; i < queries.length; i += concurrency) {
    const batch = queries.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(query => query())
    );
    results.push(...batchResults);
  }
  
  return results;
}

/**
 * Pagination helper with optimized count
 */
export async function paginatedQuery(
  model,
  filter,
  options = {}
) {
  const {
    page = 1,
    limit = 10,
    sort = { createdAt: -1 },
    select = null,
    populate = null,
  } = options;
  
  const skip = (page - 1) * limit;
  
  // Execute count and query in parallel
  const [total, items] = await Promise.all([
    model.countDocuments(filter),
    optimizeQuery(
      model.find(filter),
      { useLean: true, select, sort, limit, populate }
    ),
  ]);
  
  return {
    items,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  };
}

/**
 * Aggregation pipeline builder
 */
export function buildAggregationPipeline(stages) {
  return stages.filter(stage => stage !== null && stage !== undefined);
}

/**
 * Common aggregation patterns
 */
export const AggregationPatterns = {
  /**
   * Group by date with time series
   */
  groupByDate: (dateField = 'createdAt', groupBy = 'day') => {
    const format = {
      day: { $dateToString: { format: '%Y-%m-%d', date: `$${dateField}` } },
      month: { $dateToString: { format: '%Y-%m', date: `$${dateField}` } },
      year: { $dateToString: { format: '%Y', date: `$${dateField}` } },
    };
    
    return [
      {
        $group: {
          _id: format[groupBy] || format.day,
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ];
  },
  
  /**
   * Calculate statistics
   */
  calculateStats: (field) => [
    {
      $group: {
        _id: null,
        count: { $sum: 1 },
        sum: { $sum: `$${field}` },
        avg: { $avg: `$${field}` },
        min: { $min: `$${field}` },
        max: { $max: `$${field}` },
      },
    },
  ],
};
