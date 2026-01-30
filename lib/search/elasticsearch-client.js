/**
 * ElasticSearch Client
 * Handles connection and basic operations
 * Based on NEW-PLANS.md requirements
 */

import { Client } from '@elastic/elasticsearch';
import { logger } from '@/lib/utils/logger.js';

let client = null;

/**
 * Get or create ElasticSearch client
 */
export function getElasticsearchClient() {
  if (client) {
    return client;
  }

  const node = process.env.ELASTICSEARCH_NODE || 'http://localhost:9200';
  const username = process.env.ELASTICSEARCH_USERNAME;
  const password = process.env.ELASTICSEARCH_PASSWORD;

  const config = {
    node,
  };

  if (username && password) {
    config.auth = {
      username,
      password,
    };
  }

  client = new Client(config);

  return client;
}

/**
 * Check if ElasticSearch is available
 */
export async function checkElasticsearchHealth() {
  try {
    const esClient = getElasticsearchClient();
    const health = await esClient.cluster.health();
    return {
      available: true,
      status: health.status,
      cluster_name: health.cluster_name,
    };
  } catch (error) {
    return {
      available: false,
      error: error.message,
    };
  }
}

/**
 * Create index if it doesn't exist
 */
export async function ensureIndex(indexName, mapping = {}) {
  try {
    const esClient = getElasticsearchClient();
    const exists = await esClient.indices.exists({ index: indexName });

    if (!exists) {
      await esClient.indices.create({
        index: indexName,
        body: {
          mappings: mapping,
        },
      });
      logger.info(`✅ Created ElasticSearch index: ${indexName}`);
    }
  } catch (error) {
    logger.error(`❌ Error creating index ${indexName}:`, error.message);
    throw error;
  }
}

export default getElasticsearchClient;
