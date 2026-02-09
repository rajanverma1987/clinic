/**
 * Search Service
 * Provides full-text search across all entities using ElasticSearch
 * Based on NEW-PLANS.md requirements
 */

import { getElasticsearchClient, ensureIndex } from './elasticsearch-client.js';
import { logger } from '@/lib/utils/logger.js';

const INDEX_PREFIX = 'clinic';

/**
 * Index mappings for different entity types
 */
const INDEX_MAPPINGS = {
  patients: {
    properties: {
      patientId: { type: 'keyword' },
      firstName: { type: 'text', analyzer: 'standard' },
      lastName: { type: 'text', analyzer: 'standard' },
      email: { type: 'keyword' },
      phone: { type: 'keyword' },
      tenantId: { type: 'keyword' },
      createdAt: { type: 'date' },
    },
  },
  appointments: {
    properties: {
      appointmentNumber: { type: 'keyword' },
      patientId: { type: 'keyword' },
      doctorId: { type: 'keyword' },
      status: { type: 'keyword' },
      type: { type: 'keyword' },
      tenantId: { type: 'keyword' },
      appointmentDate: { type: 'date' },
    },
  },
  prescriptions: {
    properties: {
      prescriptionNumber: { type: 'keyword' },
      patientId: { type: 'keyword' },
      doctorId: { type: 'keyword' },
      status: { type: 'keyword' },
      tenantId: { type: 'keyword' },
      issuedDate: { type: 'date' },
    },
  },
  invoices: {
    properties: {
      invoiceNumber: { type: 'keyword' },
      patientId: { type: 'keyword' },
      status: { type: 'keyword' },
      tenantId: { type: 'keyword' },
      invoiceDate: { type: 'date' },
      totalAmount: { type: 'float' },
    },
  },
  labTests: {
    properties: {
      testCode: { type: 'keyword' },
      name: { type: 'text', analyzer: 'standard' },
      category: { type: 'keyword' },
      tenantId: { type: 'keyword' },
    },
  },
};

/**
 * Initialize all search indices
 */
export async function initializeSearchIndices() {
  try {
    for (const [entityType, mapping] of Object.entries(INDEX_MAPPINGS)) {
      const indexName = `${INDEX_PREFIX}-${entityType}`;
      await ensureIndex(indexName, mapping);
    }
    logger.info('✅ All search indices initialized');
  } catch (error) {
    logger.error('❌ Error initializing search indices:', error);
    throw error;
  }
}

/**
 * Index a document
 */
export async function indexDocument(entityType, document) {
  try {
    const esClient = getElasticsearchClient();
    const indexName = `${INDEX_PREFIX}-${entityType}`;

    await esClient.index({
      index: indexName,
      id: document._id?.toString() || document.id,
      body: document,
    });
  } catch (error) {
    logger.error(`❌ Error indexing ${entityType}:`, error.message);
    // Don't throw - search is non-critical
  }
}

/**
 * Remove a document from index
 */
export async function removeDocument(entityType, documentId) {
  try {
    const esClient = getElasticsearchClient();
    const indexName = `${INDEX_PREFIX}-${entityType}`;

    await esClient.delete({
      index: indexName,
      id: documentId.toString(),
    });
  } catch (error) {
    logger.error(`❌ Error removing ${entityType} from index:`, error.message);
  }
}

/**
 * Search across all entities
 */
export async function globalSearch(query, tenantId, options = {}) {
  try {
    const esClient = getElasticsearchClient();
    const { page = 1, limit = 50, entityTypes = [] } = options;

    const indices = entityTypes.length > 0
      ? entityTypes.map((type) => `${INDEX_PREFIX}-${type}`)
      : Object.keys(INDEX_MAPPINGS).map((type) => `${INDEX_PREFIX}-${type}`);

    const searchQuery = {
      bool: {
        must: [
          {
            multi_match: {
              query,
              type: 'best_fields',
              fuzziness: 'AUTO',
              fields: ['*'],
            },
          },
        ],
        filter: [
          {
            term: { tenantId },
          },
        ],
      },
    };

    const result = await esClient.search({
      index: indices,
      body: {
        query: searchQuery,
        from: (page - 1) * limit,
        size: limit,
      },
    });

    return {
      hits: result.body.hits.hits.map((hit) => ({
        ...hit._source,
        _id: hit._id,
        _score: hit._score,
        _index: hit._index.replace(`${INDEX_PREFIX}-`, ''),
      })),
      total: result.body.hits.total.value,
      page,
      limit,
    };
  } catch (error) {
    logger.error('❌ Error in global search:', error.message);
    // Fallback to empty results if ElasticSearch is unavailable
    return {
      hits: [],
      total: 0,
      page: options.page || 1,
      limit: options.limit || 50,
    };
  }
}

/**
 * Search specific entity type
 */
export async function searchEntity(entityType, query, tenantId, options = {}) {
  try {
    const esClient = getElasticsearchClient();
    const indexName = `${INDEX_PREFIX}-${entityType}`;
    const { page = 1, limit = 50, filters = {} } = options;

    const searchQuery = {
      bool: {
        must: [
          {
            multi_match: {
              query,
              type: 'best_fields',
              fuzziness: 'AUTO',
            },
          },
        ],
        filter: [
          { term: { tenantId } },
          ...Object.entries(filters).map(([field, value]) => ({
            term: { [field]: value },
          })),
        ],
      },
    };

    const result = await esClient.search({
      index: indexName,
      body: {
        query: searchQuery,
        from: (page - 1) * limit,
        size: limit,
      },
    });

    return {
      hits: result.body.hits.hits.map((hit) => ({
        ...hit._source,
        _id: hit._id,
        _score: hit._score,
      })),
      total: result.body.hits.total.value,
      page,
      limit,
    };
  } catch (error) {
    logger.error(`❌ Error searching ${entityType}:`, error.message);
    return {
      hits: [],
      total: 0,
      page: options.page || 1,
      limit: options.limit || 50,
    };
  }
}

export default {
  initializeSearchIndices,
  indexDocument,
  removeDocument,
  globalSearch,
  searchEntity,
};
